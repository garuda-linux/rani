import { getConfigStore } from '../store';
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
  SET_NEW_DNS_SERVER,
} from './interfaces';
import { INSTALL_ACTION_NAME } from '../constants';
import { debug, error, info, trace } from '@tauri-apps/plugin-log';
import { Package, SystemToolsSubEntry } from '../interfaces';
import { Child, ChildProcess, Command, TerminatedPayload } from '@tauri-apps/plugin-shell';
import { Nullable } from 'primeng/ts-helpers';
import { EventEmitter, signal } from '@angular/core';
import { DnsProvider } from '../system-settings/types';
import { type PrivilegeManager, PrivilegeManagerInstance } from '../privilege-manager/privilege-manager';
import { TranslocoService } from '@jsverse/transloco';

export class OperationManager {
  public currentOperation = signal<Nullable<string>>(null);
  public loading = signal<boolean>(false);
  public operationOutput = signal<Nullable<string>>(null);
  public pending = signal<Operation[]>([]);
  public user = signal<Nullable<string>>(null);

  public operationOutputEmitter = new EventEmitter<string>();
  public operationNewEmitter = new EventEmitter<string>();

  private privilegeManager: PrivilegeManager = PrivilegeManagerInstance;
  private store: Nullable<Store> = null;

  constructor(private translocoService: TranslocoService) {
    void this.init();
  }

  async init() {
    this.store = await getConfigStore();

    const savedOperations: Operation[] | undefined = await this.store.get<Operation[]>('queue');
    if (savedOperations && savedOperations.length > 0) {
      this.pending.set(savedOperations);
    }

    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', 'whoami']).execute();
    if (result.code !== 0) {
      void error('Could not get user');
    } else {
      this.user.set(result.stdout.trim());
    }
  }

