import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { OsInteractService } from '../task-manager/os-interact.service';
import { PackageSection, PackageSections, StatefulPackage } from '../gaming/interfaces';
import { ConfigService } from '../config/config.service';
import { Tab, TabList, Tabs } from 'primeng/tabs';
import { TranslocoDirective } from '@jsverse/transloco';
import { Logger } from '../logging/logging';
import { resolveResource } from '@tauri-apps/api/path';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { Button } from 'primeng/button';
import { open } from '@tauri-apps/plugin-shell';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { type Table, TableModule } from 'primeng/table';
import { Checkbox } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  selector: 'rani-packages',
  imports: [
    Tab,
    TabList,
    Tabs,
    TranslocoDirective,
    Button,
    IconField,
    InputIcon,
    InputText,
    TableModule,
    Checkbox,
    FormsModule,
    NgClass,
  ],
  templateUrl: './packages.component.html',
  styleUrl: './packages.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackagesComponent implements OnInit {
  loading = signal<boolean>(true);
  tabIndex = signal<number>(0);
  packageSearch = signal<string>('');

  @ViewChild('packageTable') table!: Table;

  loadingService = inject(LoadingService);
  osInteractService = inject(OsInteractService);

  protected data = signal<PackageSections>([
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

  protected readonly configService = inject(ConfigService);
  protected readonly open = open;
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = Logger.getInstance();

  constructor() {
    effect(() => {
      const packages: Map<string, boolean> = this.osInteractService.packages();
      const tabIndex: number = this.tabIndex();
      if (!this.loading()) {
        this.updateUi();
      }
    });
  }

  async ngOnInit() {
    this.logger.trace('Initializing packages component');
    this.loadingService.loadingOn();

    let sections: PackageSections = this.data();
    for (let i: number = 0; i < sections.length; i++) {
      const section: PackageSection = sections[i];
      const resourcePath: string = await resolveResource(
        `../assets/parsed/${section.name.replace('packages.', '')}-repo.json`,
      );
      section.sections = JSON.parse(await readTextFile(resourcePath));

      this.logger.debug(`Loaded section ${section.name} with ${section.sections.length} packages`);
    }
    this.data.set(sections);

    this.loading.set(false);
    this.loadingService.loadingOff();

    this.updateUi();
  }

  /**
   * Update the state of the UI based on the installed packages.
   */
  updateUi(): void {
    this.logger.trace('Updating packages UI');
    this.clear(this.table);

    const installedPackages: Map<string, boolean> = this.osInteractService.packages();
    this.data.update((data: PackageSections) => {
      for (const sections of data) {
        for (const pkg of sections.sections) {
          pkg.selected = installedPackages.get(pkg.pkgname[0]) === true;
        }
      }
      return data;
    });

    // We do it like this because via two-way binding, the table doesn't update the data
    // Very likely it is not compatible with zoneless change detection
    this.table.value = this.data()[this.tabIndex()].sections;
    this.table.totalRecords = this.table.value.length;

    this.cdr.markForCheck();
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
   * Clear the systemd service table search and options.
   * @param table The table component to clear
   */
  clear(table: Table): void {
    table.clear();
    this.packageSearch.set('');
  }
}
