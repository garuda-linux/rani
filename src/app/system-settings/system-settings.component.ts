import { Component, inject, model, signal } from '@angular/core';
import { ProgressBar } from 'primeng/progressbar';
import { TranslocoDirective } from '@jsverse/transloco';
import { OperationManagerService } from '../operation-manager/operation-manager.service';
import { FormsModule } from '@angular/forms';
import { Nullable } from 'primeng/ts-helpers';
import { AppService } from '../app.service';
import { debug, error } from '@tauri-apps/plugin-log';
import { Select } from 'primeng/select';
import { DnsProvider, dnsProviders, Shell, ShellEntry, shells } from './types';
import { PrivilegeManagerService } from '../privilege-manager/privilege-manager.service';
import { Checkbox } from 'primeng/checkbox';
import { SystemToolsEntry } from '../interfaces';
import { DynamicCheckboxesComponent } from '../dynamic-checkboxes/dynamic-checkboxes.component';

@Component({
  selector: 'app-system-settings',
  imports: [ProgressBar, TranslocoDirective, FormsModule, Select, Checkbox, DynamicCheckboxesComponent],
  templateUrl: './system-settings.component.html',
  styleUrl: './system-settings.component.css',
})
export class SystemSettingsComponent {
  currentShell = signal<Nullable<Shell>>(null);
  currentDns = signal<DnsProvider | null>(null);
  loading = signal<boolean>(true);
  selectedBoxes = model<string[]>([]);

  dnsProviders: DnsProvider[] = dnsProviders;
  shells: Shell[] = shells;

