import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { TableModule } from 'primeng/table';
import { NgForOf, NgOptimizedImage } from '@angular/common';
import { DataViewModule } from 'primeng/dataview';
import { open } from '@tauri-apps/plugin-shell';
import { Card } from 'primeng/card';
import { flavors } from '@catppuccin/palette';
import { TabsModule } from 'primeng/tabs';
import { Tooltip } from 'primeng/tooltip';
import { Logger } from '../logging/logging';
import { ConfigService } from '../config/config.service';
import type { GamingSections, StatefulPackage } from './interfaces';
import { OsInteractService } from '../task-manager/os-interact.service';
import { gamingPackageLists } from './package-lists';

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
  osInteractService = inject(OsInteractService);

  protected readonly data: GamingSections = gamingPackageLists;
  protected readonly open = open;
  protected readonly configService = inject(ConfigService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = Logger.getInstance();

  constructor() {
    effect(() => {
      const darkMode = this.configService.settings().darkMode;
      this.backgroundColor.set(darkMode ? flavors.mocha.colors.surface0.hex : flavors.latte.colors.surface0.hex);
      this.updateUi();
    });
  }

  updateUi(): void {
    const installed_packages = this.osInteractService.packages();
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
