import { LogLevel } from './interfaces.js';
import { pino } from 'pino';

export class Logger {
  public static set logLevel(level: LogLevel) {
    Logger.instance.logger.level = LogLevel[level].toLowerCase();
    Logger.instance.mainLogger.level = LogLevel[level].toLowerCase();
  }
  public static get logLevel(): LogLevel {
    return LogLevel[Logger.instance.logger.level.toUpperCase() as keyof typeof LogLevel];
  }

  public readonly logger = pino({
    transport: {
      targets: [
        {
          target: 'pino-pretty',
          options: {
            colorize: true,
            colorizeObjects: true,
            crlf: false,
            errorLikeObjectKeys: ['err', 'error'],
            levelFirst: true,
            messageKey: 'msg',
            levelKey: 'level',
            messageFormat: '{module} - {msg} ',
            timestampKey: 'time',
            translateTime: true,
            ignore: 'pid,hostname',
            include: 'level,time',
            hideObject: false,
            singleLine: true,
            useOnlyCustomProps: false,
          },
        },
      ],
    },
  });
  private readonly mainLogger = this.logger.child({ module: 'Main' });

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
   * Returns a child logger with the specified scope.
   * @param module The scope of the child logger, typically the module or component name.
   */
  static child(module: string): pino.Logger {
    if (!Logger.instance) {
      Logger.getInstance();
    }
    return this.instance.logger.child({ module });
  }

  /**
   * Log a trace message, if the log level is set to trace.
   * @param message The message to log.
   */
  trace(message: string): void {
    this.mainLogger.trace(message);
  }

  /**
   * Log a debug message, if the log level is set at least to debug.
   * @param message The message to log.
   */
  debug(message: string): void {
    this.mainLogger.debug(message);
  }

  /**
   * Log an info message, if the log level is set at least to info.
   * @param message The message to log.
   */
  info(message: string): void {
    this.mainLogger.info(message);
  }

  /**
   * Log a warning message, if the log level is set at least to warn.
   * @param message The message to log.
   */
  warn(message: string): void {
    this.mainLogger.warn(message);
  }

  /**
   * Log an error message.
   * @param message The message to log.
   */
  error(message: string): void {
    this.mainLogger.error(message);
  }

  /**
   * Log an fatal message.
   * @param message The message to log.
   */
  fatal(message: string): void {
    this.mainLogger.fatal(message);
  }
}
