import { Component, inject, model, OnInit, signal } from '@angular/core';
import { AppService } from '../app.service';
import { debug, trace } from '@tauri-apps/plugin-log';
import { SystemdService, SystemToolsEntry, SystemToolsSubEntry } from '../interfaces';
import { Checkbox } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { ProgressBar } from 'primeng/progressbar';

@Component({
  selector: 'app-system-components',
  imports: [Checkbox, FormsModule, TranslocoDirective, ProgressBar],
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
      name: 'audio',
      icon: 'pi pi-volume-up',
      entries: [
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
      name: 'virtualization',
      icon: 'pi pi-desktop',
      entries: [
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
      name: 'network',
      icon: 'pi pi-globe',
      entries: [
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
      name: 'bluetooth',
      icon: 'pi pi-bluetooth',
      entries: [
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
      name: 'printing',
      icon: 'pi pi-print',
      entries: [
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
      name: 'firewall',
      icon: 'pi pi-shield',
      entries: [
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

      for (const entry of service.entries) {
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

  protected async checkDisabled(): Promise<void> {
    for (const section of this.sections) {
      for (const entry of section.entries) {
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
}
