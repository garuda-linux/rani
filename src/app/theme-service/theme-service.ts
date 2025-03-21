import { effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CatppuccinScrollbars } from '../theme';
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
      this.logger.error(`Enabled ${settings.darkMode ? 'dark mode' : 'light mode'} via effect`);
      void this.setDarkMode(settings.darkMode);
    });
  }

  /**
   * Toggle dark mode, updating the local storage and the document accordingly.
   */
  public setDarkMode(darkmode: boolean): void {
    this.document.documentElement.classList.toggle('p-dark', darkmode);
    this.document.documentElement.style.scrollbarColor = darkmode
      ? CatppuccinScrollbars.dark
      : CatppuccinScrollbars.light;
    this.document.documentElement.style.backgroundColor = darkmode ? '#1e1e2e' : '#eff1f5';

    this.logger.debug(`Dark mode ${darkmode ? 'enabled' : 'disabled'}`);
  }
}
