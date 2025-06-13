import type { AppModule } from '../AppModule.js';
import electronUpdater, { type AppUpdater, type Logger as UpdateLogger } from 'electron-updater';
import { Logger } from '../logging/logging.js';

type DownloadNotification = Parameters<AppUpdater['checkForUpdatesAndNotify']>[0];

export class AutoUpdater implements AppModule {
  readonly #logger: UpdateLogger | null;
  readonly #notification: DownloadNotification;

  private readonly logger = Logger.getInstance();

  constructor({
    logger = null,
    downloadNotification = undefined,
  }: {
    logger?: UpdateLogger | null | undefined;
    downloadNotification?: DownloadNotification;
  } = {}) {
    this.#logger = logger;
    this.#notification = downloadNotification;
  }

  async enable(): Promise<void> {
    await this.runAutoUpdater();
  }

  getAutoUpdater(): AppUpdater {
    // Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
    // It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
    const { autoUpdater } = electronUpdater;
    return autoUpdater;
  }

  async runAutoUpdater() {
    const updater: AppUpdater = this.getAutoUpdater();
    try {
      updater.logger = this.#logger || null;
      updater.fullChangelog = true;

      if (import.meta.env.VITE_DISTRIBUTION_CHANNEL) {
        updater.channel = import.meta.env.VITE_DISTRIBUTION_CHANNEL;
      }

      return await updater.checkForUpdatesAndNotify(this.#notification);
    } catch (error) {
      if (error instanceof Error) {
        // Handle common auto-updater errors gracefully
        if (
          error.message.includes('No published versions') ||
          error.message.includes('404') ||
          error.message.includes('HttpError') ||
          error.message.includes('releases.atom')
        ) {
          this.logger.warn(`Auto-updater check failed (expected in development): ${error.message}`);
          return null;
        }
      }

      this.logger.error(`AutoUpdater - Auto-updater error: ${error instanceof Error ? error.message : String(error)}`);
      // Don't throw - let app continue without updates
      return null;
    }
  }
}

export function autoUpdater(...args: ConstructorParameters<typeof AutoUpdater>) {
  return new AutoUpdater(...args);
}
