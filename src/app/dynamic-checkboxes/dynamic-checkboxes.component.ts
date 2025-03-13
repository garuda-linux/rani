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
  untracked,
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
  transformed = signal<SystemToolsEntry[]>([]);

  protected readonly taskManagerService = inject(TaskManagerService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();
  private readonly osInteractService = inject(OsInteractService);

  constructor() {
    effect(() => {
      this.refreshUi();
    });
  }

  private checkState(entry: SystemToolsSubEntry): boolean {
    switch (entry.check.type) {
      case 'pkg': {
        this.logger.trace(`Checking package ${entry.check.name} as pkg`);
        const installed: boolean =
          this.osInteractService.packages().get(entry.check.name) === true ||
          this.osInteractService.packages().get(`${entry.check.name}-git`) === true;

        return installed;
      }
      case 'service': {
        this.logger.trace(`Checking service ${entry.check.name} as service`);
        const enabled: boolean = this.osInteractService.services().get(entry.check.name) === true;

        return enabled;
      }
      case 'serviceUser': {
        this.logger.trace(`Checking service ${entry.check.name} as user service`);
        const enabled: boolean = this.osInteractService.servicesUser().get(entry.check.name) === true;

        return enabled;
      }
      case 'group': {
        this.logger.trace(`Checking group ${entry.check.name} as group`);
        const group: boolean = this.osInteractService.groups().get(entry.check.name) === true;

        return group;
      }
    }
  }

  refreshUi(): void {
    const data = structuredClone(this.data());
    for (const service of data) {
      this.logger.trace(`Checking ${service.name}`);

      for (const entry of service.sections) {
        if (this.checkState(entry)) {
          entry.checked = true;
        }
      }
    }

    this.checkDisabled(data);

    this.transformed.set(data);
  }

  /**
   * Handle the click action on a checkbox.
   * @param entry The entry to toggle
   */
  async clickAction(entry: any): Promise<void> {
    this.osInteractService.toggle(entry);
  }

  /**
   * Check if the entry should be disabled based on the disabler.
   */
  private checkDisabled(entries: SystemToolsEntry[]): void {
    for (const section of entries) {
      for (const entry of section.sections) {
        if (entry.disabler === undefined) continue;
        let disabler: SystemToolsSubEntry | undefined;
        for (const section of entries) {
          disabler = section.sections.find((e) => e.name === entry.disabler);
          if (disabler) break;
        }

        let disabled: boolean = false;

        if (!disabler) {
          disabled = true;
        } else {
          disabled = !disabler.checked;
        }

        if (disabled)
          this.osInteractService.toggle(entry, true);
        entry.disabled = disabled;
      }
    }
  }
}
