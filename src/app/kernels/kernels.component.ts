import { ChangeDetectorRef, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { DataView } from 'primeng/dataview';
import { NgClass, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { DkmsModules, DkmsModuleStatus, Kernel, Kernels } from './types';
import { type Task, TaskManagerService } from '../task-manager/task-manager.service';
import { ChildProcess } from '@tauri-apps/plugin-shell';
import { Logger } from '../logging/logging';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { Tag } from 'primeng/tag';
import { StatefulPackage } from '../gaming/interfaces';
import { OsInteractService } from '../task-manager/os-interact.service';
import { Checkbox } from 'primeng/checkbox';
import { TranslocoDirective } from '@jsverse/transloco';
import { ConfigService } from '../config/config.service';
import { Tooltip } from 'primeng/tooltip';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'rani-kernels',
  imports: [DataView, FormsModule, NgForOf, Tag, Checkbox, NgClass, TranslocoDirective, Tooltip, Skeleton],
  templateUrl: './kernels.component.html',
  styleUrl: './kernels.component.css',
})
export class KernelsComponent implements OnInit {
  dkmsModules = signal<DkmsModules>([]);
  dkmsModulesBroken = computed(() => this.dkmsModules().some((module) => module.status !== 'installed'));
  headersMissing = computed(() => this.kernels().some((kernel) => kernel.selected && !kernel.headersSelected));
  kernels = signal<Kernels>([]);
  loading = signal<boolean>(true);

  protected readonly configService = inject(ConfigService);
  private readonly cdr = inject(ChangeDetectorRef);
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

    const promises: Promise<void>[] = [this.getAvailableKernels(), this.getDkmsStatus()];
    await Promise.all(promises);

    this.updateUi();
    this.loadingService.loadingOff();
    this.loading.set(false);

    this.cdr.markForCheck();
  }

  /**
   * Get the status of DKMS modules, if DKMS is installed.
   */
  async getDkmsStatus() {
    const cmd = 'which dkms &>/dev/null && dkms status';
    const result: ChildProcess<string> = await this.taskManagerService.executeAndWaitBash(cmd);

    if (result.code === 0 && result.stdout.trim() !== '') {
      const lines: string[] = result.stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.match(/(: installed|: broken)/));

      const modules: DkmsModules = [];
      for (const line of lines) {
        const [moduleString, status] = line.split(': ');
        const [module, version] = moduleString.split(', ');

        this.logger.trace(`${module} for kernel version ${version} is ${status}`);
        modules.push({ name: module, version, status: status.split(' ')[0] as DkmsModuleStatus });
      }

      this.dkmsModules.set(modules);
      this.logger.info(`Found ${this.dkmsModules().length} DKMS modules`);
      this.logger.trace(JSON.stringify(this.dkmsModules()));
    } else {
      this.logger.error(`Failed to get DKMS status: ${result.stderr}`);
    }
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
      const lines: string[] = result.stdout.split('\n').map((line) => line.trim());

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
      for (const kernel of this.kernels()) {
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
    for (const module of this.dkmsModules()) {
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
