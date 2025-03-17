import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import type { SystemToolsEntry, SystemToolsSubEntry } from '../interfaces';
import { Checkbox } from 'primeng/checkbox';
import { TranslocoDirective } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Card } from 'primeng/card';
import { Logger } from '../logging/logging';
import { TaskManagerService } from '../task-manager/task-manager.service';
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
  private readonly logger = Logger.getInstance();
  private readonly osInteractService = inject(OsInteractService);

  constructor() {
    effect(() => {
      this.refreshUi();
    });
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

  private checkState(entry: SystemToolsSubEntry): boolean {
    switch (entry.check.type) {
      case 'pkg': {
        this.logger.trace(`Checking package ${entry.check.name} as pkg`);
        return (
          this.osInteractService.packages().get(entry.check.name) === true ||
          this.osInteractService.packages().get(`${entry.check.name}-git`) === true
        );
      }
      case 'service': {
        this.logger.trace(`Checking service ${entry.check.name} as service`);
        return this.osInteractService.services().get(entry.check.name) === true;
      }
      case 'serviceUser': {
        this.logger.trace(`Checking service ${entry.check.name} as user service`);
        return this.osInteractService.servicesUser().get(entry.check.name) === true;
      }
      case 'group': {
        this.logger.trace(`Checking group ${entry.check.name} as group`);
        return this.osInteractService.groups().get(entry.check.name) === true;
      }
    }
  }

  /**
   * Check if the entry should be disabled based on the disabler.
   */
  private checkDisabled(entries: SystemToolsEntry[]): void {
    for (const section of entries) {
      for (const entry of section.sections) {
        if (entry.disabler === undefined) {
          continue;
        } else if (
          (entry.check.type === 'pkg' && this.osInteractService.packages().get(entry.check.name) === true) ||
          this.osInteractService.packages().get(`${entry.check.name}-git`) === true
        ) {
          continue;
        } else if (entry.check.type === 'service' && this.osInteractService.services().get(entry.check.name) === true) {
          continue;
        } else if (
          entry.check.type === 'serviceUser' &&
          this.osInteractService.servicesUser().get(entry.check.name) === true
        ) {
          continue;
        } else if (entry.check.type === 'group' && this.osInteractService.groups().get(entry.check.name) === true) {
          continue;
        }

        let disabler: SystemToolsSubEntry | undefined;
        for (const section of entries) {
          if (typeof entry.disabler === 'string') {
            disabler = section.sections.find((e: SystemToolsSubEntry) => e.name === entry.disabler);
          } else {
            for (const disablerName of entry.disabler) {
              disabler = section.sections.find((e: SystemToolsSubEntry) => e.name === disablerName);
              if (disabler) break;
            }
          }
          if (disabler) break;
        }

        let disabled: boolean = false;

        if (!disabler) {
          disabled = true;
        } else {
          disabled = !disabler.checked;
        }

        if (disabled) this.osInteractService.toggle(entry, true);
        entry.disabled = disabled;
      }
    }
  }
}
