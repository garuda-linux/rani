import { effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CatppuccinBackgroundColors, CatppuccinScrollBars } from '../../theme';
import { Logger } from '../../logging/logging';
import { ConfigService } from '../config/config.service';
import { AppSettings } from '../config/interfaces';
import { DesignerService, ScrollbarColors } from '../designer/designerservice';

export class ThemeService {
  private readonly configService = inject(ConfigService);
  private readonly designerService = inject(DesignerService);
  private readonly document = inject(DOCUMENT);
  private readonly logger = Logger.getInstance();

  constructor() {
    effect(() => {
      const settings: AppSettings = this.configService.settings();
      this.logger.debug(`Enabled ${settings.darkMode ? 'dark mode' : 'light mode'} via effect`);
      void this.setDarkMode(settings.darkMode);
    });
  }

  /**
   * Handles the dark mode setting.
   * @param darkMode The value of the dark mode setting.
   * @private
   */
  private setDarkMode(darkMode: boolean): void {
    let flavors: string;
    switch (true) {
      case this.configService.settings().activeTheme.includes('Mocha'):
        flavors = 'primary';
        break;
      case this.configService.settings().activeTheme.includes('Latte'):
        flavors = 'alt';
        break;
      case this.configService.settings().activeTheme === 'Custom Themedesigner':
        flavors = 'custom';
        break;
      default:
        flavors = 'primary';
    }
    this.logger.debug(`Dark mode: ${darkMode}, Flavors: ${flavors}`);

    if (darkMode) {
      this.document.documentElement.classList.add('p-dark');
      if (flavors === 'primary') {
        this.document.documentElement.style.scrollbarColor = CatppuccinScrollBars.primary.dark;
        this.document.documentElement.style.backgroundColor = CatppuccinBackgroundColors.primary.dark;
      } else if (flavors === 'alt') {
        this.document.documentElement.style.scrollbarColor = CatppuccinScrollBars.alt.dark;
        this.document.documentElement.style.backgroundColor = CatppuccinBackgroundColors.alt.dark;
      } else if (flavors === 'custom') {
        const colors: ScrollbarColors = this.designerService.getScrollbarColors(true);
        this.document.documentElement.style.scrollbarColor = colors.scrollbarColor;
        this.document.documentElement.style.backgroundColor = colors.scrollbarColor;
      }
    } else {
      this.document.documentElement.classList.remove('p-dark');
      if (flavors === 'primary') {
        this.document.documentElement.style.scrollbarColor = CatppuccinScrollBars.primary.light;
        this.document.documentElement.style.backgroundColor = CatppuccinBackgroundColors.primary.light;
      } else if (flavors === 'alt') {
        this.document.documentElement.style.scrollbarColor = CatppuccinScrollBars.alt.light;
        this.document.documentElement.style.backgroundColor = CatppuccinBackgroundColors.alt.light;
      } else if (flavors === 'custom') {
        const colors: ScrollbarColors = this.designerService.getScrollbarColors(false);
        this.document.documentElement.style.scrollbarColor = colors.scrollbarColor;
        this.document.documentElement.style.backgroundColor = colors.scrollbarColor;
      }
    }

    this.logger.debug(`Dark mode ${darkMode ? 'enabled' : 'disabled'}`);
  }
}