  handleToggleSystemTools(entry: SystemToolsSubEntry) {
    void debug('Toggling system tools entry');

    if (entry.check.type === 'pkg') {
      this.handleTogglePackage({
        pkgname: [entry.check.name],
        selected: entry.initialState,
        initialState: entry.checked,
      });
      return;
    }

    if (entry.initialState) {
      if (!entry.checked) {
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
      if (entry.checked) {
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

  handleTogglePackage(entry: { pkgname: string[]; initialState: boolean; selected: boolean } | Package) {
    void debug('Toggling package entry');
    if (entry.initialState) {
      if (!entry.selected) {
        this.addPackageRemoval(entry.pkgname);
      } else {
        const existing: Operation | undefined = this.findExisting(INSTALL_ACTION_NAME);
        if (existing) {
          for (const pkgname of entry.pkgname) {
            this.removeFromArgs(existing, pkgname);
          }
          if (existing.commandArgs.length === 0) {
            this.removeFromPending(existing);
          }
        }
      }
    } else {
      if (entry.selected) {
        this.addPackageInstallation(entry.pkgname);
      } else {
        const existing: Operation | undefined = this.findExisting(REMOVE_ACTION_NAME);
        if (existing) {
          for (const pkgname of entry.pkgname) {
            this.removeFromArgs(existing, pkgname);
          }
          if (existing.commandArgs.length === 0) {
            this.removeFromPending(existing);
          }
        }
      }
    }
  }

  removeFromArgs(operation: Operation, arg: string) {
    const index: number = operation.commandArgs.indexOf(arg);
    operation.commandArgs.splice(index, 1);
    void debug(`Removed ${arg} from args`);
  }

  removeFromPending(operation: Operation): void {
    void debug(`Removing ${operation.name} operation`);
    this.pending.update((value) => value.filter((op: Operation) => op.name !== operation.name));
  }

  findExisting(opType: OperationType): Operation | undefined {
    return this.pending().find((op: Operation) => op.name === opType);
  }

  addPackageInstallation(packages: string[]) {
    const operation: Operation = {
      name: INSTALL_ACTION_NAME,
      prettyName: 'Install apps',
      sudo: true,
      status: 'pending',
      commandArgs: packages,
      command: (args?: string[]): string => {
        void info('Installing packages');
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
        void info('Removing packages');
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
        void info('Enabling service');
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
        void info('Disabling service');
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
        void info(`Adding user ${this.user} to group ${action.check.name}`);
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
        void info(`Removing user ${this.user} from group ${action.check.name}`);
        return `gpasswd -d ${this.user} ${args![0]}`;
      },
    };
    this.pending.update((value) => [...value, operation]);
  }

  toggleHblock(initialState: boolean, newState: boolean): void {
    void debug('Toggling hblock');
    const currentAction = newState ? ENABLE_HBLOCK_NAME : DISABLE_HBLOCK_NAME;
    const existing: Operation | undefined = this.findExisting(currentAction);

    if (!initialState && newState && !existing) {
      this.addEnableHblock();
    } else if (initialState && !newState && !existing) {
      this.addRemoveHblock();
    } else if (existing) {
      this.removeFromPending(existing);
    }
  }

  addEnableHblock() {
    void debug('Adding hblock');
    this.addPackageInstallation(['hblock']);
    const operation: Operation = {
      name: ENABLE_HBLOCK_NAME,
      prettyName: 'operation.enableHblock',
      sudo: true,
      status: 'pending',
      order: 10,
      commandArgs: [],
      command: (): string => {
        void info('Enabling hblock');
        return 'systemctl enable --now hblock.timer && hblock -S none -D none';
      },
    };
    this.pending.update((value) => [...value, operation]);
  }

  addRemoveHblock() {
    void debug('Removing hblock');
    this.addPackageRemoval(['hblock']);
    const operation: Operation = {
      name: DISABLE_HBLOCK_NAME,
      prettyName: 'operation.disableHblock',
      sudo: true,
      status: 'pending',
      order: 10,
      commandArgs: [],
      command: (): string => {
        void info('Enabling hblock');
        return 'systemctl disable --now hblock.timer && hblock -S none -D none';
      },
    };
    this.pending.update((value) => [...value, operation]);
  }

  toggleDnsServer(initialState: boolean, newState: boolean, dns: DnsProvider): void {
    void debug('Toggling DNS server');
    if (initialState && !newState) {
      this.addRemoveDnsServer();
    } else if (initialState && newState) {
      this.removeFromPending(this.findExisting(RESET_DNS_SERVER)!);
    } else if (!initialState && newState) {
      this.addNewDnsServer(dns);
    } else if (!initialState && !newState) {
      this.removeFromPending(this.findExisting(SET_NEW_DNS_SERVER)!);
    }
  }

  addNewDnsServer(dns: DnsProvider) {
    void debug('Adding new DNS server');
    const operation: Operation = {
      name: SET_NEW_DNS_SERVER,
      prettyName: 'operation.setNewDnsServer',
      sudo: true,
      status: 'pending',
      commandArgs: [],
      command: (args?: string[]): Command<string> => {
        void info('Adding new DNS server');
        return Command.create('sidecar/change-dns.sh', dns.ips);
      },
    };
    this.pending.update((value) => [...value, operation]);
  }

  addRemoveDnsServer(): void {
    void debug('Removing DNS server');
    const operation: Operation = {
      name: RESET_DNS_SERVER,
      prettyName: 'operation.resetDnsServer',
      sudo: true,
      status: 'pending',
      commandArgs: [],
      command: (): Command<string> => {
        void info('Removing DNS server');
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
    void debug(`Getting command output: ${cmd}`);

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
      void error(`Failed running command: ${cmd}`);
      return null;
    }
  }

  /**
   * Execute all pending operations. This will run the operations in order, updating the status and output of each operation.
   * If an operation fails, the status will be set to 'error'.
   */
  async executeOperations(): Promise<void> {
    void info('Executing pending operations');
    await this.prepareRun();

    let i: number = 1;
    for (const operation of this.pending()) {
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
    void info(operation.name);
    operation.status = 'running';
    this.operationOutput.set('');
    this.operationNewEmitter.emit(operation.name);
    this.currentOperation.set(
      `${this.translocoService.translate(operation.prettyName)} (${i}/${this.pending().length})`,
    );

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

      cmd.stdout.on('data', (data) => this.operationOutput.update((content) => content + data));
      cmd.stderr.on('data', (data) => this.operationOutput.update((content) => content + data));
      cmd.on('close', (code) => {
        finished = code;
        void info(`child process exited with code ${code.code}`);
      });

      const child: Child = await cmd.spawn();
      void trace(`Process spawned with pid ${child.pid}`);

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
        void error(`Something exploded while running cmd: ${err}'`);
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

    await this.prepareRun();
    await this.executeOperation(operation);
  }

  /**
   * Run the operation, resetting the terminal output and showing the terminal.
   * Closes the drawer after ensuring the sudo password exists.
   */
  private async prepareRun(): Promise<void> {
    this.operationOutput.set('');

    if (this.pending().find((op) => op.sudo)) {
      await this.privilegeManager.getSudoPassword();
    }
  }
}
