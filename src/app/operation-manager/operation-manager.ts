import { getConfigStore } from '../config/store';
import { Store } from '@tauri-apps/plugin-store';
import {
  ADD_USER_GROUP_ACTION_NAME,
  DISABLE_HBLOCK_NAME,
  DISABLE_SERVICE_ACTION_NAME,
  DISABLE_USER_SERVICE_ACTION_NAME,
  ENABLE_HBLOCK_NAME,
  ENABLE_SERVICE_ACTION_NAME,
  ENABLE_USER_SERVICE_ACTION_NAME,
  Operation,
  OperationType,
  REMOVE_ACTION_NAME,
  REMOVE_USER_GROUP_ACTION_NAME,
  RESET_DNS_SERVER,
  SET_DEFAULT_SHELL_ACTION_NAME,
  SET_NEW_DNS_SERVER,
} from './interfaces';
import { INSTALL_ACTION_NAME } from '../constants';
import { StatefulPackage, SystemToolsSubEntry } from '../interfaces';
import { Child, ChildProcess, Command, TerminatedPayload } from '@tauri-apps/plugin-shell';
import { Nullable } from 'primeng/ts-helpers';
import { EventEmitter, signal } from '@angular/core';
import { DnsProvider, ShellEntry } from '../system-settings/types';
import { type PrivilegeManager, PrivilegeManagerInstance } from '../privilege-manager/privilege-manager';
import { TranslocoService } from '@jsverse/transloco';
import { Logger } from '../logging/logging';

export class OperationManager {
  public currentOperation = signal<Nullable<string>>(null);
  public loading = signal<boolean>(false);
  public operationOutput = signal<Nullable<string>>(null);
  public pending = signal<Operation[]>([]);
  public user = signal<Nullable<string>>(null);

  public operationOutputEmitter = new EventEmitter<string>();
  public operationNewEmitter = new EventEmitter<string>();
  public requestTerminal = new EventEmitter<boolean>();

  private readonly logger = Logger.getInstance();
  private readonly privilegeManager: PrivilegeManager = PrivilegeManagerInstance;
  private store: Nullable<Store> = null;

  constructor(private translocoService: TranslocoService) {
    void this.init();
  }

  async init() {
    this.store = await getConfigStore();

    const savedOperations: Operation[] | undefined = await this.store!.get<Operation[]>('pendingOperations');
    if (savedOperations && savedOperations.length > 0) {
      this.pending.set(savedOperations);
    }

    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', 'whoami']).execute();
    if (result.code !== 0) {
      this.logger.error('Could not get user');
    } else {
      this.user.set(result.stdout.trim());
    }
  }

  handleToggleSystemTools(entry: SystemToolsSubEntry) {
    this.logger.debug('Toggling system tools entry');

    if (entry.check.type === 'pkg') {
      this.handleTogglePackage({
        pkgname: [entry.check.name],
        selected: entry.checked,
        initialState: entry.initialState,
      });
      return;
    }

    if (!entry.initialState) {
      if (entry.checked) {
        switch (entry.check.type) {
          case 'group':
            this.addAddUserToGroup(entry);
            break;
          case 'service':
            this.addServiceEnable(entry.check.name);
            break;
          case 'serviceUser':
            this.addServiceEnable(entry.check.name, true);
            break;
        }
      } else {
        switch (entry.check.type) {
          case 'group':
            this.removeFromPending(this.findExisting(ADD_USER_GROUP_ACTION_NAME)!);
            break;
          case 'service':
            this.removeFromPending(this.findExisting(ENABLE_SERVICE_ACTION_NAME)!);
            break;
          case 'serviceUser':
            this.removeFromPending(this.findExisting(ENABLE_USER_SERVICE_ACTION_NAME)!);
            break;
        }
      }
    } else {
      if (!entry.checked) {
        switch (entry.check.type) {
          case 'group':
            this.addRemoveUserFromGroup(entry);
            break;
          case 'service':
            this.addServiceDisable(entry.check.name);
            break;
          case 'serviceUser':
            this.addServiceDisable(entry.check.name, true);
            break;
        }
      } else {
        switch (entry.check.type) {
          case 'group':
            this.removeFromPending(this.findExisting(REMOVE_USER_GROUP_ACTION_NAME)!);
            break;
          case 'service':
            this.removeFromPending(this.findExisting(DISABLE_SERVICE_ACTION_NAME)!);
            break;
          case 'serviceUser':
            this.removeFromPending(this.findExisting(DISABLE_USER_SERVICE_ACTION_NAME)!);
            break;
        }
      }
    }
  }

