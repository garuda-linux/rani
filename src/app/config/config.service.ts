import { Injectable, signal } from '@angular/core';
import { AppSettings, AppState } from './interfaces';
import { Store } from '@tauri-apps/plugin-store';
import { getConfigStore } from './store';
import { Logger } from '../logging/logging';
import { ChildProcess, Command } from '@tauri-apps/plugin-shell';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  state = signal<AppState>({
    isMaximized: false,
    user: '',
  });

  settings = signal<AppSettings>({
    leftButtons: true,
    language: 'en',
    autoRefresh: false,
    copyDiagnostics: true,
    showMainLinks: false,
    systemdUserContext: false,
  });

  public store!: Store;
  private readonly logger = Logger.getInstance();

  constructor() {
    void this.init();
  }

  async init(): Promise<void> {
    this.logger.trace('Initializing ConfigService');

    try {
      await this.initUser();
      await this.initStore();
      this.logger.debug('ConfigService initialized successfully');
    } catch (err: any) {
      this.logger.error(`Failed while initializing ConfigService: ${err}`);
    }
  }

  /**
   * Update configuration value in both the service and the store.
   * @param key The configuration key to update.
   * @param value The new value for the configuration key.
   */
  async updateConfig(key: string, value: any): Promise<void> {
    this.logger.trace(`Updating ${key} to ${value}`);
    while (!this.store) {
      await new Promise((r) => setTimeout(r, 100));
    }

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
    this.logger.trace(`Updating state ${key} to ${value}`);

    const state = { ...this.state() };
    state[key] = value;
    this.state.set(state);
  }

  /**
   * Initializes the app key store, overwriting the default settings with saved ones.
   * @private
   */
  private async initStore(): Promise<void> {
    this.store = await getConfigStore();

    let storedSettings = 0;
    if (this.store) {
      for (const key in this.settings()) {
        const value: any = await this.store.get(key);
        if (value) {
          this.logger.trace(`Setting ${key} to ${value}`);
          this.settings.set({ ...this.settings(), [key]: value });
          storedSettings++;
        }
      }

      this.logger.info(`Loaded ${storedSettings} settings from store`);
    }
  }

  /**
   * Initializes the current user.
   * @private
   */
  private async initUser(): Promise<void> {
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', 'whoami']).execute();
    if (result.code !== 0) {
      this.logger.error('Could not get user');
    } else {
      this.state.update((state) => {
        state.user = result.stdout.trim();
        this.logger.debug(`User ${state.user}, welcome!`);
        return state;
      });
    }
  }
}
