import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import { ipcMain } from 'electron';
import ElectronStore from 'electron-store';

class StoreModule implements AppModule {
  private store: ElectronStore;

  constructor() {
    this.store = new ElectronStore({
      encryptionKey: 'non-security-by-obscurity',
    });
  }

  enable({ app: _app }: ModuleContext): void {
    this.setupStoreHandlers();
  }

  private setupStoreHandlers(): void {
    ipcMain.handle('store:get', async (_, key: string) => {
      try {
        const result = this.store.get(key);
        console.log(`Store get: ${key} =`, result);
        return result;
      } catch (error) {
        console.error('Store get error:', error);
        throw new Error(`Failed to get store value: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('store:set', async (_, key: string, value: unknown) => {
      try {
        this.store.set(key, value);
        return true;
      } catch (error) {
        console.error('Store set error:', error);
        throw new Error(`Failed to set store value: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('store:delete', async (_, key: string) => {
      try {
        this.store.delete(key);
        return true;
      } catch (error) {
        console.error('Store delete error:', error);
        throw new Error(`Failed to delete store value: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('store:clear', async () => {
      try {
        this.store.clear();
        return true;
      } catch (error) {
        console.error('Store clear error:', error);
        throw new Error(`Failed to clear store: ${error instanceof Error ? error.message : error}`);
      }
    });

    ipcMain.handle('store:has', async (_, key: string) => {
      try {
        return this.store.has(key);
      } catch (error) {
        console.error('Store has error:', error);
        throw new Error(`Failed to check store key: ${error instanceof Error ? error.message : error}`);
      }
    });
  }
}

export function createStoreModule() {
  return new StoreModule();
}