  handleTogglePackage(entry: StatefulPackage): void {
    this.logger.debug('Toggling package entry');
    this.logger.trace(JSON.stringify(entry));

    if (entry.initialState) {
      const existing: Operation | undefined = this.findExisting(REMOVE_ACTION_NAME);

      if (!entry.selected) {
        this.logger.trace(`Removing package ${entry.pkgname} from system`);
        if (existing) {
          this.logger.trace('Adding package to existing operation');
          existing.commandArgs.push(...entry.pkgname);
        } else {
          this.logger.trace('Creating new operation');
          this.addPackageRemoval(entry.pkgname);
        }
      } else {
        if (existing) {
          this.logger.trace(`Removing packages ${entry.pkgname.join(', ')} from existing operation`);
          for (const pkgname of entry.pkgname) {
            this.removeFromArgs(existing, pkgname);
          }
        }
      }
    } else {
      const existing: Operation | undefined = this.findExisting(INSTALL_ACTION_NAME);

      if (entry.selected) {
        this.logger.trace(`Adding packages ${entry.pkgname.join(', ')} to system`);
        if (existing) {
          this.logger.trace('Adding packages to existing operation');
          existing.commandArgs.push(...entry.pkgname);
        } else {
          this.logger.trace('Creating new operation');
          this.addPackageInstallation(entry.pkgname);
        }
      } else {
        if (existing) {
          this.logger.trace(`Removing packages ${entry.pkgname.join(', ')} from existing operation`);
          for (const pkgname of entry.pkgname) {
            this.removeFromArgs(existing, pkgname);
          }
        }
      }
    }
  }

  /**
   * Remove an argument from an operation, removing the operation if it has no arguments left.
   * @param operation The operation to remove the argument from
   * @param arg The argument to remove
   */
  removeFromArgs(operation: Operation, arg: string): void {
    const index: number = operation.commandArgs.indexOf(arg);
    operation.commandArgs.splice(index, 1);
    this.logger.debug(`Removed ${arg} from args`);

    if (operation.commandArgs.length === 0) {
      this.removeFromPending(operation);
    }
  }

  /**
   * Remove an operation from the pending list.
   * @param operation The operation to remove
   */
  removeFromPending(operation: Operation): void {
    this.logger.debug(`Removing ${operation.name} operation`);
    this.pending.update((value) => value.filter((op: Operation) => op.name !== operation.name));
  }

  /**
   * Find an operation in the pending list.
   * @param opType The operation type to find
   * @returns The operation if found, otherwise undefined
   */
  findExisting(opType: OperationType): Operation | undefined {
    return this.pending().find((op: Operation) => op.name === opType);
  }

  addPackageInstallation(packages: string[]) {
    const operation: Operation = {
      name: INSTALL_ACTION_NAME,
      prettyName: 'operation.installApps',
      sudo: true,
      status: 'pending',
      commandArgs: packages,
      command: (args?: string[]): string => {
        this.logger.info('Installing packages');
        const allPkgs: string[] = [];
        for (const arg of args!) {
          if (arg.includes(',')) allPkgs.push(...arg.split(','));
          else allPkgs.push(arg);
        }
        return `pacman --needed --noconfirm -S ${allPkgs.join(' ')}`;
      },
    };
    this.pending.update((value) => [...value, operation]);
  }

  addPackageRemoval(packages: string[]) {
    const operation: Operation = {
      name: REMOVE_ACTION_NAME,
      prettyName: 'operation.removeApps',
      sudo: true,
      status: 'pending',
      commandArgs: packages,
      command: (args?: string[]): string => {
        this.logger.info('Removing packages');
        const allPkgs: string[] = [];
        for (const arg of args!) {
          if (arg.includes(',')) allPkgs.push(...arg.split(','));
          else allPkgs.push(arg);
        }
        return `pacman --noconfirm -Rns ${args!.join(' ')}`;
      },
    };
    this.pending.update((value) => [...value, operation]);
  }

