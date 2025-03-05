import { effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CatppuccinScrollbars } from '../theme';
import { Logger } from '../logging/logging';
import { ConfigService } from '../config/config.service';

export class ThemeHandler {
  private readonly configService = inject(ConfigService);
  private readonly document = inject(DOCUMENT);
  private readonly logger = Logger.getInstance();

  constructor() {
    effect(() => {
      const darkmode = this.configService.settings().darkMode;
      void this.setDarkMode(darkmode);
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
    this.document.documentElement.style.backgroundColor = darkmode
      ? '#1e1e2e'
      : '#eff1f5';

    this.logger.debug(`Dark mode ${darkmode ? 'enabled' : 'disabled'}`);
  }
}
