import { Component, inject, input, model, OnInit, signal } from '@angular/core';
import { SystemdService, SystemToolsEntry, SystemToolsSubEntry } from '../interfaces';
import { Checkbox } from 'primeng/checkbox';
import { TranslocoDirective } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import { trace } from '@tauri-apps/plugin-log';
import { AppService } from '../app.service';
import { NgClass } from '@angular/common';
import { Card } from 'primeng/card';

@Component({
  selector: 'rani-dynamic-checkboxes',
  imports: [Checkbox, TranslocoDirective, FormsModule, NgClass, Card],
  templateUrl: './dynamic-checkboxes.component.html',
  styleUrl: './dynamic-checkboxes.component.css',
})
export class DynamicCheckboxesComponent implements OnInit {
  colSpan = input<string>('3');
  data = input.required<SystemToolsEntry[]>();
  loading = signal<boolean>(true);
  selectedBoxes = model<SystemToolsSubEntry[]>([]);

  installedPackages = signal<string[]>([]);
  systemdServices = signal<SystemdService[]>([]);
  userGroups = signal<string[]>([]);

  private appService = inject(AppService);

  constructor() {}

  ngOnInit() {
    void this.refreshUi();
  }

  async refreshUi(): Promise<void> {
    this.loading.set(true);

    const checkPromises: Promise<any[]>[] = [this.getActiveServices(), this.getInstalledPkgs(), this.getUserGroups()];
    const [services, pkgs, groups] = await Promise.all(checkPromises);

    this.systemdServices.set(services);
    this.installedPackages.set(pkgs);
    this.userGroups.set(groups);

    for (const service of this.data()) {
      void trace(`Checking ${service.name}`);

      for (const entry of service.sections) {
        switch (entry.check.type) {
          case 'pkg': {
            void trace(`Checking package ${entry.check.name} as pkg`);
            const installed: boolean =
              this.installedPackages().includes(entry.check.name) ||
              this.installedPackages().includes(`${entry.check.name}-git`);
            [entry.checked, entry.initialState] = [installed, installed];

            if (installed) {
              void trace(`Package ${entry.check.name} is ${installed}`);
              this.selectedBoxes.set([...this.selectedBoxes(), entry]);
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
              this.selectedBoxes.set([...this.selectedBoxes(), entry]);
            }
            break;
          }
          case 'group': {
            void trace(`Checking group ${entry.check.name} as group`);
            const group: boolean = this.userGroups().includes(entry.check.name);
            [entry.checked, entry.initialState] = [group, group];

            if (group) {
              void trace(`Group ${entry.check.name} is ${group}`);
              this.selectedBoxes.set([...this.selectedBoxes(), entry]);
            }
            break;
          }
        }
      }
    }

    await this.checkDisabled();
    this.loading.set(false);
  }

  protected async checkDisabled(): Promise<void> {
    for (const section of this.data()) {
      for (const entry of section.sections) {
        if (!entry.disabler) continue;
        const findDisabler = () => {
          for (const entry of this.selectedBoxes()) {
            if (entry.name === entry.disabler) {
              return entry;
            }
          }
          return null;
        };

        const disabler: SystemToolsSubEntry | null = findDisabler();
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