  addServiceEnable(name: string, userContext = false) {
    const operation: Operation = {
      name: userContext ? ENABLE_USER_SERVICE_ACTION_NAME : ENABLE_SERVICE_ACTION_NAME,
      prettyName: 'operation.enableService',
      sudo: !userContext,
      status: 'pending',
      commandArgs: [name],
      command: (args?: string[]): string => {
        this.logger.info('Enabling service');
        return `systemctl ${userContext ? '--user' : ''} enable --now ${args![0]}`;
      },
    };
    this.pending.update((value) => [...value, operation]);
  }

  addServiceDisable(name: string, userContext = false) {
    const operation: Operation = {
      name: userContext ? DISABLE_USER_SERVICE_ACTION_NAME : DISABLE_SERVICE_ACTION_NAME,
      prettyName: 'operation.disableService',
      sudo: !userContext,
      status: 'pending',
      commandArgs: [name],
      command: (args?: string[]): string => {
        this.logger.info('Disabling service');
        return `systemctl ${userContext ? '--user' : ''} disable --now ${args![0]}`;
      },
    };
    this.pending.update((value) => [...value, operation]);
  }

  addAddUserToGroup(action: SystemToolsSubEntry) {
    const operation: Operation = {
      name: ADD_USER_GROUP_ACTION_NAME,
      prettyName: 'operation.addGroup',
      sudo: true,
      status: 'pending',
      commandArgs: [action.check.name],
      command: (args?: string[]): string => {
        this.logger.info(`Adding user ${this.user} to group ${action.check.name}`);
        return `gpasswd -a ${this.user} ${args![0]}`;
      },
    };
    this.pending.update((value) => [...value, operation]);
  }

  addRemoveUserFromGroup(action: SystemToolsSubEntry) {
    const operation: Operation = {
      name: REMOVE_USER_GROUP_ACTION_NAME,
      prettyName: 'operation.removeGroup',
      sudo: true,
      status: 'pending',
      commandArgs: [action.check.name],
      command: (args?: string[]): string => {
        this.logger.info(`Removing user ${this.user} from group ${action.check.name}`);
        return `gpasswd -d ${this.user} ${args![0]}`;
      },
    };
    this.pending.update((value) => [...value, operation]);
  }

  toggleHblock(initialState: boolean, newState: boolean): void {
    this.logger.debug('Toggling hblock');
    this.logger.trace(`Initial state: ${initialState}, new state: ${newState}`);

    const currentAction = newState ? DISABLE_HBLOCK_NAME : ENABLE_HBLOCK_NAME;
    const existing: Operation | undefined = this.findExisting(currentAction);

    if (!initialState && newState && !existing) {
      this.addEnableHblock();
    } else if (initialState && !newState && !existing) {
      this.addRemoveHblock();
    } else if (existing) {
      const currentPkgAction: Operation | undefined = this.findExisting(
        newState ? INSTALL_ACTION_NAME : REMOVE_ACTION_NAME,
      );
      if (currentPkgAction) this.removeFromArgs(currentPkgAction, 'hblock');
      this.removeFromPending(existing);
    }
  }

  addEnableHblock(): void {
    this.logger.debug('Adding hblock');

    const existing = this.findExisting(INSTALL_ACTION_NAME);
    if (!existing) {
      this.addPackageInstallation(['hblock']);
    } else {
      if (!existing.commandArgs.includes('hblock')) {
        existing.commandArgs.push('hblock');
      }
    }

    const operation: Operation = {
      name: ENABLE_HBLOCK_NAME,
      prettyName: 'operation.enableHblock',
      sudo: true,
      status: 'pending',
      order: 10,
      commandArgs: [],
      command: (): string => {
        this.logger.info('Enabling hblock');
        return 'systemctl enable --now hblock.timer && hblock -S none -D none';
      },
    };
    this.pending.update((value) => [...value, operation]);
  }

