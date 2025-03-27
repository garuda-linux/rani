import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { TableModule } from 'primeng/table';
import { NgForOf, NgOptimizedImage } from '@angular/common';
import { DataViewModule } from 'primeng/dataview';
import { open } from '@tauri-apps/plugin-shell';
import { Card } from 'primeng/card';
import { flavors } from '@catppuccin/palette';
import { TabsModule } from 'primeng/tabs';
import { Tooltip } from 'primeng/tooltip';
import { ConfigService } from '../config/config.service';
import type { StatefulPackage } from './interfaces';
import { OsInteractService } from '../task-manager/os-interact.service';
import { GamingService } from './gaming.service';

@Component({
  selector: 'rani-gaming',
  imports: [TranslocoDirective, TableModule, DataViewModule, NgForOf, Card, NgOptimizedImage, TabsModule, Tooltip],
  templateUrl: './gaming.component.html',
  styleUrl: './gaming.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamingComponent {
  backgroundColor = signal<string>('background-color');
  tabIndex = signal<number>(0);

  protected readonly configService = inject(ConfigService);
  protected readonly gamingService = inject(GamingService);
  protected readonly osInteractService = inject(OsInteractService);
  protected readonly open = open;

  constructor() {
    effect(() => {
      const darkMode = this.configService.settings().darkMode;
      this.backgroundColor.set(darkMode ? flavors.mocha.colors.surface0.hex : flavors.latte.colors.surface0.hex);
      this.updateUi();
    });
  }

  /**
   * Update the UI based on the installed and selected packages.
   */
  updateUi(): void {
    const installedPackages: Map<string, boolean> = this.osInteractService.packages();
    this.gamingService.packages.update((packages) => {
      for (const sections of packages) {
        for (const pkg of sections.sections) {
          pkg.selected = installedPackages.get(pkg.pkgname[0]) === true;
        }
      }
      return packages;
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
}
