import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import { BrowserWindow, ipcMain } from 'electron';
import { Logger } from '../logging/logging.js';
import * as pty from 'node-pty';

class PtyModule implements AppModule {
  private readonly logger = Logger.getInstance();

  private ptyProcess: null | pty.IPty = null;

  enable({ app }: ModuleContext): void {
    this.setupPtyProcess(app);
  }

  private setupPtyProcess(_app: Electron.App): void {
    const getMainWindow = (): BrowserWindow | null => {
      const windows = BrowserWindow.getAllWindows();
      return windows.length > 0 ? windows[0] : null;
    };

    this.ptyProcess = pty.spawn('bash', [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.env.HOME,
      env: process.env,
    });

    this.ptyProcess.onData((data: string) => {
      const win: BrowserWindow | null = getMainWindow();
      if (!win || win.isDestroyed()) {
        throw new Error('No active window to send terminal data to');
      }
      win.webContents.send('pty:incomingData', data);
    });

    ipcMain.handle('pty:keystroke', (_, key) => {
      this.ptyProcess?.write(key);
    });

    ipcMain.handle('pty:resize', (_, cols: number, rows: number) => {
      this.ptyProcess?.resize(cols, rows);
    });
  }
}

export function createPtyModule() {
  return new PtyModule();
}
