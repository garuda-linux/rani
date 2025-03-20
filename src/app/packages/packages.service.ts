import { inject, Injectable, signal } from '@angular/core';
import { PackageSection, PackageSections } from '../gaming/interfaces';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { OsInteractService } from '../task-manager/os-interact.service';
import { ConfigService } from '../config/config.service';
import { Logger } from '../logging/logging';
import { resolveResource } from '@tauri-apps/api/path';
import { readTextFile } from '@tauri-apps/plugin-fs';

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
  protected readonly open = open;
  private readonly logger = Logger.getInstance();

  constructor() {
    void this.init();
  }

  async init() {
    this.loadingService.loadingOn();

    let sections: PackageSections = this.packages();
    for (let i: number = 0; i < sections.length; i++) {
      const section: PackageSection = sections[i];
      const path = `../assets/parsed/${section.name.replace('packages.', '')}-repo.json`;
      const resourcePath: string = await resolveResource(path);

      section.sections = JSON.parse(await readTextFile(resourcePath));
      this.logger.debug(`Loaded section ${section.name} with ${section.sections.length} packages`);
    }

    this.packages.set(sections);
    this.loading.set(false);
    this.loadingService.loadingOff();
  }
}
