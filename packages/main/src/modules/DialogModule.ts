import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import { ipcMain, dialog, BrowserWindow } from 'electron';

class DialogModule implements AppModule {
  enable({ app: _app }: ModuleContext): void {
    this.setupDialogHandlers();
  }

  private setupDialogHandlers(): void {
    // Get the main window instance
    const getMainWindow = (): BrowserWindow | null => {
      const windows = BrowserWindow.getAllWindows();
      return windows.length > 0 ? windows[0] : null;
    };

    // Dialog Operations
    ipcMain.handle(
      'dialog:open',
      async (_, options: Record<string, unknown>) => {
        try {
          const win = getMainWindow();
          const result = win
            ? await dialog.showOpenDialog(
                win,
                options as unknown as Electron.OpenDialogOptions,
              )
            : await dialog.showOpenDialog(
                options as unknown as Electron.OpenDialogOptions,
              );
          return result;
        } catch (error) {
          console.error('Dialog open error:', error);
          throw new Error(
            `Failed to show open dialog: ${error instanceof Error ? error.message : error}`,
          );
        }
      },
    );

    ipcMain.handle(
      'dialog:save',
      async (_, options: Record<string, unknown>) => {
        try {
          const win = getMainWindow();
          const result = win
            ? await dialog.showSaveDialog(
                win,
                options as unknown as Electron.SaveDialogOptions,
              )
            : await dialog.showSaveDialog(
                options as unknown as Electron.SaveDialogOptions,
              );
          return result;
        } catch (error) {
          console.error('Dialog save error:', error);
          throw new Error(
            `Failed to show save dialog: ${error instanceof Error ? error.message : error}`,
          );
        }
      },
    );

    ipcMain.handle(
      'dialog:message',
      async (_, options: Record<string, unknown>) => {
        try {
          const win = getMainWindow();
          const result = win
            ? await dialog.showMessageBox(
                win,
                options as unknown as Electron.MessageBoxOptions,
              )
            : await dialog.showMessageBox(
                options as unknown as Electron.MessageBoxOptions,
              );
          return result;
        } catch (error) {
          console.error('Dialog message error:', error);
          throw new Error(
            `Failed to show message dialog: ${error instanceof Error ? error.message : error}`,
          );
        }
      },
    );

    ipcMain.handle(
      'dialog:error',
      async (_, title: string, content: string) => {
        try {
          dialog.showErrorBox(title, content);
          return true;
        } catch (error) {
          console.error('Dialog error box error:', error);
          throw new Error(
            `Failed to show error dialog: ${error instanceof Error ? error.message : error}`,
          );
        }
      },
    );

    ipcMain.handle(
      'dialog:certificate',
      async (_, options: Record<string, unknown>) => {
        try {
          const win = getMainWindow();
          const result = win
            ? await dialog.showCertificateTrustDialog(
                win,
                options as unknown as Electron.CertificateTrustDialogOptions,
              )
            : await dialog.showCertificateTrustDialog(
                options as unknown as Electron.CertificateTrustDialogOptions,
              );
          return result;
        } catch (error) {
          console.error('Dialog certificate error:', error);
          throw new Error(
            `Failed to show certificate dialog: ${error instanceof Error ? error.message : error}`,
          );
        }
      },
    );

    // Enhanced dialog functions with better defaults
    ipcMain.handle(
      'dialog:confirm',
      async (_, message: string, title = 'Confirm', detail?: string) => {
        try {
          const win = getMainWindow();
          const options = {
            type: 'question' as const,
            buttons: ['Cancel', 'OK'],
            defaultId: 1,
            cancelId: 0,
            title,
            message,
            detail,
          };
          const result = win
            ? await dialog.showMessageBox(win, options)
            : await dialog.showMessageBox(options);
          return result.response === 1; // Returns true if OK was clicked
        } catch (error) {
          console.error('Dialog confirm error:', error);
          throw new Error(
            `Failed to show confirm dialog: ${error instanceof Error ? error.message : error}`,
          );
        }
      },
    );

    ipcMain.handle(
      'dialog:warning',
      async (_, message: string, title = 'Warning', detail?: string) => {
        try {
          const win = getMainWindow();
          const options = {
            type: 'warning' as const,
            buttons: ['OK'],
            defaultId: 0,
            title,
            message,
            detail,
          };
          const result = win
            ? await dialog.showMessageBox(win, options)
            : await dialog.showMessageBox(options);
          return result;
        } catch (error) {
          console.error('Dialog warning error:', error);
          throw new Error(
            `Failed to show warning dialog: ${error instanceof Error ? error.message : error}`,
          );
        }
      },
    );

    ipcMain.handle(
      'dialog:info',
      async (_, message: string, title = 'Information', detail?: string) => {
        try {
          const win = getMainWindow();
          const options = {
            type: 'info' as const,
            buttons: ['OK'],
            defaultId: 0,
            title,
            message,
            detail,
          };
          const result = win
            ? await dialog.showMessageBox(win, options)
            : await dialog.showMessageBox(options);
          return result;
        } catch (error) {
          console.error('Dialog info error:', error);
          throw new Error(
            `Failed to show info dialog: ${error instanceof Error ? error.message : error}`,
          );
        }
      },
    );
  }
}

export function createDialogModule() {
  return new DialogModule();
}
