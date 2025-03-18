import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, signal } from '@angular/core';
import { OsInteractService } from '../task-manager/os-interact.service';
import { GamingSections, StatefulPackage } from '../gaming/interfaces';
import { ConfigService } from '../config/config.service';
import { flavors } from '@catppuccin/palette';
import { Card } from 'primeng/card';
import { DataView } from 'primeng/dataview';
import { NgForOf, NgOptimizedImage } from '@angular/common';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { TranslocoDirective } from '@jsverse/transloco';
import { Tooltip } from 'primeng/tooltip';
import { Logger } from '../logging/logging';
import { resolveResource } from '@tauri-apps/api/path';
import { readTextFile } from '@tauri-apps/plugin-fs';

@Component({
  selector: 'rani-packages',
  imports: [
    Card,
    DataView,
    NgForOf,
    NgOptimizedImage,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    TranslocoDirective,
    Tooltip,
  ],
  templateUrl: './packages.component.html',
  styleUrl: './packages.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackagesComponent {
  backgroundColor = signal<string>('background-color');
  tabIndex = signal<number>(0);
  osInteractService = inject(OsInteractService);

  protected data: GamingSections = [
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
  ];
  protected readonly open = open;
  protected readonly configService = inject(ConfigService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = Logger.getInstance();

  constructor() {
    effect(() => {
      const darkMode: boolean = this.configService.settings().darkMode;
      this.backgroundColor.set(darkMode ? flavors.mocha.colors.surface0.hex : flavors.latte.colors.surface0.hex);
      this.updateUi();
    });

    void this.init();
  }

  async init() {
    this.logger.trace('Initializing packages component');
    const resourcePath: string = await resolveResource('../assets/parsed/documents-repo.json');
    const firstSection = this.data.find((section) => section.name === 'packages.documents');
    firstSection?.sections.push(...JSON.parse(await readTextFile(resourcePath)));
    this.cdr.markForCheck();

    for (const section of this.data) {
      if (section.name === 'packages.documents') continue;
      const resourcePath: string = await resolveResource(
        `../assets/parsed/${section.name.replace('packages.', '')}-repo.json`,
      );
      section.sections.push(...JSON.parse(await readTextFile(resourcePath)));
    }
    this.cdr.markForCheck();
  }

  updateUi(): void {
    const installed_packages: Map<string, boolean> = this.osInteractService.packages();
    for (const sections of this.data) {
      for (const pkg of sections.sections) {
        pkg.selected = installed_packages.get(pkg.pkgname[0]) === true;
      }
    }
    (window as any).aaaaaaap = this.data;
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
}