  sections: SystemToolsEntry[] = [
    {
      name: 'systemSettings.common.title',
      icon: 'pi pi-volume-up',
      sections: [
        {
          name: 'profile-sync-daemon',
          fancyTitle: 'systemSettings.common.psd.title',
          description: 'systemSettings.common.psd.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'serviceUser', name: 'psd.service' },
        },
        {
          name: 'systemd-oomd',
          fancyTitle: 'systemSettings.common.oomd.title',
          description: 'systemSettings.common.oomd.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'systemd-oomd.service' },
        },
        {
          name: 'guest-user',
          fancyTitle: 'systemSettings.common.guestUser.title',
          description: 'systemSettings.common.guestUser.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'systemd-guest-user' },
        },
      ],
    },
    {
      name: 'systemSettings.performance.title',
      icon: 'pi pi-chart-line',
      sections: [
        {
          name: 'performance-tweaks',
          fancyTitle: 'systemSettings.performance.performanceTweaks.title',
          description: 'systemSettings.performance.performanceTweaks.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'performance-tweaks' },
        },
        {
          name: 'ananicy-cpp',
          fancyTitle: 'systemSettings.performance.ananicyCpp.title',
          description: 'systemSettings.performance.ananicyCpp.description',
          checked: false,
          disabler: 'performance-tweaks',
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'ananicy-cpp' },
        },
        {
          name: 'enable-ananicy-cpp',
          fancyTitle: 'systemSettings.performance.ananicyCppEnabled.title',
          description: 'systemSettings.performance.ananicyCppEnabled.description',
          checked: false,
          disabler: 'performance-tweaks',
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'ananicy-cpp.service' },
        },
        {
          name: 'enabled-preload',
          fancyTitle: 'systemSettings.performance.preloadEnabled.title',
          description: 'systemSettings.performance.preloadEnabled.description',
          checked: false,
          disabler: 'performance-tweaks',
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'preload.service' },
        },
        {
          name: 'enabled-irqbalance',
          fancyTitle: 'systemSettings.performance.irqbalanceEnabled.title',
          description: 'systemSettings.performance.irqbalanceEnabled.description',
          checked: false,
          disabler: 'performance-tweaks',
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'irqbalance.service' },
        },
      ],
    },
    {
      name: 'systemSettings.powersave.title',
      icon: 'pi pi-battery',
      sections: [
        {
          name: 'powersave-tweaks',
          fancyTitle: 'systemSettings.powersave.powersaveTweaks.title',
          description: 'systemSettings.powersave.powersaveTweaks.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'powersave-tweaks' },
        },
        {
          name: 'thermald',
          fancyTitle: 'systemSettings.powersave.thermald.title',
          description: 'systemSettings.powersave.thermald.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'thermald.service' },
        },
        {
          name: 'enabled-thermald',
          fancyTitle: 'systemSettings.powersave.thermaldEnabled.title',
          description: 'systemSettings.powersave.thermaldEnabled.description',
          checked: false,
          disabler: 'powersave',
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'thermald.service' },
        },
        {
          name: 'power-profiles-daemon',
          fancyTitle: 'systemSettings.powersave.powerProfilesDaemon.title',
          description: 'systemSettings.powersave.powerProfilesDaemon.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'power-profiles-daemon' },
        },
        {
          name: 'enabled-power-profiles-daemon',
          fancyTitle: 'systemSettings.powersave.powerProfilesDaemonEnabled.title',
          description: 'systemSettings.powersave.powerProfilesDaemonEnabled.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'power-profiles-daemon.service' },
        },
        {
          name: 'intel-untervolt',
          fancyTitle: 'systemSettings.powersave.intelUndervolt.title',
          description: 'systemSettings.powersave.intelUndervolt.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'intel-undervolt' },
        },
        {
          name: 'enabled-intel-untervolt',
          fancyTitle: 'systemSettings.powersave.intelUndervoltEnabled.title',
          description: 'systemSettings.powersave.intelUndervoltEnabled.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'service', name: 'intel-undervolt.service' },
        },
      ],
    },
    {
      name: 'systemSettings.rightclickEmulation.title',
      icon: 'pi pi-mouse',
      sections: [
        {
          name: 'rightclick-emulation',
          fancyTitle: 'systemSettings.rightclickEmulation.evdevLongPressRightClick.title',
          description: 'systemSettings.rightclickEmulation.evdevLongPressRightClick.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'rightclick-emulation' },
        },
        {
          name: 'evdev-rce',
          fancyTitle: 'systemSettings.rightclickEmulation.evdevRce.title',
          description: 'systemSettings.rightclickEmulation.evdevRce.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'rightclick-emulation' },
        },
      ],
    },
  ];

  appService = inject(AppService);
  operationManager = inject(OperationManagerService);
  privilegeManager = inject(PrivilegeManagerService);

  constructor() {
    void this.init();
  }

  async init() {
    const initPromises: Promise<any>[] = [this.getCurrentShell(), this.getCurrentDns(), this.getCurrentHblockStatus()];

    const results = await Promise.allSettled(initPromises);
    for (const result of results) {
      if (result.status === 'rejected') {
        void error(JSON.stringify(result.reason));
      }
    }

    void debug(`System settings initialized: ${this.currentShell()}, selected: ${this.selectedBoxes().join(', ')}`);
    this.loading.set(false);
  }

  async getCurrentShell(): Promise<void> {
    while (!this.operationManager.manager.user()) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const cmd = `basename $(/usr/bin/getent passwd $USER | awk -F':' '{print $7}')`;
    const result: string | null = await this.appService.getCommandOutput<string>(cmd, (stdout: string) =>
      stdout.trim(),
    );

    if (result) {
      const currShell: ShellEntry | undefined = shells.find((entry) => result === entry.name);
      this.currentShell.set(currShell ?? null);
    } else {
      throw new Error('Failed to get current shell');
    }
  }

  async getCurrentDns() {
    const cmd = 'cat /etc/resolv.conf | grep nameserver | head -n 1 | cut -d " " -f 2';
    const result: string | null = await this.appService.getCommandOutput<string>(cmd, (stdout: string) => stdout);

    if (result) {
      const providerExists = dnsProviders.find((provider) => provider.ips.includes(result));
      if (providerExists) {
        this.currentDns.set(providerExists);
      } else {
        const newCustomDns = { name: 'Custom', ips: [result], description: 'Custom DNS' };
        this.dnsProviders.push(newCustomDns);
        this.currentDns.set(newCustomDns);
      }
    } else {
      throw new Error('Failed to get current DNS');
    }
  }

  async getCurrentHblockStatus(): Promise<void> {
    const cmd = 'cat /etc/hosts | grep -A1 \"Blocked domains\" | awk \'/Blocked domains/ { print $NF }\'';
    const result: number | null = await this.appService.getCommandOutput<number>(cmd, (stdout: string) =>
      parseInt(stdout),
    );

    if (result !== null && result > 0) {
      this.selectedBoxes().push('hblock');
    }
  }
}
