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
import { debug, error, info } from '@tauri-apps/plugin-log';
import { Package, SystemToolsSubEntry } from '../interfaces';
import { ChildProcess, Command } from '@tauri-apps/plugin-shell';
import { Nullable } from 'primeng/ts-helpers';
import { signal } from '@angular/core';
import { DnsProvider } from '../system-settings/types';
import { type PrivilegeManager, PrivilegeManagerInstance } from '../privilege-manager/privilege-manager';

export class OperationManager {
  public pending = signal<Operation[]>([]);
  public user = signal<Nullable<string>>(null);

  privilegeManager: PrivilegeManager = PrivilegeManagerInstance;
  store: Nullable<Store> = null;

  constructor() {
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
      prettyName: 'opeation.setNewDnsServer',
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

  addRemoveDnsServer() {
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
   */
  async getCommandOutput<T>(cmd: string, transformator: Function): Promise<T | null> {
    void debug(`Getting command output: ${cmd}`);
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

    if (result.code === 0) {
      return transformator(result.stdout) as T;
    } else {
      void error(`Failed running command: ${cmd}`);
      return null;
    }
  }
}
