import { inject, Injectable, signal } from '@angular/core';
import { AppSettings, AppState } from './interfaces';
import { Store } from '@tauri-apps/plugin-store';
import { getConfigStore } from './store';
import { Logger } from '../logging/logging';
import { ChildProcess, Command } from '@tauri-apps/plugin-shell';
import { hostname } from '@tauri-apps/plugin-os';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { checkFirstBoot } from './first-boot';
import { BaseDirectory, exists } from '@tauri-apps/plugin-fs';
import { LogLevel } from '../logging/interfaces';

class PendingConfigUpdate {
  state?: object;
  settings?: object;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  state = signal<AppState>({
    isMaximized: false,
    user: '',
    codeName: '',
    hostname: '',
    isLiveSystem: undefined,
  });

  settings = signal<AppSettings>({
    leftButtons: true,
    language: 'en',
    darkMode: true,
    autoRefresh: false,
    copyDiagnostics: true,
    logLevel: LogLevel.INFO,
    showMainLinks: false,
    systemdUserContext: false,
    autoStart: true,
    firstBoot: undefined,
  });

  public store!: Store;
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();

  constructor() {
    void this.init();
  }

  async init(): Promise<void> {
    this.logger.trace('Initializing ConfigService');

    // Window is hidden by default, after checking whether we are not required to autostart the
    // setup assistant, we can show it
    if (await checkFirstBoot()) return;

    try {
      const initPromises: Promise<PendingConfigUpdate>[] = [
        this.initStore(),
        this.initIsLive(),
        this.initUser(),
        this.initCodeName(),
        this.checkAutoStart(),
        this.initHostname(),
      ];
      const config_updates = await Promise.all(initPromises);
      const settings_updates = config_updates.map((update) => update.settings);
      const state_updates = config_updates.map((update) => update.state);

      this.settings.set(Object.assign({}, ...settings_updates));
      this.state.set(Object.assign({}, ...state_updates));

      Logger.logLevel = this.settings().logLevel;
      this.logger.debug('ConfigService initialized successfully');
    } catch (err: any) {
      this.logger.error(`Failed while initializing ConfigService: ${err}`);
    }

    this.loadingService.loadingOff();
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
  private async initStore(): Promise<PendingConfigUpdate> {
    this.store = await getConfigStore();

    let storedSettings = 0;
    const settings: { [key: string]: any } = {};
    if (this.store) {
      for (const key in this.settings()) {
        const value: any = await this.store.has(key);
        if (value) {
          this.logger.trace(`Setting ${key} to ${value}`);
          settings[key] = value;
          storedSettings++;
        }
      }

      this.logger.info(`Loaded ${storedSettings} settings from store`);
    }

    return { settings: settings };
  }

  /**
   * Initializes the current user.
   * @private
   */
  private async initUser(): Promise<PendingConfigUpdate> {
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', 'whoami']).execute();
    if (result.code !== 0) {
      this.logger.error('Could not get user');
    } else {
      const user: string = result.stdout.trim();
      this.logger.debug(`User ${user}, welcome!`);
      return { state: { user: user } };
    }
    return {};
  }

  /**
   * Get the hostname of the system.
   * @private
   */
  private async initCodeName(): Promise<PendingConfigUpdate> {
    const cmd = 'lsb_release -c';
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

    if (result.code !== 0) {
      this.logger.error('Could not get code name');
      return {};
    } else {
      const codeName: string =
        result.stdout
          .split(':')[1]
          .trim()
          .match(/[A-Z][a-z]+/g)
          ?.join(' ') ?? 'Unknown';
      return { state: { codeName: codeName } };
    }
  }

  /**
   * Check if the system is a live system.
   * @private
   */
  private async initIsLive(): Promise<PendingConfigUpdate> {
    const cmd = "df -T / |tail -n1 |awk '{print $2}'";
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

    if (result.code !== 0) {
      this.logger.error('Could not get filesystem type');
      return {};
    } else {
      const isLiveSystem: boolean = result.stdout.trim() === 'overlay' || result.stdout.trim() === 'aufs';
      this.logger.debug(`Filesystem type: ${result.stdout.trim()}, is ${isLiveSystem ? 'live' : 'installed'}`);
      return { state: { isLiveSystem: isLiveSystem } };
    }
  }

  /**
   * Check if the system is set to auto-start.
   * @private
   */
  private async checkAutoStart(): Promise<PendingConfigUpdate> {
    const has_autostartfile = await exists('.config/autostart/org.garudalinux.rani.desktop', {
      baseDir: BaseDirectory.Home,
    });
    return { settings: { autoStart: has_autostartfile } };
  }

  /**
   * Get hostname of the system.
   * @private
   */
  private async initHostname(): Promise<PendingConfigUpdate> {
    const host: string = (await hostname())!;
    return { state: { hostname: host } };
  }
}
