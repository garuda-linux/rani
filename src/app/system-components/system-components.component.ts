import { Component, inject, model, OnInit, signal } from '@angular/core';
import { AppService } from '../app.service';
import { debug, info, trace } from '@tauri-apps/plugin-log';
import { Operation, SystemdService, SystemToolsEntry, SystemToolsSubEntry } from '../interfaces';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { ProgressBar } from 'primeng/progressbar';
import {
  ADD_USER_GROUP_ACTION_NAME,
  DISABLE_SERVICE_ACTION_NAME,
  ENABLE_SERVICE_ACTION_NAME,
  INSTALL_ACTION_NAME,
  REMOVE_ACTION_NAME,
  REMOVE_USER_GROUP_ACTION_NAME,
} from '../constants';
import { DynamicCheckboxesComponent } from '../dynamic-checkboxes/dynamic-checkboxes.component';

@Component({
  selector: 'app-system-components',
  imports: [FormsModule, TranslocoDirective, ProgressBar, DynamicCheckboxesComponent],
  templateUrl: './system-components.component.html',
  styleUrl: './system-components.component.css',
})
export class SystemComponentsComponent implements OnInit {
  installedPackages = signal<string[]>([]);
  loading = signal<boolean>(true);
  selectedComponents = model<any[]>([]);
  systemdServices = signal<SystemdService[]>([]);
  userGroups = signal<string[]>([]);

