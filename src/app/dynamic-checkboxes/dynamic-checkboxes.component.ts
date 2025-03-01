import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  model,
  OnInit,
  signal,
} from '@angular/core';
import { SystemdService, SystemToolsEntry, SystemToolsSubEntry } from '../interfaces';
import { Checkbox } from 'primeng/checkbox';
import { TranslocoDirective } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Card } from 'primeng/card';
import { OperationManagerService } from '../operation-manager/operation-manager.service';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { Logger } from '../logging/logging';

@Component({
  selector: 'rani-dynamic-checkboxes',
  imports: [Checkbox, TranslocoDirective, FormsModule, NgClass, Card],
  templateUrl: './dynamic-checkboxes.component.html',
  styleUrl: './dynamic-checkboxes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicCheckboxesComponent implements OnInit {
  data = input.required<SystemToolsEntry[]>();
  selectedBoxes = model<SystemToolsSubEntry[]>([]);

  installedPackages = signal<string[]>([]);
  systemdServices = signal<SystemdService[]>([]);
  systemdUserServices = signal<SystemdService[]>([]);
  userGroups = signal<string[]>([]);

  protected operationManager = inject(OperationManagerService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();

  ngOnInit(): void {
    void this.refreshUi();
  }

  async refreshUi(): Promise<void> {
    this.loadingService.loadingOn();

    const checkPromises: Promise<any[]>[] = [
      this.getActiveServices(),
      this.getInstalledPkgs(),
      this.getUserGroups(),
      this.getActiveUserServices(),
    ];
    const [services, pkgs, groups, userServices] = await Promise.all(checkPromises);

    this.systemdServices.set(services);
    this.systemdUserServices.set(userServices);
    this.installedPackages.set(pkgs);
    this.userGroups.set(groups);

    for (const service of this.data()) {
      this.logger.trace(`Checking ${service.name}`);

      for (const entry of service.sections) {
        switch (entry.check.type) {
          case 'pkg': {
            this.logger.trace(`Checking package ${entry.check.name} as pkg`);
            const installed: boolean =
              this.installedPackages().includes(entry.check.name) ||
              this.installedPackages().includes(`${entry.check.name}-git`);
            [entry.checked, entry.initialState] = [installed, installed];

            if (installed) {
              this.logger.trace(`Package ${entry.check.name} is ${installed}`);
              this.selectedBoxes.set([...this.selectedBoxes(), entry]);
            }
            break;
          }
          case 'service': {
            this.logger.trace(`Checking service ${entry.check.name} as service`);
            const service: SystemdService | undefined = this.systemdServices().find((s) => s.unit === entry.check.name);

            if (service) this.handleServiceState(service, entry);
            break;
          }
          case 'serviceUser': {
            this.logger.trace(`Checking service ${entry.check.name} as user service`);
            const service: SystemdService | undefined = this.systemdUserServices().find(
              (s) => s.unit === entry.check.name,
            );

            if (service) this.handleServiceState(service, entry);
            break;
          }
          case 'group': {
            this.logger.trace(`Checking group ${entry.check.name} as group`);
            const group: boolean = this.userGroups().includes(entry.check.name);
            [entry.checked, entry.initialState] = [group, group];

            if (group) {
              this.logger.trace(`Group ${entry.check.name} is ${group}`);
              this.selectedBoxes.set([...this.selectedBoxes(), entry]);
            }
            break;
          }
        }
      }
    }

    await this.checkDisabled();

    this.cdr.markForCheck();
    this.loadingService.loadingOff();
  }

  /**
   * Handle the click action on a checkbox.
   * @param entry The entry to toggle
   */
  async clickAction(entry: any): Promise<void> {
    this.toggleEntry(entry);

    // Let the loop finish rendering before blocking the UI again, it seemed to help with state
    // of checkboxes changing very slowly
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.checkDisabled();

    this.cdr.markForCheck();
  }

  /**
   * Check if the entry should be disabled based on the disabler.
   */
  private async checkDisabled(): Promise<void> {
    this.loadingService.loadingOn();

    for (const section of this.data()) {
      for (const entry of section.sections) {
        if (!entry.disabler) continue;
        const disabler: SystemToolsSubEntry | undefined = this.selectedBoxes().find(
          (selected) => selected.name === entry.disabler,
        );

        if (entry.initialState) {
          entry.disabled = false;
        } else if (!disabler) {
          entry.disabled = true;
        } else if (disabler.checked) {
          entry.disabled = false;
        }
      }
    }

    this.loadingService.loadingOff();
  }

  /**
   * Toggle the entry, adding or removing it from the selected boxes. This is needed
   * to provide the necessary metadata to the operation manager (instead of just using the model).
   * @param entry The entry to toggle
   */
  private toggleEntry(entry: SystemToolsSubEntry): void {
    entry.checked = !entry.checked;
    this.operationManager.handleToggleSystemTools(entry);
  }

  /**
   * Receive the list of installed packages.
   * @returns The list of installed packages.
   * @private
   */
  private async getInstalledPkgs(): Promise<string[]> {
    const cmd = `pacman -Qq`;
    const result: string[] | null = await this.operationManager.getCommandOutput<string[]>(cmd, (stdout: string) =>
      stdout.split('\n'),
    );

    if (result) return result;
    return [];
  }

  /**
   * Receive the list of active systemd services.
   * @returns The list of active systemd services.
   * @private
   */
  private async getActiveServices(): Promise<SystemdService[]> {
    const cmd = 'systemctl list-units --type service --full --output json --no-pager';
    const result: SystemdService[] | null = await this.operationManager.getCommandOutput<SystemdService[]>(
      cmd,
      (stdout: string) => JSON.parse(stdout),
    );

    if (result) return result;
    return [];
  }

  /**
   * Set the active state of a systemd service based in the service state.
   * @param service The systemd service to check
   * @param entry The entry to update
   * @private
   */
  private handleServiceState(service: SystemdService, entry: SystemToolsSubEntry): void {
    const shallCheck: boolean = service.active === 'active';
    [entry.checked, entry.initialState] = [shallCheck, shallCheck];

    this.logger.trace(`Service ${entry.check.name} is ${shallCheck}`);
    this.selectedBoxes.update((value) => [...value, entry]);
  }

  /**
   * Receive the list of user groups the current user is in.
   * @returns The list of user groups.
   * @private
   */
  private async getUserGroups(): Promise<string[]> {
    const cmd = 'groups';
    const result: string[] | null = await this.operationManager.getCommandOutput<string[]>(cmd, (stdout: string) =>
      stdout.split(' '),
    );

    if (result) return result;
    return [];
  }

  /**
   * Receive the list of active systemd user services.
   * @returns The list of active systemd services.
   * @private
   */
  private async getActiveUserServices(): Promise<SystemdService[]> {
    const cmd = 'systemctl list-units --type service --global --user --full --output json --no-pager';
    const result: SystemdService[] | null = await this.operationManager.getCommandOutput<SystemdService[]>(
      cmd,
      (stdout: string) => JSON.parse(stdout),
    );

    if (result) return result;
    return [];
  }
}
