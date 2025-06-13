import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import { ipcMain } from 'electron';
import { release, homedir, tmpdir, hostname } from 'node:os';
import { Logger } from '../logging/logging.js';

class OSModule implements AppModule {
  private readonly logger = Logger.getInstance();

  enable({ app }: ModuleContext): void {
    this.setupOSHandlers(app);
  }

  private setupOSHandlers(app: Electron.App): void {
    // OS Operations
    ipcMain.handle('os:platform', async () => {
      try {
        return process.platform;
      } catch (error: any) {
        this.logger.error(`OS platform error: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to get platform: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('os:arch', async () => {
      try {
        return process.arch;
      } catch (error: any) {
        this.logger.error(`OS arch error: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to get architecture: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('os:version', async () => {
      try {
        return release();
      } catch (error: any) {
        this.logger.error(`OS version error: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to get OS version: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('os:locale', async () => {
      try {
        return app.getLocale();
      } catch (error: any) {
        this.logger.error(`OS locale error: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to get locale: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('os:hostname', async () => {
      try {
        return hostname();
      } catch (error: any) {
        this.logger.error(`OS hostname error: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to get hostname: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('os:homedir', async () => {
      try {
        return homedir();
      } catch (error: any) {
        this.logger.error(`OS homedir error: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to get home directory: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('os:tmpdir', async () => {
      try {
        return tmpdir();
      } catch (error: any) {
        this.logger.error(`OS tmpdir error: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Failed to get temp directory: ${error instanceof Error ? error.message : error}`);
      }
    });
  }
}

export function createOSModule() {
  return new OSModule();
}
