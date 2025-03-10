import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
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
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { Logger } from '../logging/logging';
import { TaskManagerService } from '../task-manager/task-manager.service';
import { ConfigService } from '../config/config.service';

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

  protected readonly taskManagerService = inject(TaskManagerService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();
  private readonly config = inject(ConfigService);

  constructor() {
    effect(() => {
      if (!this.taskManagerService.running()) {
        (async () => {
          await this.refreshUi();
          this.generateTask();
        })();
      }
    });
  }

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
              this.selectedBoxes.update((values) => [...values, entry]);
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
              this.selectedBoxes.update((values) => [...values, entry]);
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
   * Generates the command/script where the selected entries are passed to.
   */
  generateTask(): void {
    if (this.taskManagerService.running())
      return;

    var command = '';
    var command_user = '';
    const entries = this.selectedBoxes().filter((entry) => !entry.disabled);
  
    for (const entry of entries) {
      if (!entry.initialState) {
        if (entry.checked) {
          switch (entry.check.type) {
            case 'group':
              command += `gpasswd -a ${this.config.state().user} ${entry.check.name}\n`;
              break;
            case 'service':
              command += `systemctl enable --now ${entry.check.name}\n`;
              break;
            case 'serviceUser':
              command_user += `systemctl --user enable --now ${entry.check.name}\n`;
              break;
          }
        }
      } else {
        if (!entry.checked) {
          switch (entry.check.type) {
            case 'group':
              command += `gpasswd -d ${this.config.state().user} ${entry.check.name}\n`;
              break;
            case 'service':
              command += `systemctl disable --now ${entry.check.name}\n`;
              break;
            case 'serviceUser':
              command_user += `systemctl --user disable --now ${entry.check.name}\n`;
              break;
          }
        }
      }
    }

    const task = this.taskManagerService.findTaskById('systemTools');
    const userTask = this.taskManagerService.findTaskById('systemToolsUser');

    if (task) {
      this.taskManagerService.removeTask(task);
    }
    if (userTask) {
      this.taskManagerService.removeTask(userTask);
    }

    if (command) {
      const task = this.taskManagerService.createTask(3, 'systemTools', true, 'System Tools', 'pi pi-cog', command);
      this.taskManagerService.scheduleTask(task);
    }

    if (command_user) {
      const task = this.taskManagerService.createTask(3, 'systemToolsUser', false, 'System Tools User', 'pi pi-cog', command_user);
      this.taskManagerService.scheduleTask(task);
    }
  }

  /**
   * Toggle the entry, adding or removing it from the selected boxes. This is needed
   * to provide the necessary metadata to the operation manager (instead of just using the model).
   * @param entry The entry to toggle
   */
  private toggleEntry(entry: SystemToolsSubEntry): void {
    entry.checked = !entry.checked;
    this.generateTask();
  }

  /**
   * Receive the list of installed packages.
   * @returns The list of installed packages.
   * @private
   */
  private async getInstalledPkgs(): Promise<string[]> {
    const commandoutput = await this.taskManagerService.executeAndWaitBash('pacman -Qq');
    const result: string[] = commandoutput.stdout.split('\n');

    return result;
  }

  /**
   * Receive the list of active systemd services.
   * @returns The list of active systemd services.
   * @private
   */
  private async getActiveServices(): Promise<SystemdService[]> {
    const commandoutput = await this.taskManagerService.executeAndWaitBash('systemctl list-units --type service --full --output json --no-pager');
    const result = JSON.parse(commandoutput.stdout) as SystemdService[];

    return result;
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
    const commandoutput = await this.taskManagerService.executeAndWaitBash('groups');
    const result: string[] = commandoutput.stdout.split(' ');

    return result;
  }

  /**
   * Receive the list of active systemd user services.
   * @returns The list of active systemd services.
   * @private
   */
  private async getActiveUserServices(): Promise<SystemdService[]> {
    const commandoutput = await this.taskManagerService.executeAndWaitBash('systemctl list-units --type service --global --user --full --output json --no-pager');
    const result = JSON.parse(commandoutput.stdout) as SystemdService[];

    return result;
  }
}
