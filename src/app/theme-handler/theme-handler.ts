import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CatppuccinScrollbars } from '../theme';
import { Logger } from '../logging/logging';
import { ConfigService } from '../config/config.service';

export class ThemeHandler {
  private readonly configService = inject(ConfigService);
  private readonly document = inject(DOCUMENT);
  private readonly logger = Logger.getInstance();

  constructor() {
    this.checkDarkMode();
  }

  /**
   * Toggle dark mode, updating the local storage and the document accordingly.
   */
  public async toggleDarkMode(): Promise<void> {
    await this.configService.updateConfig('darkMode', !this.configService.settings().darkMode);

    this.document.documentElement.classList.toggle('p-dark', this.configService.settings().darkMode);
    this.document.documentElement.style.scrollbarColor = this.configService.settings().darkMode
      ? CatppuccinScrollbars.dark
      : CatppuccinScrollbars.light;
    this.document.documentElement.style.backgroundColor = this.configService.settings().darkMode
      ? '#1e1e2e'
      : '#eff1f5';

    this.logger.debug(`Dark mode ${this.configService.settings().darkMode ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if dark mode is enabled and set it accordingly.
   * @private
   */
  private checkDarkMode(): void {
    if (
      localStorage.getItem('darkMode') === 'true' ||
      (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      if (!this.configService.settings().darkMode) {
        void this.toggleDarkMode();
      }
    } else {
      if (this.configService.settings().darkMode) {
        void this.toggleDarkMode();
      }
    }
  }
}
