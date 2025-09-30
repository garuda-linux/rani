import { ChangeDetectionStrategy, Component, effect, inject, model, signal, OnInit } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import type { Nullable } from 'primeng/ts-helpers';
import { Select } from 'primeng/select';
import { type DnsProvider, dnsProviders, type Shell, shells } from './types';
import { Checkbox } from 'primeng/checkbox';
import type { SystemToolsEntry } from '../../interfaces';
import { DynamicCheckboxesComponent } from '../dynamic-checkboxes/dynamic-checkboxes.component';
import { OsInteractService } from '../task-manager/os-interact.service';
import type { ChildProcess } from '../../types/shell';
import { TaskManagerService } from '../task-manager/task-manager.service';
import { Logger } from '../../logging/logging';

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
          name: 'bpftune',
          fancyTitle: 'systemSettings.performance.bpftune.title',
          description: 'systemSettings.performance.bpftune.description',
          checked: false,
          check: { type: 'pkg', name: 'bpftune-git' },
        },
        {
          name: 'enable-bpftune',
          fancyTitle: 'systemSettings.performance.bpftuneEnabled.title',
          description: 'systemSettings.performance.bpftuneEnabled.description',
          checked: false,
          disabler: 'bpftune',
          check: { type: 'service', name: 'bpftune.service' },
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
          check: { type: 'pkg', name: 'thermald' },
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
          check: { type: 'pkg', name: 'intel-undervolt' },
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

  protected readonly osInteractService = inject(OsInteractService);
  protected readonly taskManagerService = inject(TaskManagerService);

  private readonly logger = Logger.getInstance();

  constructor() {
    effect(() => {
      const selectedBoxes = [];
      if (this.osInteractService.hblock()) selectedBoxes.push('hblock');
      if (this.osInteractService.iwd()) selectedBoxes.push('iwd');

      this.selectedBoxes.set(selectedBoxes);
      this.currentDns.set(this.osInteractService.dns());
      this.currentShell.set(this.osInteractService.shell());
    });
  }

  ngOnInit() {
    void this.updateAvailableShells();
  }

  /**
   * Handle the selection of a new operation not included in the dynamic checkboxes.
   * @param type The type of operation to perform.
   */
  async handleToggle(type: 'dns' | 'shell' | 'shellConfigs' | 'hblock' | 'iwd'): Promise<void> {
    // Workaround for ngModelChange event seemingly firing before the model is updated
    await new Promise((resolve) => setTimeout(resolve, 200));

    switch (type) {
      case 'dns': {
        this.osInteractService.wantedDns.set(this.currentDns() ?? null);
        break;
      }
      case 'shell': {
        this.osInteractService.wantedShell.set(this.currentShell() ?? null);
        break;
      }
      case 'hblock': {
        if (!this.selectedBoxes().includes('hblock') && this.osInteractService.packages().get('hblock')) {
          this.osInteractService.togglePackage('hblock');
        } else if (this.selectedBoxes().includes('hblock') && !this.osInteractService.packages().get('hblock')) {
          this.osInteractService.togglePackage('hblock');
        }
        this.osInteractService.wantedHblock.set(this.selectedBoxes().includes('hblock'));
        break;
      }
      case 'iwd': {
        if (!this.selectedBoxes().includes('iwd') && this.osInteractService.packages().get('iwd')) {
          this.osInteractService.togglePackage('iwd');
        } else if (this.selectedBoxes().includes('iwd') && !this.osInteractService.packages().get('iwd')) {
          this.osInteractService.togglePackage('iwd');
        }
        this.osInteractService.wantedIwd.set(this.selectedBoxes().includes('iwd'));
      }
    }
  }

  /**
   * Get all the available shells in the system and filter the list of shells based on the result.
   */
  private async updateAvailableShells(): Promise<void> {
    const cmd = "cat /etc/shells | grep '^/' | sort -u";
    const result: ChildProcess<string> = await this.taskManagerService.executeAndWaitBash(cmd);
    if (result.code !== 0) {
      this.logger.error(`Failed to get available shells: ${result.stderr}`);
      return;
    }

    const byName = new Map<string, string>();
    for (const raw of result.stdout.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;

      const idx = line.lastIndexOf('/');
      const name = idx >= 0 ? line.slice(idx + 1) : line;
      const existing = byName.get(name);

      if (!existing) {
        byName.set(name, line);
      } else if (!existing.startsWith('/usr/bin') && line.startsWith('/usr/bin')) {
        // prefer /usr/bin when a duplicate exists
        byName.set(name, line);
      }
    }

    for (const s of shells) {
      const p: string | undefined = byName.get(s.name);
      if (p) s.path = p;
    }
    this.shells = shells.filter((s) => s.path);

    this.logger.info(`Found ${byName.size} unique shells`);
    this.logger.debug(`Shells: ${shells.map((s) => `${s.name} -> ${s.path ?? 'N/A'}`).join(', ')}`);
  }
}
