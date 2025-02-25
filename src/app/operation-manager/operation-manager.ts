import { getConfigStore } from '../store';
import { Store } from '@tauri-apps/plugin-store';
import {
  ADD_USER_GROUP_ACTION_NAME,
  DISABLE_HBLOCK_NAME,
  DISABLE_SERVICE_ACTION_NAME,
  ENABLE_HBLOCK_NAME,
  ENABLE_SERVICE_ACTION_NAME,
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

export class OperationManager {
  public pending = signal<Operation[]>([]);
  public user = signal<Nullable<string>>(null);

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
    if (entry.initialState) {
      if (!entry.checked) {
        this.addServiceDisable(entry.check.name);
      } else {
        const existing = this.findExisting(ENABLE_SERVICE_ACTION_NAME);
        if (existing) {
          this.removeFromPending(existing);
        }
      }
    } else {
      if (entry.checked) {
        this.addServiceEnable(entry.check.name);
      } else {
        const existing = this.findExisting(DISABLE_SERVICE_ACTION_NAME);
        if (existing) {
          this.removeFromPending(existing);
        }
      }
    }
  }

  handleTogglePackage(entry: Package) {
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
    this.pending.set(this.pending().filter((op: Operation) => op.name !== operation.name));
    void debug(`Removed ${operation.name} operation`);
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
    this.pending().push(operation);
  }

  addPackageRemoval(packages: string[]) {
    const operation: Operation = {
      name: 'remove',
      prettyName: 'Remove apps',
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
    this.pending().push(operation);
  }

  addServiceEnable(name: string) {
    const operation: Operation = {
      name: ENABLE_SERVICE_ACTION_NAME,
      prettyName: 'Enable service',
      sudo: true,
      status: 'pending',
      commandArgs: [name],
      command: (args?: string[]): string => {
        void info('Enabling service');
        return `systemctl enable --now ${args![0]}`;
      },
    };
    this.pending().push(operation);
  }

  addServiceDisable(name: string) {
    const operation: Operation = {
      name: DISABLE_SERVICE_ACTION_NAME,
      prettyName: 'Disable service',
      sudo: true,
      status: 'pending',
      commandArgs: [name],
      command: (args?: string[]): string => {
        void info('Disabling service');
        return `systemctl disable --now ${args![0]}`;
      },
    };
    this.pending().push(operation);
  }

  addAddUserToGroup(action: SystemToolsSubEntry) {
    const operation: Operation = {
      name: ADD_USER_GROUP_ACTION_NAME,
      prettyName: action.description,
      sudo: true,
      status: 'pending',
      commandArgs: [action.check.name],
      command: (args?: string[]): string => {
        void info(`Adding user ${this.user} to group ${action.check.name}`);
        return `gpasswd -a ${this.user} ${args![0]}`;
      },
    };
    this.pending().push(operation);
  }

  addRemoveUserFromGroup(action: SystemToolsSubEntry) {
    const operation: Operation = {
      name: REMOVE_USER_GROUP_ACTION_NAME,
      prettyName: action.description,
      sudo: true,
      status: 'pending',
      commandArgs: [action.check.name],
      command: (args?: string[]): string => {
        void info(`Removing user ${this.user} from group ${action.check.name}`);
        return `gpasswd -d ${this.user} ${args![0]}`;
      },
    };
    this.pending().push(operation);
  }

  toggleHblock(initialState: boolean) {
    const existing: Operation | undefined = this.findExisting(ENABLE_HBLOCK_NAME);
    if (existing) {
      if (initialState) {
        this.removeFromPending(existing);
        this.addRemoveHblock();
      } else {
        this.removeFromPending(existing);
      }
    } else {
      this.addEnableHblock();
    }
  }

  addEnableHblock() {
    this.addPackageInstallation(['hblock']);
    const operation: Operation = {
      name: ENABLE_HBLOCK_NAME,
      prettyName: 'Enable hblock',
      sudo: true,
      status: 'pending',
      order: 10,
      commandArgs: [],
      command: (): string => {
        void info('Enabling hblock');
        return 'systemctl enable --now hblock.timer && hblock -S none -D none';
      },
    };
    this.pending().push(operation);
  }

  addRemoveHblock() {
    this.addPackageRemoval(['hblock']);
    const operation: Operation = {
      name: DISABLE_HBLOCK_NAME,
      prettyName: 'Remove hblock',
      sudo: true,
      status: 'pending',
      order: 10,
      commandArgs: [],
      command: (): string => {
        void info('Enabling hblock');
        return 'systemctl disable --now hblock.timer && hblock -S none -D none';
      },
    };
    this.pending().push(operation);
  }

  addNewDnsServer(dns: DnsProvider) {
    const operation: Operation = {
      name: SET_NEW_DNS_SERVER,
      prettyName: 'Add new DNS server',
      sudo: true,
      status: 'pending',
      commandArgs: [],
      command: (args?: string[]): Command<string> => {
        void info('Adding new DNS server');
        return Command.create('sidecar/change-dns.sh', dns.ips);
      },
    };
  }

  addRemoveDnsServer() {
    const operation: Operation = {
      name: RESET_DNS_SERVER,
      prettyName: 'Remove DNS server',
      sudo: true,
      status: 'pending',
      commandArgs: [],
      command: (): Command<string> => {
        void info('Removing DNS server');
        return Command.create('sidecar/change-dns.sh', ['0.0.0.0']);
      },
    };
  }
}
