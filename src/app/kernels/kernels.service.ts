import { computed, inject, Injectable, signal } from '@angular/core';
import { ChildProcess } from '@tauri-apps/plugin-shell';
import type { DkmsModules, DkmsModuleStatus, Kernel, Kernels } from './types';
import { ConfigService } from '../config/config.service';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { Logger } from '../logging/logging';
import { TaskManagerService } from '../task-manager/task-manager.service';

@Injectable({
  providedIn: 'root',
})
export class KernelsService {
  dkmsModules = signal<DkmsModules>([]);
  dkmsModulesBroken = computed(() => this.dkmsModules().some((module) => module.status !== 'installed'));
  headersMissing = computed(() => this.kernels().some((kernel) => kernel.selected && !kernel.headersSelected));
  kernels = signal<Kernels>([]);
  loading = signal<boolean>(true);

  protected readonly configService = inject(ConfigService);
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();
  private readonly taskManagerService = inject(TaskManagerService);

  constructor() {
    void this.init();
  }

  async init() {
    this.loadingService.loadingOn();

    const promises: Promise<void>[] = [this.getAvailableKernels(), this.getDkmsStatus()];
    await Promise.all(promises);

    this.loadingService.loadingOff();
    this.loading.set(false);
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
}
