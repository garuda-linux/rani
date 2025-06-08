import { debug, error, info, trace, warn } from '../electron-services';
import { LogObject } from './interfaces';

export class Logger {
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
   * @param message The message to log
   * @param logObj Additional log context
   */
  trace(message: string, logObj?: LogObject | any): void {
    void trace(message, logObj);
  }

  /**
   * Log a debug message, if the log level is set at least to debug.
   * @param message The message to log
   * @param logObj Additional log context
   */
  debug(message: string, logObj?: LogObject | any): void {
    void debug(message, logObj);
  }

  /**
   * Log an info message, if the log level is set at least to info.
   * @param message The message to log
   * @param logObj Additional log context
   */
  info(message: string, logObj?: LogObject | any): void {
    void info(message, logObj);
  }

  /**
   * Log a warning message, if the log level is set at least to warn.
   * @param message The message to log
   * @param logObj Additional log context
   */
  warn(message: string, logObj?: LogObject | any): void {
    void warn(message, logObj);
  }

  /**
   * Log an error message.
   * @param message The message to log
   * @param logObj Additional log context
   */
  error(message: string, logObj?: LogObject | any): void {
    void error(message, logObj);
  }
}
