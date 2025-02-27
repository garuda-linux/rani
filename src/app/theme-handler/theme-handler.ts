import { inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { getConfigStore } from '../config/store';
import { CatppuccinScrollbars } from '../theme';
import { Logger } from '../logging/logging';

export class ThemeHandler {
  darkMode = signal<boolean>(true);

  private readonly document = inject(DOCUMENT);
  private readonly logger = Logger.getInstance();

  constructor() {
    this.checkDarkMode();
  }

  /**
   * Toggle dark mode, updating the local storage and the document accordingly.
   */
  public async toggleDarkMode(): Promise<void> {
    this.darkMode.set(!this.darkMode());

    this.document.documentElement.classList.toggle('p-dark', this.darkMode());
    this.document.documentElement.style.scrollbarColor = this.darkMode()
      ? CatppuccinScrollbars.dark
      : CatppuccinScrollbars.light;
    this.document.documentElement.style.backgroundColor = this.darkMode() ? '#1e1e2e' : '#eff1f5';

    this.logger.debug(`Dark mode ${this.darkMode() ? 'enabled' : 'disabled'}.`);
    void (await getConfigStore()).set('darkMode', this.darkMode());
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
      if (!this.darkMode()) {
        void this.toggleDarkMode();
      }
    } else {
      if (this.darkMode()) {
        void this.toggleDarkMode();
      }
    }
  }
}
