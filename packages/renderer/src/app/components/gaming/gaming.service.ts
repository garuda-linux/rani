import { inject, Injectable, signal } from '@angular/core';
import type { PackageSections } from './interfaces';
import { gamingPackageLists } from './package-lists';
import { ConfigService } from '../config/config.service';
import { Logger } from '../logging/logging';

@Injectable({
  providedIn: 'root',
})
export class GamingService {
  packages = signal<PackageSections>(gamingPackageLists);

  private readonly configService = inject(ConfigService);
  private readonly logger = Logger.getInstance();

  constructor() {
    this.packages.update((packages) => {
      for (const sections of packages) {
        for (const pkg of sections.sections) {
          const disabled: boolean =
            this.configService.state().availablePkgs.get(pkg.pkgname[0]) !==
            true;
          if (disabled) {
            pkg.disabled = true;
            this.logger.warn(
              `Package ${pkg.pkgname[0]} is not available, removing from list`,
            );
          }
        }
      }

      return packages;
    });
  }
}
