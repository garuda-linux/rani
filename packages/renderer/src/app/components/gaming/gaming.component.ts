import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  type OnInit,
  signal,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { TableModule } from 'primeng/table';
import { NgForOf, NgOptimizedImage } from '@angular/common';
import { DataViewModule } from 'primeng/dataview';
import { ElectronShellService } from '../../electron-services';
import { Card } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { Tooltip } from 'primeng/tooltip';
import { ConfigService } from '../config/config.service';
import type { StatefulPackage } from './interfaces';
import { OsInteractService } from '../task-manager/os-interact.service';
import { GamingService } from './gaming.service';
import { CatppuccinBackgroundColors } from '../../theme';
import { Router, type UrlTree } from '@angular/router';

@Component({
  selector: 'rani-gaming',
  imports: [TranslocoDirective, TableModule, DataViewModule, NgForOf, Card, NgOptimizedImage, TabsModule, Tooltip],
  templateUrl: './gaming.component.html',
  styleUrl: './gaming.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamingComponent implements OnInit {
  tabIndex = signal<number>(0);

  protected readonly configService = inject(ConfigService);
  private readonly shellService = inject(ElectronShellService);

  backgroundColor = computed(() => {
    const flavors = this.configService.settings().activeTheme.includes('Mocha') ? 'primary' : 'alt';
    if (this.configService.settings().darkMode) {
      return flavors === 'primary'
        ? CatppuccinBackgroundColors.primary.darkSelected
        : CatppuccinBackgroundColors.alt.darkSelected;
    } else {
      return flavors === 'primary'
        ? CatppuccinBackgroundColors.primary.lightSelected
        : CatppuccinBackgroundColors.alt.lightSelected;
    }
  });

  protected readonly gamingService = inject(GamingService);
  protected readonly osInteractService = inject(OsInteractService);
  protected readonly open = open;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      const installedPackages: Map<string, boolean> = this.osInteractService.packages();
      this.gamingService.packages.update((packages) => {
        for (const sections of packages) {
          for (const pkg of sections.sections) {
            pkg.selected = installedPackages.get(pkg.pkgname[0]) === true;
          }
        }
        return packages;
      });

      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    const url: UrlTree = this.router.parseUrl(this.router.url);
    if (!url.fragment) {
      void this.router.navigate([], { fragment: 'launchers' });
      return;
    }

    switch (url.fragment) {
      case 'launchers':
        this.tabIndex.set(0);
        break;
      case 'wine':
        this.tabIndex.set(1);
        break;
      case 'tools':
        this.tabIndex.set(2);
        break;
      case 'misc':
        this.tabIndex.set(3);
        break;
      case 'controllers':
        this.tabIndex.set(4);
        break;
      case 'games':
        this.tabIndex.set(5);
        break;
      case 'emulators':
        this.tabIndex.set(6);
        break;
      default:
        this.tabIndex.set(0);
    }
  }

  /**
   * Set the fragment in the URL.
   * @param fragment The fragment to navigate to.
   */
  navigate(fragment: string) {
    void this.router.navigate([], { fragment });
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
