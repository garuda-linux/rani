import { LogLevel } from "./interfaces.js";
import logger from "electron-timber";

export class Logger {
  public static logLevel = LogLevel.TRACE;

  private static instance: Logger;

  private constructor() {
    logger.setDefaults({
      logLevel: "info",
      name: "main",
    });
  }

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
   * @param args The arguments to log.
   */
  trace(...args: any[]): void {
    if (Logger.logLevel <= LogLevel.TRACE) {
      logger.log("[TRACE]", ...args);
    }
  }

  /**
   * Log a debug message, if the log level is set at least to debug.
   * @param args The arguments to log.
   */
  debug(...args: any[]): void {
    if (Logger.logLevel <= LogLevel.DEBUG) {
      logger.log("[DEBUG]", ...args);
    }
  }

  /**
   * Log an info message, if the log level is set at least to info.
   * @param args The arguments to log.
   */
  info(...args: any[]): void {
    if (Logger.logLevel <= LogLevel.INFO) {
      logger.log("[INFO]", ...args);
    }
  }

  /**
   * Log a warning message, if the log level is set at least to warn.
   * @param args The arguments to log.
   */
  warn(...args: any[]): void {
    if (Logger.logLevel <= LogLevel.WARN) {
      logger.warn("[WARN]", ...args);
    }
  }

  /**
   * Log an error message.
   * @param args The arguments to log.
   */
  error(...args: any[]): void {
    if (Logger.logLevel <= LogLevel.ERROR) {
      logger.error("[ERROR]", ...args);
    }
  }
}
