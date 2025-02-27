import { debug, error, info, trace, warn } from '@tauri-apps/plugin-log';
import { LogLevel } from './interfaces';

export class Logger {
  // TODO: set this to info once no longer testing
  public static readonly logLevel = LogLevel.TRACE;

  private static instance: Logger;

  private constructor() {}

  /**
   * Get the singleton instance of the Logger.
   * @returns The Logger instance.
   */
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log a trace message, if the log level is set to trace.
   * @param message The message to log.
   */
  trace(message: string): void {
    if (Logger.logLevel <= LogLevel.TRACE) {
      void trace(message);
    }
  }

  /**
   * Log a debug message, if the log level is set at least to debug.
   * @param message The message to log.
   */
  debug(message: string): void {
    if (Logger.logLevel <= LogLevel.DEBUG) {
      void debug(message);
    }
  }

  /**
   * Log an info message, if the log level is set at least to info.
   * @param message The message to log.
   */
  info(message: string): void {
    if (Logger.logLevel <= LogLevel.INFO) {
      void info(message);
    }
  }

  /**
   * Log a warning message, if the log level is set at least to warn.
   * @param message The message to log.
   */
  warn(message: string): void {
    if (Logger.logLevel <= LogLevel.WARN) {
      void warn(message);
    }
  }

  /**
   * Log an error message.
   * @param message The message to log.
   */
  error(message: string): void {
    if (Logger.logLevel <= LogLevel.ERROR) {
      void error(message);
    }
  }
}