  sections: SystemToolsEntry[] = [
    {
      name: 'systemTools.audio.title',
      icon: 'pi pi-volume-up',
      sections: [
        {
          name: 'alsa-support',
          fancyTitle: 'systemTools.audio.alsa.title',
          description: 'systemTools.audio.alsa.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'alsa-support' },
        },
        {
          name: 'jack-support',
          fancyTitle: 'systemTools.audio.jack.title',
          description: 'systemTools.audio.jack.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'jack-support' },
        },
        {
          name: 'pulseaudio-support',
          fancyTitle: 'systemTools.audio.pulseaudio.title',
          description: 'systemTools.audio.pulseaudio.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'pulseaudio-support' },
        },
        {
          name: 'pipewire-support',
          fancyTitle: 'systemTools.audio.pipewire.title',
          description: 'systemTools.audio.pipewire.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'pipewire-support' },
        },
        {
          name: 'group-realtime',
          fancyTitle: 'systemTools.audio.userRealtime.title',
          description: 'systemTools.audio.userRealtime.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'group', name: 'realtime' },
        },
      ],
    },
    {
      name: 'systemTools.virtualization.title',
      icon: 'pi pi-desktop',
      sections: [
        {
          name: 'virt-manager',
          fancyTitle: 'systemTools.virtualization.virtManager.title',
          description: 'systemTools.virtualization.virtManager.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'virt-manager-meta' },
        },
        {
          name: 'enabled-libvirtd',
          fancyTitle: 'systemTools.virtualization.libvirtdEnabled.title',
          description: 'systemTools.virtualization.libvirtdEnabled.description',
          checked: false,
          disabler: 'virt-manager',
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'libvirtd.service' },
        },
        {
          name: 'group-vboxusers',
          fancyTitle: 'systemTools.virtualization.userVboxUsers.title',
          description: 'systemTools.virtualization.userVboxUsers.description',
          checked: false,
          disabler: 'virtualbox',
          handler: () => {},
          initialState: false,
          check: { type: 'group', name: 'vboxusers' },
        },

        {
          name: 'virtualbox',
          fancyTitle: 'systemTools.virtualization.virtualbox.title',
          description: 'systemTools.virtualization.virtualbox.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'group', name: 'virtualbox-meta' },
        },
        {
          name: 'group-libvirt',
          fancyTitle: 'systemTools.virtualization.userLibvirt.title',
          description: 'systemTools.virtualization.userLibvirt.description',
          checked: false,
          disabler: 'virt-manager',
          handler: () => {},
          initialState: false,
          check: { type: 'group', name: 'libvirt' },
        },
        {
          name: 'group-kvm',
          fancyTitle: 'systemTools.virtualization.userKvm.title',
          description: 'systemTools.virtualization.userKvm.description',
          checked: false,
          disabler: 'virt-manager',
          handler: () => {},
          initialState: false,
          check: { type: 'group', name: 'kvm' },
        },
        {
          name: 'qemu',
          fancyTitle: 'systemTools.virtualization.qemu.title',
          description: 'systemTools.virtualization.qemu.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'qemu' },
        },
        {
          name: 'virtualboxKvm',
          fancyTitle: 'systemTools.virtualization.virtualboxKvm.title',
          description: 'systemTools.virtualization.virtualboxKvm.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'qemu-kvm' },
        },
        {
          name: 'docker',
          fancyTitle: 'systemTools.virtualization.docker.title',
          description: 'systemTools.virtualization.docker.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'docker' },
        },
        {
          name: 'group-docker',
          fancyTitle: 'systemTools.virtualization.userDocker.title',
          description: 'systemTools.virtualization.userDocker.description',
          checked: false,
          disabler: 'docker',
          handler: () => {},
          initialState: false,
          check: { type: 'group', name: 'docker' },
        },
        {
          name: 'enabled-docker',
          fancyTitle: 'systemTools.virtualization.dockerEnabled.title',
          description: 'systemTools.virtualization.dockerEnabled.description',
          checked: false,
          disabler: 'docker',
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'docker.service' },
        },
        {
          name: 'podman',
          fancyTitle: 'systemTools.virtualization.podman.title',
          description: 'systemTools.virtualization.podman.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'podman' },
        },
      ],
    },
    {
      name: 'systemTools.network.title',
      icon: 'pi pi-globe',
      sections: [
        {
          name: 'networkManager',
          fancyTitle: 'systemTools.network.networkManager.title',
          description: 'systemTools.network.networkManager.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'networkmanager' },
        },
        {
          name: 'enabled-networkManager',
          fancyTitle: 'systemTools.network.networkManagerEnabled.title',
          description: 'systemTools.network.networkManagerEnabled.description',
          checked: false,
          disabler: 'networkManager',
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'NetworkManager.service' },
        },
        {
          name: 'enabled-modemManager',
          fancyTitle: 'systemTools.network.modemManagerEnabled.title',
          description: 'systemTools.network.modemManagerEnabled.description',
          checked: false,
          disabler: 'networkManager',
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'ModemManager.service' },
        },
      ],
    },
    {
      name: 'systemTools.bluetooth.title',
      icon: 'pi pi-bluetooth',
      sections: [
        {
          name: 'bluetooth',
          fancyTitle: 'systemTools.bluetooth.bluetooth.title',
          description: 'systemTools.bluetooth.bluetooth.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'bluetooth-support' },
        },
        {
          name: 'enabled-bluetooth',
          fancyTitle: 'systemTools.bluetooth.bluetoothEnabled.title',
          description: 'systemTools.bluetooth.bluetoothEnabled.description',
          checked: false,
          disabler: 'bluetooth',
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'bluetooth.service' },
        },
        {
          name: 'user-bluetooth',
          fancyTitle: 'systemTools.bluetooth.userBluetooth.title',
          description: 'systemTools.bluetooth.userBluetooth.description',
          checked: false,
          disabler: 'bluetooth',
          handler: () => {},
          initialState: false,
          check: { type: 'group', name: 'lp' },
        },
        {
          name: 'autoConnect',
          fancyTitle: 'systemTools.bluetooth.autoConnect.title',
          description: 'systemTools.bluetooth.autoConnect.description',
          checked: false,
          disabler: 'bluetooth',
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'bluetooth-autoconnect' },
        },
        {
          name: 'autoConnect-enabled',
          fancyTitle: 'systemTools.bluetooth.autoConnectEnabled.title',
          description: 'systemTools.bluetooth.autoConnectEnabled.description',
          checked: false,
          disabler: 'autoConnect',
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'bluetooth-autoconnect.service' },
        },
      ],
    },
    {
      name: 'systemTools.printing.title',
      icon: 'pi pi-print',
      sections: [
        {
          name: 'printing-support',
          fancyTitle: 'systemTools.printing.printingSupport.title',
          description: 'systemTools.printing.printingSupport.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'printing-support' },
        },
        {
          name: 'scanning-support',
          fancyTitle: 'systemTools.printing.scanningSupport.title',
          description: 'systemTools.printing.scanningSupport.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'scanning-support' },
        },
        {
          name: 'enabled-cups',
          fancyTitle: 'systemTools.printing.cupsEnabled.title',
          description: 'systemTools.printing.cupsEnabled.description',
          checked: false,
          disabler: 'printing-support',
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'cups.service' },
        },
        {
          name: 'enabled-saned',
          fancyTitle: 'systemTools.printing.sanedEnabled.title',
          description: 'systemTools.printing.sanedEnabled.description',
          checked: false,
          disabler: 'printing-support',
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'saned.service' },
        },
        {
          name: 'group-cups',
          fancyTitle: 'systemTools.printing.userCups.title',
          description: 'systemTools.printing.userCups.description',
          checked: false,
          disabler: 'printing-support',
          handler: () => {},
          initialState: false,
          check: { type: 'group', name: 'cups' },
        },
        {
          name: 'group-scanner',
          fancyTitle: 'systemTools.printing.userScanner.title',
          description: 'systemTools.printing.userScanner.description',
          checked: false,
          disabler: 'scanning-support',
          handler: () => {},
          initialState: false,
          check: { type: 'group', name: 'scanning' },
        },
        {
          name: 'group-sys',
          fancyTitle: 'systemTools.printing.userSys.title',
          description: 'systemTools.printing.userSys.description',
          checked: false,
          disabler: 'printing-support',
          handler: () => {},
          initialState: false,
          check: { type: 'group', name: 'sys' },
        },
      ],
    },
    {
      name: 'systemTools.firewall.title',
      icon: 'pi pi-shield',
      sections: [
        {
          name: 'ufw',
          fancyTitle: 'systemTools.firewall.ufw.title',
          description: 'systemTools.firewall.ufw.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'ufw' },
        },
        {
          name: 'enabled-ufw',
          fancyTitle: 'systemTools.firewall.ufwEnabled.title',
          description: 'systemTools.firewall.ufwEnabled.description',
          checked: false,
          disabler: 'ufw',
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'ufw.service' },
        },
        {
          name: 'firewalld',
          fancyTitle: 'systemTools.firewall.firewalld.title',
          description: 'systemTools.firewall.firewalld.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'firewalld' },
        },
        {
          name: 'enabled-firewalld',
          fancyTitle: 'systemTools.firewall.firewalldEnabled.title',
          description: 'systemTools.firewall.firewalldEnabled.description',
          checked: false,
          disabler: 'firewalld',
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'firewalld.service' },
        },
        {
          name: 'opensnitch',
          fancyTitle: 'systemTools.firewall.opensnitch.title',
          description: 'systemTools.firewall.opensnitch.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'opensnitch' },
        },
        {
          name: 'enabled-opensnitch',
          fancyTitle: 'systemTools.firewall.opensnitchEnabled.title',
          description: 'systemTools.firewall.opensnitchEnabled.description',
          checked: false,
          disabler: 'opensnitch',
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'opensnitch.service' },
        },
      ],
    },
  ];

  private readonly appService = inject(AppService);

  async ngOnInit(): Promise<void> {
    void this.refreshUi();
  }

  async refreshUi(): Promise<void> {
    this.loading.set(true);

    const checkPromises: Promise<any[]>[] = [this.getActiveServices(), this.getInstalledPkgs(), this.getUserGroups()];
    const [services, pkgs, groups] = await Promise.all(checkPromises);

    this.systemdServices.set(services);
    this.installedPackages.set(pkgs);
    this.userGroups.set(groups);

    for (const service of this.sections) {
      void trace(`Checking ${service.name}`);

      for (const entry of service.sections) {
        switch (entry.check.type) {
          case 'pkg': {
            void trace(`Checking package ${entry.check.name} as pkg`);
            const installed: boolean = this.installedPackages().includes(entry.check.name);
            [entry.checked, entry.initialState] = [installed, installed];

            if (installed) {
              void trace(`Package ${entry.check.name} is ${installed}`);
              this.selectedComponents.set([...this.selectedComponents(), entry]);
            }
            break;
          }
          case 'service': {
            void trace(`Checking service ${entry.check.name} as service`);
            void trace(JSON.stringify(this.systemdServices()));
            const service: SystemdService | undefined = this.systemdServices().find((s) => s.unit === entry.check.name);

            if (service) {
              const shallCheck: boolean = service.active === 'active' && service.sub === 'running';
              [entry.checked, entry.initialState] = [shallCheck, shallCheck];

              void trace(`Service ${entry.check.name} is ${shallCheck}`);
              this.selectedComponents.set([...this.selectedComponents(), entry]);
            }
            break;
          }
          case 'group': {
            void trace(`Checking group ${entry.check.name} as group`);
            const group: boolean = this.userGroups().includes(entry.check.name);
            [entry.checked, entry.initialState] = [group, group];

            if (group) {
              void trace(`Group ${entry.check.name} is ${group}`);
              this.selectedComponents.set([...this.selectedComponents(), entry]);
            }
            break;
          }
        }
      }
    }

    await this.checkDisabled();
    this.loading.set(false);
    void debug(JSON.stringify(this.sections));
  }

  async processPackageChange(
    type: typeof INSTALL_ACTION_NAME | typeof REMOVE_ACTION_NAME,
    pkg: SystemToolsSubEntry,
  ): Promise<boolean> {
    const existingOperation: Operation | undefined = this.appService
      .pendingOperations()
      .find((operation) => operation.name === type);
    const existingOppositeOperation: Operation | undefined = this.appService
      .pendingOperations()
      .find(
        (operation) => operation.name === (type === INSTALL_ACTION_NAME ? REMOVE_ACTION_NAME : INSTALL_ACTION_NAME),
      );

    void trace(`Checking for existing operation ${type}, found: ${existingOperation !== undefined}`);
    void trace(`Package initial state: ${pkg.initialState}`);

    const checked = this.selectedComponents().find((e) => e.name === pkg.name) !== undefined;
    if (existingOperation && pkg.initialState !== pkg.checked) {
      void debug(`Adding ${pkg.check.name} to existing operation ${type}`);
      existingOperation.commandArgs.push(pkg.check.name);
    } else if (existingOperation && pkg.initialState === checked) {
      await this.processRemoval(existingOperation, pkg);
    } else if (!existingOperation && pkg.initialState !== checked) {
      this.addToInstallAction(pkg);
    } else if (!existingOperation && pkg.initialState === checked) {
      if (existingOppositeOperation) await this.processRemoval(existingOppositeOperation, pkg);
      return true;
    }

    return existingOperation !== undefined;
  }

  addToRemoveAction(pkg: SystemToolsSubEntry): void {
    const operation: Operation = {
      name: REMOVE_ACTION_NAME,
      prettyName: 'Remove apps',
      sudo: true,
      status: 'pending',
      commandArgs: [pkg.check.name],
      command: (args?: string[]): string => {
        void info('Removing packages');
        return `pacman --noconfirm -Rns ${args?.join(' ')}`;
      },
    };
    this.appService.pendingOperations().push(operation);
  }

  addToInstallAction(pkg: SystemToolsSubEntry): void {
    const operation: Operation = {
      name: INSTALL_ACTION_NAME,
      prettyName: 'Install apps',
      sudo: true,
      status: 'pending',
      commandArgs: [pkg.check.name],
      command: (args?: string[]): string => {
        void info('Installing packages');
        const allPkgs: string[] = [];
        for (const arg of args!) {
          if (arg.includes(',')) allPkgs.push(...arg.split(','));
          else allPkgs.push(arg);
        }
        return `pacman --noconfirm -S ${allPkgs.join(' ')}`;
      },
    };
    this.appService.pendingOperations().push(operation);
  }

  async processChange(entry: SystemToolsSubEntry) {
    debug(`Processing change for ${entry.name}`);
    switch (entry.check.type) {
      case 'pkg': {
        const isSelected = this.selectedComponents().find((e) => e.name === entry.name) !== undefined;
        if (entry.initialState && !isSelected) {
          await this.processPackageChange(REMOVE_ACTION_NAME, entry);
        } else if (!entry.initialState && isSelected) {
          await this.processPackageChange(INSTALL_ACTION_NAME, entry);
        } else {
          await this.processPackageChange(REMOVE_ACTION_NAME, entry);
        }
        break;
      }
      case 'service': {
        if (entry.checked) {
          await this.processServiceChange(entry, ENABLE_SERVICE_ACTION_NAME);
        } else {
          await this.processServiceChange(entry, DISABLE_SERVICE_ACTION_NAME);
        }
        break;
      }
      case 'group': {
        if (entry.checked) {
          await this.processGroupChange(entry, ADD_USER_GROUP_ACTION_NAME);
        } else {
          await this.processGroupChange(entry, REMOVE_USER_GROUP_ACTION_NAME);
        }
        break;
      }
    }
  }

  protected async checkDisabled(): Promise<void> {
    for (const section of this.sections) {
      for (const entry of section.sections) {
        if (!entry.disabler) continue;
        const findDisabler = () => {
          for (const entry of this.selectedComponents()) {
            if (entry.name === entry.disabler) {
              return entry;
            }
          }
          return null;
        };

        const disabler: SystemToolsSubEntry = findDisabler();
        if (entry.initialState) {
          void trace(`Leaving enabled ${entry.name}, initial state is true`);
          entry.disabled = false;
        } else if (!disabler) {
          void trace(`Disabling ${entry.name}, no disabler in selected found`);
          entry.disabled = true;
        }
      }
    }
  }

  private async getInstalledPkgs(): Promise<string[]> {
    const cmd = `pacman -Qq`;
    const result: string[] | null = await this.appService.getCommandOutput<string[]>(cmd, (stdout: string) =>
      stdout.split('\n'),
    );

    if (result) return result;
    return [];
  }

  private async getActiveServices(): Promise<SystemdService[]> {
    const cmd = 'systemctl list-units --type service --full --all --output json --no-pager';
    const result: SystemdService[] | null = await this.appService.getCommandOutput<SystemdService[]>(
      cmd,
      (stdout: string) => JSON.parse(stdout),
    );

    if (result) return result;
    return [];
  }

  private async getUserGroups(): Promise<string[]> {
    const cmd = 'groups';
    const result: string[] | null = await this.appService.getCommandOutput<string[]>(cmd, (stdout: string) =>
      stdout.split(' '),
    );

    if (result) return result;
    return [];
  }

  private async processServiceChange(
    entry: SystemToolsSubEntry,
    action: typeof DISABLE_SERVICE_ACTION_NAME | typeof ENABLE_SERVICE_ACTION_NAME,
  ) {
    const existingOperation: Operation | undefined = this.appService
      .pendingOperations()
      .find((op) => op.name === entry.name);

    if (existingOperation) {
      await this.processRemoval(existingOperation, entry);
    } else {
      let cmd: string;
      if (action === DISABLE_SERVICE_ACTION_NAME) {
        cmd = `sudo systemctl disable --now ${entry.check.name}`;
        void trace(`Disabling ${entry.check.name}`);
      } else if (action === ENABLE_SERVICE_ACTION_NAME) {
        cmd = `sudo systemctl enable --now ${entry.check.name}`;
        void trace(`Enabling ${entry.check.name}`);
      }

      const operation: Operation = {
        name: entry.name,
        prettyName: entry.fancyTitle,
        command: (): string => cmd,
        commandArgs: [],
        hasOutput: true,
        sudo: true,
        status: 'pending',
      };
      this.appService.pendingOperations().push(operation);
    }
  }

  private async processGroupChange(
    entry: SystemToolsSubEntry,
    action: typeof ADD_USER_GROUP_ACTION_NAME | typeof REMOVE_USER_GROUP_ACTION_NAME,
  ): Promise<void> {
    const user: string | null = await this.appService.getCommandOutput<string>('whoami', (stdout: string) => stdout);
    if (!user) {
      this.appService.messageToastService.error('Error', 'Could not get the current user');
      return;
    }

    const existingOperation: Operation | undefined = this.appService
      .pendingOperations()
      .find((op) => op.name === entry.name);

    if (existingOperation) {
      await this.processRemoval(existingOperation, entry);
    } else {
      let cmd: string;
      if (action === REMOVE_USER_GROUP_ACTION_NAME) {
        cmd = `sudo gpasswd -d ${user} ${entry.check.name}`;
        void trace(`Removing ${user} from group ${entry.check.name}`);
      } else if (action === ADD_USER_GROUP_ACTION_NAME) {
        cmd = `sudo usermod -aG ${entry.check.name} ${user}`;
        void trace(`Adding ${user} to group ${entry.check.name}`);
      }

      const operation: Operation = {
        name: entry.name,
        prettyName: action,
        command: (): string => cmd,
        commandArgs: [],
        hasOutput: false,
        sudo: true,
        status: 'pending',
      };
      this.appService.pendingOperations().push(operation);
    }
  }

  private async processRemoval(operation: Operation, entry: SystemToolsSubEntry): Promise<void> {
    if (operation.commandArgs.includes(entry.check.name)) {
      operation.commandArgs.splice(operation.commandArgs.indexOf(entry.check.name), 1);
      void trace(`Removing ${entry.check.name} from cmdline args`);
    } else {
      this.appService.pendingOperations().splice(this.appService.pendingOperations().indexOf(operation), 1);
      void trace(`Removing ${entry.check.name} operation`);
    }
  }
}
