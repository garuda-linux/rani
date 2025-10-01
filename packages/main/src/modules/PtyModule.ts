import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import { BrowserWindow, ipcMain } from 'electron';
import { Logger } from '../logging/logging.js';
import { spawn, IPty } from 'node-pty';

interface ShellProcess {
  processId: string;
  ptyProcess: IPty;
  pid: number;
}

class PtyModule implements AppModule {
  private readonly logger = Logger.getInstance();
  private activeProcesses = new Map<string, ShellProcess>();

  enable({ app }: ModuleContext): void {
    this.setupShellHandlers(app);
  }

  private setupShellHandlers(_app: Electron.App): void {
    const getMainWindow = (): BrowserWindow | null => {
      const windows = BrowserWindow.getAllWindows();
      return windows.length > 0 ? windows[0] : null;
    };

    // Handle shell spawn streaming
    ipcMain.handle(
      'shell:spawnStreaming',
      async (_, command: string, args: string[] = [], processId: string, options?: Record<string, unknown>) => {
        try {
          const cols = (options?.cols as number) ?? 80;
          const rows = (options?.rows as number) ?? 24;
          const cwd = (options?.cwd as string) ?? process.cwd();
          const env = {
            ...process.env,
            ...((options?.env as Record<string, string>) ?? {}),
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor',
            FORCE_COLOR: '1',
            CLICOLOR: '1',
            CLICOLOR_FORCE: '1',
          };

          this.logger.trace(`Spawning shell process: ${command} ${args.join(' ')}`);

          const ptyProcess = spawn(command, args, {
            name: 'xterm-256color',
            cols,
            rows,
            cwd,
            env,
            encoding: 'utf8',
          });

          const shellProcess: ShellProcess = {
            processId,
            ptyProcess,
            pid: ptyProcess.pid || 0,
          };

          this.activeProcesses.set(processId, shellProcess);

          // Handle data output
          ptyProcess.onData((data: string) => {
            this.logger.debug(
              `PTY data received for process ${processId}: ${data.length} bytes - "${data.substring(0, 100)}..."`,
            );
            const win = getMainWindow();
            if (win && !win.isDestroyed()) {
              this.logger.debug(`Sending shell:stdout event for process ${processId}`);
              win.webContents.send('shell:stdout', { processId, data });
            } else {
              this.logger.warn(`No window available to send data for process ${processId}`);
            }
          });

          // Handle error events
          ptyProcess.on('error', (error: any) => {
            this.logger.error(`PTY process ${processId} error: ${error.message || error}`);
            const win = getMainWindow();
            if (win && !win.isDestroyed()) {
              win.webContents.send('shell:error', {
                processId,
                error: {
                  name: error.name || 'PTYError',
                  message: error.message || String(error),
                  stack: error.stack || undefined,
                },
              });
            }
          });

          // Handle process exit
          ptyProcess.onExit((event: { exitCode: number | null; signal?: number | string | null }) => {
            this.logger.error(
              `PTY process ${processId} exited unexpectedly with code ${event.exitCode}, signal: ${event.signal}`,
            );
            const win = getMainWindow();
            if (win && !win.isDestroyed()) {
              win.webContents.send('shell:close', {
                processId,
                code: event.exitCode,
                signal: event.signal ?? null,
              });
            }
            this.activeProcesses.delete(processId);
          });

          return {
            processId,
            pid: shellProcess.pid,
          };
        } catch (error: unknown) {
          this.logger.error(`Shell spawn error: ${error instanceof Error ? error.message : String(error)}`);
          throw new Error(`Failed to spawn shell process: ${error instanceof Error ? error.message : error}`);
        }
      },
    );

    // Handle writing to stdin
    ipcMain.handle('shell:writeStdin', async (_, processId: string, data: string) => {
      try {
        const shellProcess = this.activeProcesses.get(processId);
        if (!shellProcess) {
          return false;
        }

        this.logger.debug(`Writing to PTY process ${processId}: ${data.length} bytes - "${data.substring(0, 100)}..."`);
        shellProcess.ptyProcess.write(data);

        // Force flush any pending output
        if (
          typeof shellProcess.ptyProcess.pause === 'function' &&
          typeof shellProcess.ptyProcess.resume === 'function'
        ) {
          shellProcess.ptyProcess.pause();
          shellProcess.ptyProcess.resume();
        }

        return true;
      } catch (error: unknown) {
        this.logger.error(`Shell write stdin error: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    });

    // Handle killing processes
    ipcMain.handle('shell:killProcess', async (_, processId: string, signal = 'SIGTERM') => {
      try {
        const shellProcess = this.activeProcesses.get(processId);
        if (!shellProcess) {
          return false;
        }

        if (typeof shellProcess.ptyProcess.kill === 'function') {
          shellProcess.ptyProcess.kill(signal);
          this.activeProcesses.delete(processId);
          this.logger.trace(`Killed shell process ${processId} with signal ${signal}`);
          return true;
        }

        return false;
      } catch (error: unknown) {
        this.logger.error(`Shell kill process error: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    });

    // Handle resizing PTY
    ipcMain.handle('shell:resize', async (_, processId: string, cols: number, rows: number) => {
      try {
        const shellProcess = this.activeProcesses.get(processId);
        if (!shellProcess) {
          return false;
        }

        shellProcess.ptyProcess.resize(cols, rows);
        return true;
      } catch (error: unknown) {
        this.logger.error(`Shell resize error: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    });

    // Legacy PTY handlers for backward compatibility
    ipcMain.handle('pty:keystroke', (_, key) => {
      const firstProcess = Array.from(this.activeProcesses.values())[0];
      if (firstProcess) {
        firstProcess.ptyProcess.write(key);
      }
    });

    ipcMain.handle('pty:resize', (_, cols: number, rows: number) => {
      const firstProcess = Array.from(this.activeProcesses.values())[0];
      if (firstProcess) {
        firstProcess.ptyProcess.resize(cols, rows);
      }
    });
  }

  disable(): void {
    // Clean up all active processes
    for (const [processId, shellProcess] of this.activeProcesses) {
      try {
        if (typeof shellProcess.ptyProcess.kill === 'function') {
          shellProcess.ptyProcess.kill('SIGTERM');
        }
      } catch (error: unknown) {
        this.logger.error(
          `Error killing process ${processId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    this.activeProcesses.clear();

    // Remove IPC handlers
    ipcMain.removeHandler('shell:spawnStreaming');
    ipcMain.removeHandler('shell:writeStdin');
    ipcMain.removeHandler('shell:killProcess');
    ipcMain.removeHandler('shell:resize');
    ipcMain.removeHandler('pty:keystroke');
    ipcMain.removeHandler('pty:resize');
  }
}

export function createPtyModule() {
  return new PtyModule();
}
