import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SystemToolsEntry } from '../../interfaces';
import { FormsModule } from '@angular/forms';
import { DynamicCheckboxesComponent } from '../dynamic-checkboxes/dynamic-checkboxes.component';

@Component({
  selector: 'rani-system-components',
  imports: [FormsModule, DynamicCheckboxesComponent],
  templateUrl: './system-components.component.html',
  styleUrl: './system-components.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemComponentsComponent {
  sections: SystemToolsEntry[] = [
    {
      name: 'systemTools.audio.title',
      icon: 'pi pi-volume-up',
      sections: [
        {
          name: 'pipewire-support',
          fancyTitle: 'systemTools.audio.pipewire.title',
          description: 'systemTools.audio.pipewire.description',
          checked: false,
          check: { type: 'pkg', name: 'pipewire-support' },
        },
        {
          name: 'alsa-support',
          fancyTitle: 'systemTools.audio.alsa.title',
          description: 'systemTools.audio.alsa.description',
          checked: false,
          check: { type: 'pkg', name: 'alsa-support' },
        },
        {
          name: 'jack-support',
          fancyTitle: 'systemTools.audio.jack.title',
          description: 'systemTools.audio.jack.description',
          checked: false,
          check: { type: 'pkg', name: 'jack-support' },
        },
        {
          name: 'pulseaudio-support',
          fancyTitle: 'systemTools.audio.pulseaudio.title',
          description: 'systemTools.audio.pulseaudio.description',
          checked: false,
          check: { type: 'pkg', name: 'pulseaudio-support' },
        },
        {
          name: 'group-realtime',
          fancyTitle: 'systemTools.audio.userRealtime.title',
          description: 'systemTools.audio.userRealtime.description',
          checked: false,
          check: { type: 'group', name: 'realtime' },
        },
        {
          name: 'jamesdsp',
          fancyTitle: 'systemTools.audio.jamesdsp.title',
          description: 'systemTools.audio.jamesdsp.description',
          checked: false,
          disabler: 'pipewire-support',
          check: { type: 'pkg', name: 'jamesdsp' },
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
          check: { type: 'pkg', name: 'virt-manager-meta' },
        },
        {
          name: 'enabled-libvirtd',
          fancyTitle: 'systemTools.virtualization.libvirtdEnabled.title',
          description: 'systemTools.virtualization.libvirtdEnabled.description',
          checked: false,
          disabler: 'virt-manager',
          check: { type: 'service', name: 'libvirtd.service' },
        },
        {
          name: 'group-libvirt',
          fancyTitle: 'systemTools.virtualization.userLibvirt.title',
          description: 'systemTools.virtualization.userLibvirt.description',
          checked: false,
          disabler: 'virt-manager',
          check: { type: 'group', name: 'libvirt' },
        },
        {
          name: 'group-kvm',
          fancyTitle: 'systemTools.virtualization.userKvm.title',
          description: 'systemTools.virtualization.userKvm.description',
          checked: false,
          disabler: ['virt-manager', 'qemu'],
          check: { type: 'group', name: 'kvm' },
        },
        {
          name: 'qemu',
          fancyTitle: 'systemTools.virtualization.qemu.title',
          description: 'systemTools.virtualization.qemu.description',
          checked: false,
          check: { type: 'pkg', name: 'qemu-desktop' },
        },
        {
          name: 'virtualbox',
          fancyTitle: 'systemTools.virtualization.virtualbox.title',
          description: 'systemTools.virtualization.virtualbox.description',
          checked: false,
          check: { type: 'pkg', name: 'virtualbox-meta' },
        },
        {
          name: 'group-vboxusers',
          fancyTitle: 'systemTools.virtualization.userVboxUsers.title',
          description: 'systemTools.virtualization.userVboxUsers.description',
          checked: false,
          disabler: 'virtualbox',
          check: { type: 'group', name: 'vboxusers' },
        },
      ],
    },
    {
      name: 'systemTools.containers.title',
      icon: 'pi pi-desktop',
      sections: [
        {
          name: 'docker',
          fancyTitle: 'systemTools.containers.docker.title',
          description: 'systemTools.containers.docker.description',
          checked: false,
          check: { type: 'pkg', name: 'docker' },
        },
        {
          name: 'enabled-docker',
          fancyTitle: 'systemTools.containers.dockerEnabled.title',
          description: 'systemTools.containers.dockerEnabled.description',
          checked: false,
          disabler: 'docker',
          check: { type: 'service', name: 'docker.service' },
        },
        {
          name: 'group-docker',
          fancyTitle: 'systemTools.containers.userDocker.title',
          description: 'systemTools.containers.userDocker.description',
          checked: false,
          disabler: 'docker',
          check: { type: 'group', name: 'docker' },
        },
        {
          name: 'docker-compose',
          fancyTitle: 'systemTools.containers.dockerCompose.title',
          description: 'systemTools.containers.dockerCompose.description',
          checked: false,
          disabler: ['docker', 'podman'],
          check: { type: 'pkg', name: 'docker-compose' },
        },
        {
          name: 'podman',
          fancyTitle: 'systemTools.containers.podman.title',
          description: 'systemTools.containers.podman.description',
          checked: false,
          check: { type: 'pkg', name: 'podman' },
        },
        {
          name: 'podman-desktop',
          fancyTitle: 'systemTools.containers.podmanDesktop.title',
          description: 'systemTools.containers.podmanDesktop.description',
          checked: false,
          disabler: 'podman',
          check: { type: 'pkg', name: 'podman-desktop' },
        },
        {
          name: 'podman-docker',
          fancyTitle: 'systemTools.containers.podmanDocker.title',
          description: 'systemTools.containers.podmanDocker.description',
          checked: false,
          disabler: 'podman',
          check: { type: 'pkg', name: 'podman-docker' },
        },
        {
          name: 'distrobox',
          fancyTitle: 'systemTools.containers.distrobox.title',
          description: 'systemTools.containers.distrobox.description',
          checked: false,
          disabler: ['podman', 'docker'],
          check: { type: 'pkg', name: 'distrobox' },
        },
        {
          name: 'boxbuddy',
          fancyTitle: 'systemTools.containers.boxbuddy.title',
          description: 'systemTools.containers.boxbuddy.description',
          checked: false,
          disabler: 'distrobox',
          check: { type: 'pkg', name: 'boxbuddy' },
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
          check: { type: 'pkg', name: 'networkmanager' },
        },
        {
          name: 'enabled-networkManager',
          fancyTitle: 'systemTools.network.networkManagerEnabled.title',
          description: 'systemTools.network.networkManagerEnabled.description',
          checked: false,
          disabler: 'networkManager',
          check: { type: 'service', name: 'NetworkManager.service' },
        },
        {
          name: 'enabled-modemManager',
          fancyTitle: 'systemTools.network.modemManagerEnabled.title',
          description: 'systemTools.network.modemManagerEnabled.description',
          checked: false,
          disabler: 'networkManager',
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
          check: { type: 'pkg', name: 'bluetooth-support' },
        },
        {
          name: 'enabled-bluetooth',
          fancyTitle: 'systemTools.bluetooth.bluetoothEnabled.title',
          description: 'systemTools.bluetooth.bluetoothEnabled.description',
          checked: false,
          disabler: 'bluetooth',
          check: { type: 'service', name: 'bluetooth.service' },
        },
        {
          name: 'user-bluetooth',
          fancyTitle: 'systemTools.bluetooth.userBluetooth.title',
          description: 'systemTools.bluetooth.userBluetooth.description',
          checked: false,
          disabler: 'bluetooth',
          check: { type: 'group', name: 'lp' },
        },
        {
          name: 'autoConnect',
          fancyTitle: 'systemTools.bluetooth.autoConnect.title',
          description: 'systemTools.bluetooth.autoConnect.description',
          checked: false,
          disabler: 'bluetooth',
          check: { type: 'pkg', name: 'bluetooth-autoconnect' },
        },
        {
          name: 'autoConnect-enabled',
          fancyTitle: 'systemTools.bluetooth.autoConnectEnabled.title',
          description: 'systemTools.bluetooth.autoConnectEnabled.description',
          checked: false,
          disabler: 'autoConnect',
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
          check: { type: 'pkg', name: 'printer-support' },
        },
        {
          name: 'scanning-support',
          fancyTitle: 'systemTools.printing.scanningSupport.title',
          description: 'systemTools.printing.scanningSupport.description',
          checked: false,
          check: { type: 'pkg', name: 'scanner-support' },
        },
        {
          name: 'enabled-cups',
          fancyTitle: 'systemTools.printing.cupsEnabled.title',
          description: 'systemTools.printing.cupsEnabled.description',
          checked: false,
          disabler: 'printing-support',
          check: { type: 'service', name: 'cups.socket' },
        },
        {
          name: 'enabled-saned',
          fancyTitle: 'systemTools.printing.sanedEnabled.title',
          description: 'systemTools.printing.sanedEnabled.description',
          checked: false,
          disabler: 'printing-support',
          check: { type: 'service', name: 'saned.socket' },
        },
        {
          name: 'group-cups',
          fancyTitle: 'systemTools.printing.userCups.title',
          description: 'systemTools.printing.userCups.description',
          checked: false,
          disabler: 'printing-support',
          check: { type: 'group', name: 'cups' },
        },
        {
          name: 'group-scanner',
          fancyTitle: 'systemTools.printing.userScanner.title',
          description: 'systemTools.printing.userScanner.description',
          checked: false,
          disabler: 'scanning-support',
          check: { type: 'group', name: 'scanner' },
        },
        {
          name: 'group-lp',
          fancyTitle: 'systemTools.printing.userLp.title',
          description: 'systemTools.printing.userLp.description',
          checked: false,
          disabler: 'printing-support',
          check: { type: 'group', name: 'lp' },
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
          check: { type: 'pkg', name: 'ufw' },
        },
        {
          name: 'enabled-ufw',
          fancyTitle: 'systemTools.firewall.ufwEnabled.title',
          description: 'systemTools.firewall.ufwEnabled.description',
          checked: false,
          disabler: 'ufw',
          check: { type: 'service', name: 'ufw.service' },
        },
        {
          name: 'firewalld',
          fancyTitle: 'systemTools.firewall.firewalld.title',
          description: 'systemTools.firewall.firewalld.description',
          checked: false,
          check: { type: 'pkg', name: 'firewalld' },
        },
        {
          name: 'enabled-firewalld',
          fancyTitle: 'systemTools.firewall.firewalldEnabled.title',
          description: 'systemTools.firewall.firewalldEnabled.description',
          checked: false,
          disabler: 'firewalld',
          check: { type: 'service', name: 'firewalld.service' },
        },
        {
          name: 'opensnitch',
          fancyTitle: 'systemTools.firewall.opensnitch.title',
          description: 'systemTools.firewall.opensnitch.description',
          checked: false,
          check: { type: 'pkg', name: 'opensnitch' },
        },
        {
          name: 'enabled-opensnitch',
          fancyTitle: 'systemTools.firewall.opensnitchEnabled.title',
          description: 'systemTools.firewall.opensnitchEnabled.description',
          checked: false,
          disabler: 'opensnitch',
          check: { type: 'service', name: 'opensnitchd.service' },
        },
      ],
    },
    {
      name: 'systemTools.misc.title',
      icon: 'pi pi-user',
      sections: [
        {
          name: 'gns',
          fancyTitle: 'systemTools.misc.gns.title',
          description: 'systemTools.misc.gns.description',
          checked: false,
          check: { type: 'pkg', name: 'garuda-nix-subsystem' },
        },
      ],
    },
  ];
}
