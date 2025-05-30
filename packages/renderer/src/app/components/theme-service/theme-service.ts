import { effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CatppuccinBackgroundColors, CatppuccinScrollBars } from '../../theme';
import { Logger } from '../logging/logging';
import { ConfigService } from '../config/config.service';
import { AppSettings } from '../config/interfaces';

export class ThemeService {
  private readonly configService = inject(ConfigService);
  private readonly document = inject(DOCUMENT);
  private readonly logger = Logger.getInstance();

  constructor() {
    effect(() => {
      const settings: AppSettings = this.configService.settings();
      this.logger.error(
        `Enabled ${settings.darkMode ? 'dark mode' : 'light mode'} via effect`,
      );
      void this.setDarkMode(settings.darkMode);
    });
  }

  /**
   * Handles the dark mode setting.
   * @param darkMode The value of the dark mode setting.
   * @private
   */
  private setDarkMode(darkMode: boolean) {
    const flavors = this.configService.settings().activeTheme.includes('Mocha')
      ? 'primary'
      : 'alt';
    if (darkMode) {
      this.document.documentElement.classList.add('p-dark');
      if (flavors === 'primary') {
        this.document.documentElement.style.scrollbarColor =
          CatppuccinScrollBars.primary.dark;
        this.document.documentElement.style.backgroundColor =
          CatppuccinBackgroundColors.primary.dark;
      } else {
        this.document.documentElement.style.scrollbarColor =
          CatppuccinScrollBars.alt.dark;
        this.document.documentElement.style.backgroundColor =
          CatppuccinBackgroundColors.alt.dark;
      }
    } else {
      this.document.documentElement.classList.remove('p-dark');
      if (flavors === 'primary') {
        this.document.documentElement.style.scrollbarColor =
          CatppuccinScrollBars.primary.light;
        this.document.documentElement.style.backgroundColor =
          CatppuccinBackgroundColors.primary.light;
      } else {
        this.document.documentElement.style.scrollbarColor =
          CatppuccinScrollBars.alt.light;
        this.document.documentElement.style.backgroundColor =
          CatppuccinBackgroundColors.alt.light;
      }
    }

    this.logger.debug(`Dark mode ${darkMode ? 'enabled' : 'disabled'}`);
  }
}
