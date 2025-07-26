export class Logger {
  private static instance: Logger;

  private constructor() {
    // Private constructor for singleton pattern
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
   * @param message The message to log
   */
  trace(message: string): void {
    console.debug(message);
  }

  /**
   * Log a debug message, if the log level is set at least to debug.
   * @param message The message to log
   */
  debug(message: string): void {
    console.debug(message);
  }

  /**
   * Log an info message, if the log level is set at least to info.
   * @param message The message to log
   */
  info(message: string): void {
    console.info(message);
  }

  /**
   * Log a warning message, if the log level is set at least to warn.
   * @param message The message to log
   */
  warn(message: string): void {
    console.warn(message);
  }

  /**
   * Log an error message.
   * @param message The message to log
   */
  error(message: string): void {
    console.error(message);
  }
}
