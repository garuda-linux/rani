import { effect, inject, Injectable, signal } from '@angular/core';
import type { AppSettings, AppState, DesktopEnvironment } from './interfaces';
import { getConfigStore } from './store';

import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { Logger } from '../logging/logging';
import { LogLevel } from '../logging/interfaces';
import { usePreset } from '@primeng/themes';
import { themes } from '../../theme';
import { ElectronShellService } from '../electron-services/electron-shell.service';
import type { CommandResult } from '../../types/shell';

class PendingConfigUpdate {
  state?: object;
  settings?: object;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  state = signal<AppState>({
    availablePkgs: new Map<string, boolean>(),
    borderlessMaximizedWindow: false,
    codeName: '',
    desktopEnvironment: '' as DesktopEnvironment,
    hostname: '',
    isLiveSystem: undefined,
    isMaximized: false,
    kernel: '',
    locale: '',
    rebootPending: false,
    user: '',
  });

  settings = signal<AppSettings>({
    activeTheme: 'Catppuccin Mocha/Latte Aura',
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

  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();
  private readonly shellService = inject(ElectronShellService);

  constructor() {
    effect(async () => {
      const settings: AppSettings = this.settings();

      // const currentAutoStart: boolean = await isEnabled();
      // if (currentAutoStart && !settings.autoStart) {
      //   this.logger.debug('Syncing auto start setting with system: enable');
      //   void disable();
      // } else if (!currentAutoStart && settings.autoStart) {
      //   this.logger.debug('Syncing auto start setting with system: disable');
      //   void enable();
      // }

      // if (!this.cliMatches?.args['verbose']) {
      //   Logger.logLevel = settings.logLevel;
      // }

      usePreset(themes[settings.activeTheme]);
    });
  }

  /**
   * Initialize the ConfigService and all its settings and state.
   * @param firstRun Indicates if this is the first run of the application. If false, only changing states are updated.
   */
  async init(firstRun = true): Promise<void> {
    this.logger.trace(
      `${firstRun ? 'Initializing' : 'updating'} ConfigService`,
    );
    this.loadingService.loadingOn();

    try {
      const initPromises: Promise<PendingConfigUpdate>[] = [
        this.initInstalledPkgs(),
        this.initLocale(),
        this.initRebootPending(),
      ];

      if (firstRun) {
        initPromises.push(
          this.checkAutoStart(),
          this.initBorderlessWindow(),
          this.initCodeName(),
          this.initDesktopEnvironment(),
          this.initHostname(),
          this.initIsLive(),
          this.initKernel(),
          this.initStore(),
          this.initUser(),
        );
      }

      const config_updates: PendingConfigUpdate[] =
        await Promise.all(initPromises);
      const settings_updates = config_updates
        .map((update) => update.settings)
        .filter((update) => update);
      const state_updates = config_updates
        .map((update) => update.state)
        .filter((update) => update);

      this.settings.set(
        Object.assign({}, this.settings(), ...settings_updates),
      );
      this.state.set(Object.assign({}, this.state(), ...state_updates));

      this.logger.debug(
        `ConfigService ${firstRun ? 'initialized' : 'updated'} successfully`,
      );

      console.debug(this.settings(), this.state());
    } catch (err: unknown) {
      this.logger.error(
        `Failed while ${firstRun ? 'initializing' : 'updating'} ConfigService: ${err}`,
      );
    }

    this.loadingService.loadingOff();
  }

  /**
   * Update configuration value in both the service and the store.
   * @param key The configuration key to update.
   * @param value The new value for the configuration key.
   */
  async updateConfig(key: string, value: unknown): Promise<void> {
    this.logger.trace(`Updating ${key} to ${value}`);

    const settings = { ...this.settings() };
    (settings as Record<string, unknown>)[key] = value;
    this.settings.set(settings);

    // Save to store if available
    try {
      const store = await getConfigStore('updateConfig');
      if (store) {
        await store.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Failed to save setting to store: ${error}`);
    }
  }

  /**
   * Update the ephemeral state of the application.
   * @param key The key to update.
   * @param value The new value for the key.
   */
  updateState(key: string, value: unknown): void {
    this.logger.trace(`Updating state ${key} to ${value}`);

    const state = { ...this.state() };
    (state as Record<string, unknown>)[key] = value;
    this.state.set(state);
  }

  /**
   * Initializes the app key store, overwriting the default settings with saved ones.
   * @private
   */
  private async initStore(): Promise<PendingConfigUpdate> {
    try {
      const store = await getConfigStore('initStore');

      let storedSettings = 0;
      const settings: Record<string, unknown> = {};
      if (store) {
        for (const key of Object.keys(this.settings())) {
          if (await store.has(key)) {
            const value: unknown = await store.get(key);
            this.logger.trace(`Setting ${key} to ${value}`);
            settings[key] = value;
            storedSettings++;
          }
        }

        this.logger.info(`Loaded ${storedSettings} settings from store`);
      }

      return { settings };
    } catch (error) {
      this.logger.error(`Failed to initialize store: ${error}`);
      return {};
    }
  }

  /**
   * Initializes the current user.
   * @private
   */
  private async initUser(): Promise<PendingConfigUpdate> {
    try {
      const result: CommandResult = await new this.shellService.Command(
        'whoami',
      ).execute();
      if (result.code !== 0) {
        this.logger.error('Could not get user');
      } else {
        const user: string = result.stdout.trim();
        this.logger.debug(`User ${user}, welcome!`);
        return { state: { user } };
      }
    } catch (error) {
      this.logger.error(`Failed to get user: ${error}`);
    }
    return {};
  }

  /**
   * Get the hostname of the system.
   * @private
   */
  private async initCodeName(): Promise<PendingConfigUpdate> {
    try {
      const result: CommandResult = await new this.shellService.Command(
        'lsb_release',
      )
        .args(['-c'])
        .execute();

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
      return { state: { codeName } };
    } catch (error) {
      this.logger.error(`Failed to get code name: ${error}`);
      return { state: { codeName: 'Garuda Linux' } }; // Default fallback
    }
  }

  /**
   * Check if the system is a live system.
   * @private
   */
  private async initIsLive(): Promise<PendingConfigUpdate> {
    try {
      const result: CommandResult = await new this.shellService.Command('sh')
        .args(['-c', "df -T / |tail -n1 |awk '{print $2}'"])
        .execute();

      if (result.code !== 0) {
        this.logger.error('Could not get filesystem type');
        return {};
      }
      const isLiveSystem: boolean =
        result.stdout.trim() === 'overlay' || result.stdout.trim() === 'aufs';
      this.logger.debug(
        `Filesystem type: ${result.stdout.trim()}, is ${isLiveSystem ? 'live' : 'installed'}`,
      );
      return { state: { isLiveSystem } };
    } catch (error) {
      this.logger.error(`Failed to get filesystem type: ${error}`);
      return {};
    }
  }

  /**
   * Check if the system is set to auto-start.
   * @private
   */
  private async checkAutoStart(): Promise<PendingConfigUpdate> {
    try {
      const result: CommandResult = await new this.shellService.Command('test')
        .args(['-f', '$HOME/.config/autostart/org.garudalinux.rani.desktop'])
        .execute();

      const has_autostartfile: boolean = result.code === 0;
      return { settings: { autoStart: has_autostartfile } };
    } catch (error) {
      this.logger.error(`Failed to check autostart file: ${error}`);
      return { settings: { autoStart: true } }; // Default to true for now
    }
  }

  /**
   * Get hostname of the system.
   * @private
   */
  private async initHostname(): Promise<PendingConfigUpdate> {
    try {
      const result: CommandResult = await new this.shellService.Command(
        'hostname',
      ).execute();
      if (result.code === 0) {
        const hostname: string = result.stdout.trim();
        return { state: { hostname } };
      }
      this.logger.error('Could not get hostname');
    } catch (error) {
      this.logger.error(`Failed to get hostname: ${error}`);
    }
    return { state: { hostname: '' } };
  }

  /**
   * Get the currently running kernel.
   * @private
   */
  private async initKernel(): Promise<PendingConfigUpdate> {
    try {
      const result: CommandResult = await new this.shellService.Command('uname')
        .args(['-r'])
        .execute();

      if (result.code !== 0) {
        this.logger.error(
          `Failed to get running kernel: ${result.stderr.trim()}`,
        );
        return {};
      }
      const runningKernel: string = result.stdout.trim();
      this.logger.debug(`Running kernel: ${runningKernel}`);
      return { state: { kernel: runningKernel } };
    } catch (error) {
      this.logger.error(`Failed to get running kernel: ${error}`);
      return { state: { kernel: '6.1.0-12-garuda' } }; // Default fallback
    }
  }

  private async initDesktopEnvironment(): Promise<PendingConfigUpdate> {
    try {
      const result: CommandResult = await new this.shellService.Command('sh')
        .args(['-c', 'echo $XDG_CURRENT_DESKTOP'])
        .execute();

      if (result.code !== 0) {
        this.logger.error(
          `Failed to get desktop environment: ${result.stderr.trim()}`,
        );
        return {};
      }
      const desktopEnvironment: string = result.stdout.trim();
      this.logger.debug(`Current desktop environment: ${desktopEnvironment}`);
      return {
        state: { desktopEnvironment: desktopEnvironment as DesktopEnvironment },
      };
    } catch (error) {
      this.logger.error(`Failed to get desktop environment: ${error}`);
      return { state: { desktopEnvironment: 'KDE' } }; // Default to KDE for now
    }
  }

  private async initRebootPending(): Promise<PendingConfigUpdate> {
    try {
      const cmd = `last_update="$(date -r /var/lib/garuda/last_update +%s 2> /dev/null)"; if [ "$last_update" -gt "$(date -r /proc +%s)" ]; then exit 100; else exit 0; fi`;
      const result: CommandResult = await new this.shellService.Command('sh')
        .args(['-c', cmd])
        .execute();

      if (result.code !== 0 && result.code !== 100) {
        this.logger.error(
          `Failed to get reboot pending status: ${result.stderr.trim()}`,
        );
        return {};
      }
      this.logger.debug(`Reboot pending status: ${result.code !== 0}`);
      return { state: { rebootPending: result.code !== 0 } };
    } catch (error) {
      this.logger.error(`Failed to get reboot pending status: ${error}`);
      return { state: { rebootPending: false } }; // Default to false for now
    }
  }

  /**
   * Get the current locale of the system.
   * @private
   */
  private async initLocale(): Promise<PendingConfigUpdate> {
    try {
      const result: CommandResult = await new this.shellService.Command('sh')
        .args(['-c', 'locale | grep LANG='])
        .execute();

      if (result.code !== 0) {
        this.logger.error(
          `Failed to get current locale: ${result.stderr.trim()}`,
        );
        return {};
      }
      const locale: string = result.stdout.trim().split('=')[1];
      this.logger.debug(`Current locale: ${locale}`);
      return { state: { locale } };
    } catch (error) {
      this.logger.error(`Failed to get current locale: ${error}`);
      return { state: { locale: 'en' } };
    }
  }

  /**
   * Get the list of available packages from the system.
   * @private
   */
  private async initInstalledPkgs(): Promise<PendingConfigUpdate> {
    try {
      const result: CommandResult = await new this.shellService.Command(
        'pacman',
      )
        .args(['-Ssq'])
        .execute();
      console.log(result);
      if (result.code !== 0) {
        this.logger.error(`Failed to get installed packages: ${result.stderr}`);
        return {};
      }

      const availableMap = new Map<string, boolean>();
      const packages = result.stdout.trim().split('\n');
      for (const pkg of packages) {
        availableMap.set(pkg, true);
      }

      this.logger.debug(`Available packages: ${availableMap.size}`);
      return { state: { availablePkgs: availableMap } };
    } catch (error) {
      this.logger.error(`Failed to get available packages: ${error}`);
      return { state: { availablePkgs: new Map<string, boolean>() } }; // Default to empty map for now
    }
  }

  /**
   * Check if the borderless maximized window setting is enabled.
   * @private
   */
  private async initBorderlessWindow(): Promise<PendingConfigUpdate> {
    try {
      const result: CommandResult = await new this.shellService.Command('sh')
        .args([
          '-c',
          "cat ~/.config/kwinrc | grep -q 'BorderlessMaximizedWindows=true'",
        ])
        .execute();

      this.logger.debug(
        `Borderless maximized window setting: ${result.code === 0 ? 'enabled' : 'disabled'}`,
      );
      if (result.code === 0) {
        return { state: { borderlessMaximizedWindow: true } };
      }
      return { state: { borderlessMaximizedWindow: false } };
    } catch (error) {
      this.logger.error(`Failed to check borderless window setting: ${error}`);
      return { state: { borderlessMaximizedWindow: false } };
    }
  }
}
