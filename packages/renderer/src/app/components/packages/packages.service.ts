import { inject, Injectable, signal } from '@angular/core';
import type { PackageSection, PackageSections } from '../gaming/interfaces';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { OsInteractService } from '../task-manager/os-interact.service';
import { ConfigService } from '../config/config.service';
import { Logger } from '../logging/logging';
import { resolveResource } from '../electron-services';
import { ElectronFsService } from '../electron-services';

@Injectable({
  providedIn: 'root',
})
export class PackagesService {
  loading = signal<boolean>(true);
  packages = signal<PackageSections>([
    {
      name: 'packages.documents',
      sections: [],
    },
    {
      name: 'packages.internet',
      sections: [],
    },
    {
      name: 'packages.multimedia',
      sections: [],
    },
    {
      name: 'packages.other',
      sections: [],
    },
    {
      name: 'packages.science',
      sections: [],
    },
    {
      name: 'packages.security',
      sections: [],
    },
  ]);

  loadingService = inject(LoadingService);
  osInteractService = inject(OsInteractService);

  protected readonly configService = inject(ConfigService);
  private readonly fsService = new ElectronFsService();

  private readonly logger = Logger.getInstance();

  constructor() {
    void this.init();
  }

  async init() {
    this.loadingService.loadingOn();

    const sections = this.packages();
    for (let i = 0; i < sections.length; i++) {
      const section: PackageSection = sections[i];
      const path = `../../assets/parsed/${section.name.replace('packages.', '')}-repo.json`;

      try {
        const resourcePath: string = await resolveResource(path);

        // Use the new safe JSON reading method with default empty array
        section.sections = await this.fsService.safeReadJsonFile(
          resourcePath,
          [] as any[],
        );
        this.logger.debug(
          `Loaded section ${section.name} with ${section.sections.length} packages`,
        );
      } catch (error) {
        this.logger.error(`Failed to load section ${section.name}: ${error}`);
        section.sections = [];
      }
    }

    for (const section of sections) {
      for (const pkg of section.sections) {
        const disabled: boolean =
          this.configService.state().availablePkgs.get(pkg.pkgname[0]) !== true;
        if (disabled) {
          pkg.disabled = true;
          this.logger.warn(
            `Package ${pkg.pkgname[0]} is not available, removing from list`,
          );
        }
      }
    }

    this.packages.set(sections);
    this.loading.set(false);
    this.loadingService.loadingOff();
  }
}
