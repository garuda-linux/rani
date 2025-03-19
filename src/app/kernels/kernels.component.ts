import { ChangeDetectorRef, Component, effect, inject, OnInit, signal } from '@angular/core';
import { DataView } from 'primeng/dataview';
import { NgClass, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Kernel, Kernels } from './types';
import { TaskManagerService } from '../task-manager/task-manager.service';
import { ChildProcess } from '@tauri-apps/plugin-shell';
import { Logger } from '../logging/logging';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { Tag } from 'primeng/tag';
import { StatefulPackage } from '../gaming/interfaces';
import { OsInteractService } from '../task-manager/os-interact.service';
import { Checkbox } from 'primeng/checkbox';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'rani-kernels',
  imports: [DataView, FormsModule, NgForOf, Tag, Checkbox, NgClass, TranslocoDirective],
  templateUrl: './kernels.component.html',
  styleUrl: './kernels.component.css',
})
export class KernelsComponent implements OnInit {
  kernels = signal<Kernels>([]);

  private cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();
  private readonly osInteractService = inject(OsInteractService);
  private readonly taskManagerService = inject(TaskManagerService);

  constructor() {
    effect(() => {
      const packages: Map<string, boolean> = this.osInteractService.packages();
      this.updateUi();
    });
  }

  async ngOnInit() {
    this.loadingService.loadingOn();
    const promises: Promise<void>[] = [this.getAvailableKernels()];

    await Promise.all(promises);

    this.loadingService.loadingOff();
    this.cdr.markForCheck();
  }

  /**
   * Get available kernels from the package manager, under the assumption that every kernel has a corresponding headers package.
   * This is a best-effort approach, and relies on proper packaging conventions.
   */
  async getAvailableKernels() {
    const cmd = 'pacman -Ss linux';
    const result: ChildProcess<string> = await this.taskManagerService.executeAndWaitBash(cmd);

    if (result.code === 0) {
      const kernels: Kernel[] = [];
      const kernelMap: { [key: string]: string } = {};
      const lines = result.stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line);

      for (let i = 0; i < lines.length; i += 2) {
        let [kernelName, version] = lines[i].split(' ');
        if (kernelName.endsWith('-headers')) {
          kernelName = kernelName.replace('-headers', '');
          const [repo, name] = kernelName.split('/');
          if (kernelMap[kernelName] === version) {
            kernels.push({ pkgname: [name, `${name}-headers`], version, repo, description: '' });
          }
        } else {
          kernelMap[kernelName] = version;
        }
      }

      // Extract real descriptions, because headers are different
      for (let i = 0; i < lines.length; i += 2) {
        const [nameWithRepo] = lines[i].split(' ');
        const [repo, name] = nameWithRepo.split('/');
        const kernel: Kernel | undefined = kernels.find((k) => k.pkgname[0] === name && k.repo === repo);
        if (kernel) {
          kernel.description = lines[i + 1];
        }
      }

      this.kernels.set(kernels);
      this.logger.info(`Found ${kernels.length} available kernels`);
      this.logger.trace(JSON.stringify(kernels));

      this.updateUi();
    } else {
      this.logger.error(`Failed to get available kernels: ${result.stderr}`);
    }
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
    this.kernels.update((kernels: Kernels) => {
      for (const kernel of kernels) {
        kernel.selected = installedPackages.get(kernel.pkgname[0]) === true;
        kernel.headersSelected = installedPackages.get(kernel.pkgname[1]) === true;
      }

      // Show selected kernels first
      kernels.sort((a, b) => {
        if (a.selected && !b.selected) {
          return -1;
        } else if (!a.selected && b.selected) {
          return 1;
        } else {
          return 0;
        }
      });
      return kernels;
    });

    this.cdr.markForCheck();
  }

  /**
   * Install missing headers for a kernel.
   * @param kernel The kernel for which to install missing headers
   */
  installMissingHeaders(kernel: Kernel): void {
    this.osInteractService.togglePackage(kernel.pkgname[1]);
  }
}
