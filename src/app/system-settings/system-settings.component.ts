import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, model, OnInit, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import { Nullable } from 'primeng/ts-helpers';
import { Select } from 'primeng/select';
import { DnsProvider, DnsProviderName, dnsProviders, Shell, ShellEntry, ShellName, shells } from './types';
import { Checkbox } from 'primeng/checkbox';
import { SystemToolsEntry } from '../interfaces';
import { DynamicCheckboxesComponent } from '../dynamic-checkboxes/dynamic-checkboxes.component';
import { Logger } from '../logging/logging';
import { ConfigService } from '../config/config.service';
import { StatefulPackage } from '../gaming/interfaces';
import { TaskManagerService } from '../task-manager/task-manager.service';

@Component({
  selector: 'rani-system-settings',
  imports: [TranslocoDirective, FormsModule, Select, Checkbox, DynamicCheckboxesComponent],
  templateUrl: './system-settings.component.html',
  styleUrl: './system-settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemSettingsComponent implements OnInit {
  currentShell = signal<Nullable<Shell>>(null);
  currentDns = signal<Nullable<DnsProvider>>(null);
  loading = signal<boolean>(true);
  selectedBoxes = model<string[]>([]);

  dnsProviders: DnsProvider[] = dnsProviders;
  shells: Shell[] = shells;

  state: {
    initialDns: Nullable<DnsProviderName>;
    initialShell: Nullable<ShellName>;
    initialHblock: Nullable<boolean>;
  } = {
    initialDns: null,
    initialShell: null,
    initialHblock: null,
  };

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
          check: { type: 'pkg', name: 'profile-sync-daemon' },
        },
        {
          name: 'enable-profile-sync-daemon',
          fancyTitle: 'systemSettings.common.psdEnabled.title',
          description: 'systemSettings.common.psdEnabled.description',
          checked: false,
          check: { type: 'serviceUser', name: 'psd.service' },
        },
        {
          name: 'systemd-oomd',
          fancyTitle: 'systemSettings.common.oomd.title',
          description: 'systemSettings.common.oomd.description',
          checked: false,
          check: { type: 'service', name: 'systemd-oomd.service' },
        },
        {
          name: 'guest-user',
          fancyTitle: 'systemSettings.common.guestUser.title',
          description: 'systemSettings.common.guestUser.description',
          checked: false,
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
          check: { type: 'pkg', name: 'performance-tweaks' },
        },
        {
          name: 'ananicy-cpp',
          fancyTitle: 'systemSettings.performance.ananicyCpp.title',
          description: 'systemSettings.performance.ananicyCpp.description',
          checked: false,
          disabler: 'performance-tweaks',
          check: { type: 'pkg', name: 'ananicy-cpp' },
        },
        {
          name: 'enable-ananicy-cpp',
          fancyTitle: 'systemSettings.performance.ananicyCppEnabled.title',
          description: 'systemSettings.performance.ananicyCppEnabled.description',
          checked: false,
          disabler: 'performance-tweaks',
          check: { type: 'service', name: 'ananicy-cpp.service' },
        },
        {
          name: 'enabled-preload',
          fancyTitle: 'systemSettings.performance.preloadEnabled.title',
          description: 'systemSettings.performance.preloadEnabled.description',
          checked: false,
          disabler: 'performance-tweaks',
          check: { type: 'service', name: 'preload.service' },
        },
        {
          name: 'enabled-irqbalance',
          fancyTitle: 'systemSettings.performance.irqbalanceEnabled.title',
          description: 'systemSettings.performance.irqbalanceEnabled.description',
          checked: false,
          disabler: 'performance-tweaks',
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
          check: { type: 'pkg', name: 'powersave-tweaks' },
        },
        {
          name: 'thermald',
          fancyTitle: 'systemSettings.powersave.thermald.title',
          description: 'systemSettings.powersave.thermald.description',
          checked: false,
          check: { type: 'service', name: 'thermald.service' },
        },
        {
          name: 'enabled-thermald',
          fancyTitle: 'systemSettings.powersave.thermaldEnabled.title',
          description: 'systemSettings.powersave.thermaldEnabled.description',
          checked: false,
          disabler: 'thermald',
          check: { type: 'service', name: 'thermald.service' },
        },
        {
          name: 'power-profiles-daemon',
          fancyTitle: 'systemSettings.powersave.powerProfilesDaemon.title',
          description: 'systemSettings.powersave.powerProfilesDaemon.description',
          checked: false,
          check: { type: 'pkg', name: 'power-profiles-daemon' },
        },
        {
          name: 'enabled-power-profiles-daemon',
          fancyTitle: 'systemSettings.powersave.powerProfilesDaemonEnabled.title',
          description: 'systemSettings.powersave.powerProfilesDaemonEnabled.description',
          checked: false,
          check: { type: 'service', name: 'power-profiles-daemon.service' },
        },
        {
          name: 'intel-untervolt',
          fancyTitle: 'systemSettings.powersave.intelUndervolt.title',
          description: 'systemSettings.powersave.intelUndervolt.description',
          checked: false,
          check: { type: 'service', name: 'intel-undervolt' },
        },
        {
          name: 'enabled-intel-untervolt',
          fancyTitle: 'systemSettings.powersave.intelUndervoltEnabled.title',
          description: 'systemSettings.powersave.intelUndervoltEnabled.description',
          checked: false,
          disabler: 'intel-untervolt',
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
          check: { type: 'pkg', name: 'rightclick-emulation' },
        },
        {
          name: 'evdev-rce',
          fancyTitle: 'systemSettings.rightclickEmulation.evdevRce.title',
          description: 'systemSettings.rightclickEmulation.evdevRce.description',
          checked: false,
          check: { type: 'pkg', name: 'rightclick-emulation' },
        },
      ],
    },
  ];

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly configService = inject(ConfigService);
  private readonly logger = Logger.getInstance();
  private readonly taskManagerService = inject(TaskManagerService);

  async ngOnInit(): Promise<void> {
    await this.init();
  }

  async init(): Promise<void> {
    this.loading.set(true);
    const initPromises: Promise<any>[] = [this.getCurrentShell(), this.getCurrentDns(), this.getCurrentHblockStatus()];

    const results = await Promise.allSettled(initPromises);
    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.error(JSON.stringify(result.reason));
      }
    }

    this.logger.debug(
      `System settings initialized: ${JSON.stringify(this.currentShell())}, selected: ${this.selectedBoxes().join(', ')}, dns: ${JSON.stringify(this.currentDns())}`,
    );

    this.cdr.markForCheck();
    this.loading.set(false);
  }

  /**
   * Get the current shell, writing it to the currentShell signal and setting the initial shell.
   */
  async getCurrentShell(): Promise<void> {
    while (!this.configService.state().user) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const cmd = `basename $(/usr/bin/getent passwd $USER | awk -F':' '{print $7}')`;
    const result: string | null = (await this.taskManagerService.executeAndWaitBash(cmd)).stdout.trim();

    if (result) {
      this.logger.trace(`Got initial shell ${result}`);
      if (!this.state.initialShell) this.state.initialShell = result;
      const currShell: ShellEntry | undefined = shells.find((entry) => result === entry.name);
      this.currentShell.set(currShell ?? null);
    } else {
      throw new Error('Failed to get current shell');
    }
  }

  /**
   * Get the current DNS server, writing it to the currentDns signal and setting the initial DNS server.
   */
  async getCurrentDns(): Promise<void> {
    const cmd = 'cat /etc/resolv.conf | grep nameserver | head -n 1 | cut -d " " -f 2';
    const result: string | null = (await this.taskManagerService.executeAndWaitBash(cmd)).stdout.trim();

    if (result) {
      const providerExists = dnsProviders.find((provider) => provider.ips.includes(result));
      if (providerExists) {
        this.currentDns.set(providerExists);
      } else {
        const newCustomDns = { name: 'Custom', ips: [result], description: 'Custom DNS' };
        this.dnsProviders.push(newCustomDns);
        this.currentDns.set(newCustomDns);
      }
      if (!this.state.initialDns) this.state.initialDns = this.currentDns()?.name;
    } else {
      throw new Error('Failed to get current DNS');
    }
  }

  /**
   * Get the current status of hblock, setting the initial status and adding it to the selected boxes if enabled.
   */
  async getCurrentHblockStatus(): Promise<void> {
    const cmd = 'cat /etc/hosts | grep -A1 \"Blocked domains\" | awk \'/Blocked domains/ { print $NF }\'';
    const output: string | null = (await this.taskManagerService.executeAndWaitBash(cmd)).stdout.trim();
    const result = parseInt(output);

    if (result !== null && result > 0) {
      this.state.initialHblock = true;
      this.selectedBoxes.update((boxes) => [...boxes, 'hblock']);
    }
  }

  /**
   * Handle the selection of a new operation not included in the dynamic checkboxes.
   * @param type The type of operation to perform.
   */
  async handleToggle(type: 'dns' | 'shell' | 'shellConfigs' | 'hblock'): Promise<void> {
    // Workaround for ngModelChange event seemingly firing before the model is updated
    // await new Promise((resolve) => setTimeout(resolve, 200));

    /*switch (type) {
      case 'dns': {
        this.operationManager.toggleDnsServer(this.currentDns()!.name === this.state.initialDns, this.currentDns()!);
        break;
      }
      case 'shell': {
        this.operationManager.toggleShell(this.currentShell()!.name === this.state.initialShell, this.currentShell()!);
        break;
      }
      case 'shellConfigs': {
        if (this.currentShell()?.defaultSettings) {
          const packageDef: StatefulPackage = {
            pkgname: [this.currentShell()!.defaultSettings!],
            initialState: this.state.initialShell === this.currentShell()!.name,
            selected: true,
          };
          this.operationManager.handleTogglePackage(packageDef);
        }
        break;
      }
      case 'hblock': {
        this.operationManager.toggleHblock(this.state.initialHblock ?? false, this.selectedBoxes().includes('hblock'));
      }
    }*/

    this.cdr.markForCheck();
  }
}
