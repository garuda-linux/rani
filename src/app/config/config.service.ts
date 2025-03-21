import { effect, inject, Injectable, signal } from '@angular/core';
import { AppSettings, AppState, DesktopEnvironment } from './interfaces';
import type { Store } from '@tauri-apps/plugin-store';
import { getConfigStore } from './store';
import { Logger } from '../logging/logging';
import { type ChildProcess, Command } from '@tauri-apps/plugin-shell';
import { hostname } from '@tauri-apps/plugin-os';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { BaseDirectory, exists } from '@tauri-apps/plugin-fs';
import { LogLevel } from '../logging/interfaces';
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';

class PendingConfigUpdate {
  state?: object;
  settings?: object;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  state = signal<AppState>({
    codeName: '',
    desktopEnvironment: '' as DesktopEnvironment,
    hostname: '',
    isLiveSystem: undefined,
    isMaximized: false,
    kernel: '',
    user: '',
  });

  settings = signal<AppSettings>({
    autoRefresh: false,
    autoStart: true,
    copyDiagnostics: true,
    darkMode: true,
    firstBoot: undefined,
    language: 'en',
    leftButtons: true,
    logLevel: LogLevel.INFO,
    showMainLinks: true,
    systemdUserContext: false,
  });

  public store!: Store;
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();

  constructor() {
    effect(async () => {
      const settings: AppSettings = this.settings();
      const currentAutoStart: boolean = await isEnabled();
      if (currentAutoStart && !settings.autoStart) {
        this.logger.debug('Syncing auto start setting with system: enable');
        await disable();
      } else if (!currentAutoStart && settings.autoStart) {
        this.logger.debug('Syncing auto start setting with system: disable');
        await enable();
      }
    });
  }

  async init(): Promise<void> {
    this.logger.trace('Initializing ConfigService');
    this.loadingService.loadingOn();

    try {
      const initPromises: Promise<PendingConfigUpdate>[] = [
        this.initStore(),
        this.initIsLive(),
        this.initUser(),
        this.initCodeName(),
        this.checkAutoStart(),
        this.initHostname(),
        this.initKernel(),
        this.initDesktopEnvironment(),
      ];
      const config_updates: PendingConfigUpdate[] = await Promise.all(initPromises);
      const settings_updates = config_updates.map((update) => update.settings).filter((update) => update);
      const state_updates = config_updates.map((update) => update.state).filter((update) => update);

      this.settings.set(Object.assign({}, this.settings(), ...settings_updates));
      this.state.set(Object.assign({}, this.state(), ...state_updates));

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
    this.store = await getConfigStore('initStore');

    let storedSettings: number = 0;
    const settings: { [key: string]: any } = {};
    if (this.store) {
      for (const key of Object.keys(this.settings())) {
        if (await this.store.has(key)) {
          const value: any = await this.store.get(key);
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
    }
    const codeName: string =
      result.stdout
        .split(':')[1]
        .trim()
        .match(/[A-Z][a-z]+/g)
        ?.join(' ') ?? 'Unknown';
    return { state: { codeName: codeName } };
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
    }
    const isLiveSystem: boolean = result.stdout.trim() === 'overlay' || result.stdout.trim() === 'aufs';
    this.logger.debug(`Filesystem type: ${result.stdout.trim()}, is ${isLiveSystem ? 'live' : 'installed'}`);
    return { state: { isLiveSystem: isLiveSystem } };
  }

  /**
   * Check if the system is set to auto-start.
   * @private
   */
  private async checkAutoStart(): Promise<PendingConfigUpdate> {
    const has_autostartfile: boolean = await exists('.config/autostart/org.garudalinux.rani.desktop', {
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

  /**
   * Get the currently running kernel.
   * @private
   */
  private async initKernel(): Promise<PendingConfigUpdate> {
    const cmd = 'uname -r';
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

    if (result.code !== 0) {
      this.logger.error(`Failed to get running kernel: ${result.stderr.trim()}`);
      return {};
    }
    const runningKernel: string = result.stdout.trim();
    this.logger.debug(`Running kernel: ${runningKernel}`);
    return { state: { kernel: runningKernel } };
  }

  private async initDesktopEnvironment(): Promise<PendingConfigUpdate> {
    const cmd = 'echo $XDG_CURRENT_DESKTOP';
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

    if (result.code !== 0) {
      this.logger.error(`Failed to get running kernel: ${result.stderr.trim()}`);
      return {};
    }
    const desktopEnvironment: string = result.stdout.trim();
    this.logger.debug(`Current desktop environment: ${desktopEnvironment}`);
    return { state: { desktopEnvironment: desktopEnvironment as DesktopEnvironment } };
  }
}
