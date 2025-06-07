import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import { ipcMain } from 'electron';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PathModule implements AppModule {
  private isDevelopment: boolean;

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
      } catch (error) {
        console.error('Path appConfigDir error:', error);
        throw new Error(`Failed to get app config directory: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('path:appDataDir', async () => {
      try {
        return app.getPath('appData');
      } catch (error) {
        console.error('Path appDataDir error:', error);
        throw new Error(`Failed to get app data directory: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('path:appLocalDataDir', async () => {
      try {
        return app.getPath('userData');
      } catch (error) {
        console.error('Path appLocalDataDir error:', error);
        throw new Error(`Failed to get app local data directory: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('path:appCacheDir', async () => {
      try {
        return app.getPath('temp');
      } catch (error) {
        console.error('Path appCacheDir error:', error);
        throw new Error(`Failed to get app cache directory: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('path:resolve', async (_, ...paths: string[]) => {
      try {
        return path.resolve(...paths);
      } catch (error) {
        console.error('Path resolve error:', error);
        throw new Error(`Failed to resolve path: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('path:join', async (_, ...paths: string[]) => {
      try {
        return path.join(...paths);
      } catch (error) {
        console.error('Path join error:', error);
        throw new Error(`Failed to join paths: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('path:resolveResource', async (_, resourcePath: string) => {
      try {
        if (this.isDevelopment) {
          return path.join(process.cwd(), 'src', 'assets', resourcePath);
        }
        return path.join(__dirname, '../dist/browser/assets', resourcePath);
      } catch (error) {
        console.error('Path resolveResource error:', error);
        throw new Error(`Failed to resolve resource path: ${error instanceof Error ? error.message : error}`);
      }
    });
  }
}

export function createPathModule(isDevelopment = false) {
  return new PathModule(isDevelopment);
}
