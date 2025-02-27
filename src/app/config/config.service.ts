import { Injectable, signal } from '@angular/core';
import { AppSettings, AppState } from './interfaces';
import { Store } from '@tauri-apps/plugin-store';
import { getConfigStore } from './store';
import { info, trace } from '@tauri-apps/plugin-log';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  state = signal<AppState>({
    isMaximized: false,
  });

  settings = signal<AppSettings>({
    leftButtons: true,
    language: 'en',
    autoRefresh: false,
    copyDiagnostics: true,
    showMainLinks: false,
    systemdUserContext: false,
  });

  store!: Store;

  constructor() {
    void this.init();
  }

  async init(): Promise<void> {
    void trace('Initializing ConfigService');
    this.store = await getConfigStore();

    let storedSettings = 0;
    if (this.store) {
      for (const key in this.settings()) {
        const value: any = await this.store.get(key);
        if (value) {
          void trace(`Setting ${key} to ${value}`);
          this.settings.set({ ...this.settings(), [key]: value });
          storedSettings++;
        }
      }

      void info(`Loaded ${storedSettings} settings from store`);
    }
  }

  /**
   * Update configuration value in both the service and the store.
   * @param key The configuration key to update.
   * @param value The new value for the configuration key.
   */
  updateConfig(key: string, value: any): void {
    void trace(`Updating ${key} to ${value}`);

    const settings = { ...this.settings() };
    settings[key] = value;
    this.settings.set(settings);

    void this.store.set(key, value);
  }

  /**
   * Update the ephemeral state of the application.
   * @param key The key to update.
   * @param value The new value for the key.
   */
  updateState(key: string, value: any): void {
    void trace(`Updating state ${key} to ${value}`);

    const state = { ...this.state() };
    state[key] = value;
    this.state.set(state);
  }
}
