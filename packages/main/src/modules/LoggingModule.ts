import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import { ipcMain } from 'electron';

class LoggingModule implements AppModule {
  enable({ app }: ModuleContext): void {
    this.setupLoggingHandlers();
  }

  private setupLoggingHandlers(): void {
    // Logging Operations
    ipcMain.handle('log:trace', async (_, message: string) => {
      try {
        // console.trace(`[TRACE] ${message}`);
        return true;
      } catch (error) {
        console.error('Logging trace error:', error);
        return false;
      }
    });

    ipcMain.handle('log:debug', async (_, message: string) => {
      try {
        console.debug(`[DEBUG] ${message}`);
        return true;
      } catch (error) {
        console.error('Logging debug error:', error);
        return false;
      }
    });

    ipcMain.handle('log:info', async (_, message: string) => {
      try {
        console.info(`[INFO] ${message}`);
        return true;
      } catch (error) {
        console.error('Logging info error:', error);
        return false;
      }
    });

    ipcMain.handle('log:warn', async (_, message: string) => {
      try {
        console.warn(`[WARN] ${message}`);
        return true;
      } catch (error) {
        console.error('Logging warn error:', error);
        return false;
      }
    });

    ipcMain.handle('log:error', async (_, message: string) => {
      try {
        console.error(`[ERROR] ${message}`);
        return true;
      } catch (error) {
        console.error('Logging error error:', error);
        return false;
      }
    });

    // Enhanced logging with structured data
    ipcMain.handle(
      'log:structured',
      async (_, level: string, message: string, data?: unknown) => {
        try {
          const timestamp = new Date().toISOString();
          const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            data,
          };

          switch (level.toLowerCase()) {
            case 'trace':
              console.trace(`[${timestamp}] [TRACE] ${message}`, data);
              break;
            case 'debug':
              console.debug(`[${timestamp}] [DEBUG] ${message}`, data);
              break;
            case 'info':
              console.info(`[${timestamp}] [INFO] ${message}`, data);
              break;
            case 'warn':
              console.warn(`[${timestamp}] [WARN] ${message}`, data);
              break;
            case 'error':
              console.error(`[${timestamp}] [ERROR] ${message}`, data);
              break;
            default:
              console.log(
                `[${timestamp}] [${level.toUpperCase()}] ${message}`,
                data,
              );
          }

          return true;
        } catch (error) {
          console.error('Structured logging error:', error);
          return false;
        }
      },
    );

    // Log with context (useful for debugging)
    ipcMain.handle(
      'log:withContext',
      async (
        _,
        level: string,
        message: string,
        context: Record<string, unknown>,
      ) => {
        try {
          const timestamp = new Date().toISOString();
          const contextString = Object.entries(context)
            .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
            .join(' ');

          const fullMessage = `[${timestamp}] [${level.toUpperCase()}] ${message} | ${contextString}`;

          switch (level.toLowerCase()) {
            case 'trace':
              console.trace(fullMessage);
              break;
            case 'debug':
              console.debug(fullMessage);
              break;
            case 'info':
              console.info(fullMessage);
              break;
            case 'warn':
              console.warn(fullMessage);
              break;
            case 'error':
              console.error(fullMessage);
              break;
            default:
              console.log(fullMessage);
          }

          return true;
        } catch (error) {
          console.error('Context logging error:', error);
          return false;
        }
      },
    );
  }
}

export function createLoggingModule() {
  return new LoggingModule();
}
