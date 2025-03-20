import { ChangeDetectorRef, Component, effect, inject } from '@angular/core';
import { DataView } from 'primeng/dataview';
import { NgClass, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Kernel, Kernels } from './types';
import { type Task, TaskManagerService } from '../task-manager/task-manager.service';
import { Logger } from '../logging/logging';
import { Tag } from 'primeng/tag';
import { StatefulPackage } from '../gaming/interfaces';
import { OsInteractService } from '../task-manager/os-interact.service';
import { Checkbox } from 'primeng/checkbox';
import { TranslocoDirective } from '@jsverse/transloco';
import { ConfigService } from '../config/config.service';
import { Tooltip } from 'primeng/tooltip';
import { Skeleton } from 'primeng/skeleton';
import { KernelsService } from './kernels.service';

@Component({
  selector: 'rani-kernels',
  imports: [DataView, FormsModule, NgForOf, Tag, Checkbox, NgClass, TranslocoDirective, Tooltip, Skeleton],
  templateUrl: './kernels.component.html',
  styleUrl: './kernels.component.css',
})
export class KernelsComponent {
  protected readonly configService = inject(ConfigService);
  protected readonly kernelsService = inject(KernelsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = Logger.getInstance();
  private readonly osInteractService = inject(OsInteractService);
  private readonly taskManagerService = inject(TaskManagerService);

  constructor() {
    effect(() => {
      const packages: Map<string, boolean> = this.osInteractService.packages();
      this.updateUi();
    });
  }

  /**
   * Toggles the selected state of a package.
   * @param item The package to toggle.
   */
  togglePackage(item: StatefulPackage): void {
    for (const pkgname of item.pkgname) {
      this.osInteractService.togglePackage(pkgname);
    }
  }

  /**
   * Update the state of the UI based on the installed packages, and sort them.
   */
  updateUi(): void {
    this.logger.trace('Updating kernels UI');
    const installedPackages: Map<string, boolean> = this.osInteractService.packages();

    this.kernelsService.kernels.update((kernels: Kernels) => {
      for (const kernel of kernels) {
        kernel.selected = installedPackages.get(kernel.pkgname[0]) === true;
        kernel.headersSelected = installedPackages.get(kernel.pkgname[1]) === true;
      }

      // Show selected kernels first
      kernels.sort((a, b) => +b.selected! - +a.selected!);
      return kernels;
    });

    this.cdr.markForCheck();
  }

  /**
   * Install missing headers for a kernel.
   * @param kernel The kernel for which to install missing headers, or `true` to install all missing headers.
   */
  installMissingHeaders(kernel: Kernel | boolean): void {
    if (typeof kernel === 'boolean') {
      for (const kernel of this.kernelsService.kernels()) {
        if (kernel.selected && !kernel.headersSelected) {
          this.osInteractService.togglePackage(kernel.pkgname[1]);
        }
      }
    } else {
      this.osInteractService.togglePackage(kernel.pkgname[1]);
    }
  }

  /**
   * Reinstall DKMS modules that are labeled broken via the task manager service.
   */
  reinstallDkmsModules(): void {
    let cmd: string = '';
    for (const module of this.kernelsService.dkmsModules()) {
      if (module.status === 'broken') {
        cmd += `dkms install --no-depmod ${module.name} -k ${module.version}; `;
      }
    }

    const task: Task = this.taskManagerService.createTask(
      10,
      'reinstallDkmsModules',
      true,
      'maintenance.reinstallDkmsModules',
      'pi pi-cog',
      cmd,
    );
    this.taskManagerService.scheduleTask(task);
  }

  counterArray(number: number) {
    return new Array(number);
  }
}
