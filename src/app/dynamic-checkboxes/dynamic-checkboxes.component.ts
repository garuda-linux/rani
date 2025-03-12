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
import { OsInteractService } from '../task-manager/os-interact.service';

@Component({
  selector: 'rani-dynamic-checkboxes',
  imports: [Checkbox, TranslocoDirective, FormsModule, NgClass, Card],
  templateUrl: './dynamic-checkboxes.component.html',
  styleUrl: './dynamic-checkboxes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicCheckboxesComponent {
  data = input.required<SystemToolsEntry[]>();
  selectedBoxes = model<SystemToolsSubEntry[]>([]);

  protected readonly taskManagerService = inject(TaskManagerService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();
  private readonly config = inject(ConfigService);
  private readonly osInteractService = inject(OsInteractService);

  constructor() {
    this.refreshUi();
  }

  ngOnInit(): void {
    void this.refreshUi();
  }

  refreshUi(): void {
    for (const service of this.data()) {
      this.logger.trace(`Checking ${service.name}`);

      for (const entry of service.sections) {
        switch (entry.check.type) {
          case 'pkg': {
            this.logger.trace(`Checking package ${entry.check.name} as pkg`);
            const installed: boolean =
              this.osInteractService.packages().get(entry.check.name) === true ||
              this.osInteractService.packages().get(`${entry.check.name}-git`) === true;
            entry.checked = installed;

            /*if (installed) {
              this.logger.trace(`Package ${entry.check.name} is ${installed}`);
              this.selectedBoxes.update((values) => [...values, entry]);
            }*/
            break;
          }
          case 'service': {
            this.logger.trace(`Checking service ${entry.check.name} as service`);
            const enabled: boolean = this.osInteractService.services().get(entry.check.name) === true;
            entry.checked = enabled;

            /*if (enabled) {
              this.logger.trace(`Service ${entry.check.name} is ${enabled}`);
              this.selectedBoxes.update((values) => [...values, entry]);
            }*/
           break;
          }
          case 'serviceUser': {
            this.logger.trace(`Checking service ${entry.check.name} as user service`);
            const enabled: boolean = this.osInteractService.servicesUser().get(entry.check.name) === true;
            entry.checked = enabled;

            /*if (enabled) {
              this.logger.trace(`Service ${entry.check.name} is ${enabled}`);
              this.selectedBoxes.update((values) => [...values, entry]);
            }*/
            break;
          }
          case 'group': {
            this.logger.trace(`Checking group ${entry.check.name} as group`);
            const group: boolean = this.osInteractService.groups().get(entry.check.name) === true;
            entry.checked = group;

            if (group) {
              this.logger.trace(`Group ${entry.check.name} is ${group}`);
              this.selectedBoxes.update((values) => [...values, entry]);
            }
            break;
          }
        }
      }
    }

    this.checkDisabled();

    this.cdr.markForCheck();
  }

  /**
   * Handle the click action on a checkbox.
   * @param entry The entry to toggle
   */
  async clickAction(entry: any): Promise<void> {
    this.osInteractService.toggle(entry);

    this.checkDisabled();

    this.cdr.markForCheck();
  }

  /**
   * Check if the entry should be disabled based on the disabler.
   */
  private checkDisabled(): void {
    this.loadingService.loadingOn();

    for (const section of this.data()) {
      for (const entry of section.sections) {
        if (!entry.disabler) continue;
        const disabler: SystemToolsSubEntry | undefined = this.selectedBoxes().find(
          (selected) => selected.name === entry.disabler,
        );

        if (!disabler) {
          entry.disabled = true;
        } else if (disabler.checked) {
          entry.disabled = false;
        }
      }
    }

    this.loadingService.loadingOff();
  }
}