  addRemoveHblock() {
    this.logger.debug('Removing hblock');

    const existing = this.findExisting(REMOVE_ACTION_NAME);
    if (!existing) {
      this.addPackageRemoval(['hblock']);
    } else {
      if (!existing.commandArgs.includes('hblock')) {
        existing.commandArgs.push('hblock');
      }
    }

    const operation: Operation = {
      name: DISABLE_HBLOCK_NAME,
      prettyName: 'operation.disableHblock',
      sudo: true,
      status: 'pending',
      order: 10,
      commandArgs: [],
      command: (): string => {
        this.logger.info('Enabling hblock');
        return 'systemctl disable --now hblock.timer && hblock -S none -D none';
      },
    };
    this.pending.update((value) => [...value, operation]);
  }

  toggleDnsServer(initialState: boolean, dns: DnsProvider): void {
    this.logger.debug('Toggling DNS server');
    this.logger.trace(JSON.stringify(dns));
    const existing: Operation = this.findExisting(SET_NEW_DNS_SERVER)!;

    if (initialState) {
      this.removeFromPending(existing);
    } else if (dns.name === 'Default') {
      this.logger.trace('Removing DNS server, resetting to default');
      if (existing) this.removeFromPending(existing);
      this.addRemoveDnsServer();
    } else if (existing) {
      this.logger.trace(`Changing DNS server operation args to ${dns.ips.join(', ')}`);
      existing.commandArgs = dns.ips;
    } else {
      this.addNewDnsServer(dns);
    }
  }

  addNewDnsServer(dns: DnsProvider) {
    this.logger.debug('Adding new DNS server');
    const operation: Operation = {
      name: SET_NEW_DNS_SERVER,
      prettyName: 'operation.setNewDnsServer',
      sudo: true,
      status: 'pending',
      commandArgs: dns.ips,
      command: (args?: string[]): Command<string> => {
        this.logger.info('Adding new DNS server');
        return Command.create('sidecar/change-dns.sh', args);
      },
    };
    this.pending.update((value) => [...value, operation]);
  }

  addRemoveDnsServer(): void {
    this.logger.debug('Removing DNS server');
    const operation: Operation = {
      name: RESET_DNS_SERVER,
      prettyName: 'operation.resetDnsServer',
      sudo: true,
      status: 'pending',
      commandArgs: [],
      command: (): Command<string> => {
        this.logger.info('Removing DNS server');
        return Command.create('sidecar/change-dns.sh', ['0.0.0.0']);
      },
    };
    this.pending.update((value) => [...value, operation]);
  }

  /**
   * Get the output of a command and transform it using the provided function.
   * Can be used to get the output of a command and transform it into a usable format via custom parsing.
   * @param cmd The command to run.
   * @param transformator The function to transform the output of the command.
   * @param sudo Whether to run the command as sudo.
   */
  async getCommandOutput<T>(cmd: string, transformator?: Function, sudo = false): Promise<T | null> {
    this.logger.debug(`Getting command output: ${cmd}`);

    let result: ChildProcess<string>;
    if (sudo) {
      result = await this.privilegeManager.executeCommandAsSudo(cmd);
    } else {
      result = await Command.create('exec-bash', ['-c', cmd]).execute();
    }

    if (result.code === 0) {
      if (transformator) {
        return transformator(result.stdout);
      } else {
        return result.stdout as T;
      }
    } else {
      this.logger.error(`Failed running command: ${cmd}`);
      return null;
    }
  }

  /**
   * Execute all pending operations. This will run the operations in order, updating the status and output of each operation.
   * If an operation fails, the status will be set to 'error'.
   */
  async executeOperations(): Promise<void> {
    this.logger.info('Executing pending operations');
    await this.prepareRun();

    let i = 1;
    for (const operation of this.pending()) {
      if (operation.status === 'complete') {
        this.logger.debug(`Skipping operation ${operation.name} as it is already complete`);
        continue;
      }

      await this.executeOperation(operation, i);

      if (i === this.pending().length) {
        this.currentOperation.set(null);
      }
      i++;
    }
  }

