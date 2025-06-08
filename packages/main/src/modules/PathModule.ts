import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import { ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { Logger } from '../logging/logging.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PathModule implements AppModule {
  private readonly isDevelopment: boolean;
  private readonly logger = Logger.getInstance();

  constructor(isDevelopment = false) {
    this.isDevelopment = isDevelopment;
  }

  enable({ app }: ModuleContext): void {
    this.setupPathHandlers(app);
  }

  private setupPathHandlers(app: Electron.App): void {
    // Path Operations
    ipcMain.handle('path:appConfigDir', async () => {
      try {
        return app.getPath('userData');
      } catch (error: any) {
        this.logger.error(`Path appConfigDir error: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to get app config directory: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('path:appDataDir', async () => {
      try {
        return app.getPath('appData');
      } catch (error: any) {
        this.logger.error(`Path appDataDir error: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to get app data directory: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('path:appLocalDataDir', async () => {
      try {
        return app.getPath('userData');
      } catch (error: any) {
        this.logger.error(`Path appLocalDataDir error: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to get app local data directory: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('path:appCacheDir', async () => {
      try {
        return app.getPath('temp');
      } catch (error: any) {
        this.logger.error(`Path appCacheDir error: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to get app cache directory: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('path:resolve', async (_, ...paths: string[]) => {
      try {
        return resolve(...paths);
      } catch (error: any) {
        this.logger.error(`Path resolve error: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to resolve path: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('path:join', async (_, ...paths: string[]) => {
      try {
        return join(...paths);
      } catch (error: any) {
        this.logger.error(`Path join error: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to join paths: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('path:resolveResource', async (_, resourcePath: string) => {
      try {
        if (this.isDevelopment) {
          return join(process.cwd(), 'src', 'assets', resourcePath);
        }
        return join(__dirname, '../dist/browser/assets', resourcePath);
      } catch (error: any) {
        this.logger.error(`Path resolveResource error: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to resolve resource path: ${error instanceof Error ? error.message : error}`);
      }
    });
  }
}

export function createPathModule(isDevelopment = false) {
  return new PathModule(isDevelopment);
}
