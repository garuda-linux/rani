import { ipcRenderer } from 'electron';

interface Logger {
  trace(message: string): void;
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

// Fallback logger for preload context when IPC fails
const fallbackLogger: Logger = {
  trace: (message: string) => console.log(`${message}`),
  debug: (message: string) => console.log(`${message}`),
  info: (message: string) => console.info(`${message}`),
  warn: (message: string) => console.warn(`${message}`),
  error: (message: string) => console.error(`${message}`),
};

export function trace(msg: string): boolean {
  try {
    // Use IPC to send to main process logger
    ipcRenderer.invoke('log:trace', msg).catch((error) => {
      fallbackLogger.error(
        `Failed to send trace log via IPC: ${error instanceof Error ? error.message : String(error)}`,
      );
      fallbackLogger.trace(msg);
    });
    return true;
  } catch (error) {
    fallbackLogger.error(`Logging trace error: ${error instanceof Error ? error.message : String(error)}`);
    fallbackLogger.trace(msg);
    return false;
  }
}

export function debug(msg: string): boolean {
  try {
    // Use IPC to send to main process logger
    ipcRenderer.invoke('log:debug', msg).catch((error) => {
      fallbackLogger.error(
        `Failed to send debug log via IPC: ${error instanceof Error ? error.message : String(error)}`,
      );
      fallbackLogger.debug(msg);
    });
    return true;
  } catch (error) {
    fallbackLogger.error(`Logging debug error: ${error instanceof Error ? error.message : String(error)}`);
    fallbackLogger.debug(msg);
    return false;
  }
}

export function info(msg: string): boolean {
  try {
    // Use IPC to send to main process logger
    ipcRenderer.invoke('log:info', msg).catch((error) => {
      fallbackLogger.error(
        `Failed to send info log via IPC: ${error instanceof Error ? error.message : String(error)}`,
      );
      fallbackLogger.info(msg);
    });
    return true;
  } catch (error) {
    fallbackLogger.error(`Logging info error: ${error instanceof Error ? error.message : String(error)}`);
    fallbackLogger.info(msg);
    return false;
  }
}

export function warn(msg: string): boolean {
  try {
    // Use IPC to send to main process logger
    ipcRenderer.invoke('log:warn', msg).catch((error) => {
      fallbackLogger.error(
        `Failed to send warn log via IPC: ${error instanceof Error ? error.message : String(error)}`,
      );
      fallbackLogger.warn(msg);
    });
    return true;
  } catch (error) {
    fallbackLogger.error(`Logging warn error: ${error instanceof Error ? error.message : String(error)}`);
    fallbackLogger.warn(msg);
    return false;
  }
}

export function error(msg: string): boolean {
  try {
    // Use IPC to send to main process logger
    ipcRenderer.invoke('log:error', msg).catch((error) => {
      fallbackLogger.error(
        `Failed to send error log via IPC: ${error instanceof Error ? error.message : String(error)}`,
      );
      fallbackLogger.error(msg);
    });
    return true;
  } catch (error) {
    fallbackLogger.error(`Logging error error: ${error instanceof Error ? error.message : String(error)}`);
    fallbackLogger.error(msg);
    return false;
  }
}