  /**
   * Execute an operation, updating the status and output of the operation.
   * @param operation The operation to execute.
   * @param i The index of the operation in the pending list.
   */
  async executeOperation(operation: Operation, i = 1): Promise<void> {
    this.logger.info(operation.name);
    operation.status = 'running';
    this.operationOutput.set('');
    this.operationNewEmitter.emit(operation.name);

    if (i !== 1) {
      this.currentOperation.set(
        `${this.translocoService.translate(operation.prettyName)} (${i}/${this.pending().length})`,
      );
    } else {
      this.currentOperation.set(this.translocoService.translate(operation.prettyName));
    }

    const op = operation.command(operation.commandArgs);

    let finished: null | TerminatedPayload = null;
    if (typeof op === 'string' || 'stdout' in op) {
      let cmd: Command<string>;
      if (typeof op === 'string') {
        if (operation.sudo) {
          cmd = await this.privilegeManager.returnCommandAsSudo(op);
        } else {
          cmd = Command.create('exec-bash', ['-c', op]);
        }
      } else {
        cmd = op;
      }

      cmd.stdout.on('data', (data) => this.addTermOutput(data));
      cmd.stderr.on('data', (data) => this.addTermOutput(data));
      cmd.on('close', (code) => {
        finished = code;
        this.logger.info(`child process exited with code ${code.code}`);
      });

      const child: Child = await cmd.spawn();
      this.logger.trace(`Process spawned with pid ${child.pid}`);

      while (finished === null) {
        await new Promise((r) => setTimeout(r, 100));
      }
      operation.output = this.operationOutput()!;
      operation.status = (finished as TerminatedPayload).code === 0 ? 'complete' : 'error';
    } else {
      try {
        const output: string | void = await op;
        if (output) {
          operation.output = output;
        }
        operation.status = 'complete';
      } catch (err: any) {
        this.logger.error(`Something exploded while running cmd: ${err}'`);
        operation.output = err.message;
        operation.status = 'error';
      }
    }
  }

  /**
   * Remove all pending operations.
   */
  async clearPending(): Promise<void> {
    this.pending.set([]);
  }

  /**
   * Add output to the terminal, emitting the output to the terminal component.
   * @param output The output to add to the terminal.
   */
  addTermOutput(output: string): void {
    this.operationOutputEmitter.emit(output);
    this.operationOutput.update((content) => content + output);
  }

  /**
   * Run an operation immediately.
   * @param operation The operation to run.
   */
  async runNow(operation: Operation): Promise<void> {
    if (this.pending().find((op) => op.status === 'running')) {
      throw new Error('An operation is already running');
    }

    await this.prepareRun(operation);
    await this.executeOperation(operation);
  }

  /**
   * Toggle the default shell, adding or removing the operation from the pending list.
   * @param initialState The initial state of the shell
   * @param shellEntry The shell entry to set as the default shell
   */
  toggleShell(initialState: boolean, shellEntry: ShellEntry): void {
    this.logger.debug('Toggling shell entry');
    const existing: Operation = this.findExisting(SET_DEFAULT_SHELL_ACTION_NAME)!;

    if (initialState) {
      this.logger.trace('Removing from pending');
      this.removeFromPending(existing);
    } else if (!existing) {
      this.logger.trace('Adding to pending');
      const operation: Operation = {
        name: SET_DEFAULT_SHELL_ACTION_NAME,
        prettyName: 'operation.setDefaultShell',
        sudo: true,
        status: 'pending',
        commandArgs: [shellEntry.name],
        command: (args?: string[]): string => {
          this.logger.info(`Changing default shell to ${args![0]}`);
          return `chsh -s $(which ${args![0]}) ${this.user}`;
        },
      };
      this.pending.update((value) => [...value, operation]);
    } else if (existing) {
      this.logger.trace(`Changing command args to ${shellEntry.name}`);
      existing.commandArgs = [shellEntry.name];
    }
  }

  /**
   * Run the operation, resetting the terminal output and showing the terminal.
   * Closes the drawer after ensuring the sudo password exists.
   * @param operation The operation to run, provided in case its a direct run.
   */
  private async prepareRun(operation?: Operation): Promise<void> {
    this.operationOutput.set('');

    if (this.pending().find((op) => op.sudo)) {
      await this.privilegeManager.getSudoPassword();
    } else if (operation) {
      if (operation.sudo) {
        await this.privilegeManager.getSudoPassword();
      }
      this.requestTerminal.emit(true);
    }
  }
}
