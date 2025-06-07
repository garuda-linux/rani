import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import { ipcMain } from "electron";
import logger from "electron-timber";
import ElectronStore from "electron-store";
import { Logger } from "../logging/logging.js";

enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

class LoggingModule implements AppModule {
  private readonly logger = Logger.getInstance();
  private readonly rendererLogger = logger.create({
    name: "renderer",
    logLevel: "info",
  });
  private readonly store: ElectronStore;

  constructor() {
    this.store = new ElectronStore({
      encryptionKey: "non-security-by-obscurity",
    });
  }

  enable(_moduleContext: ModuleContext): void {
    this.setupLoggingHandlers();
  }

  private updateLogLevel(): void {
    Logger.logLevel = this.store.get("logLevel", LogLevel.INFO) as LogLevel;
    this.logger.info(`Log level initialized to: ${LogLevel[Logger.logLevel]}`);
  }

  private setupLoggingHandlers(): void {
    this.updateLogLevel();

    ipcMain.on(
      "config:changed",
      (_event: unknown, configData: { key: string; value: unknown }) => {
        try {
          if (configData.key === "logLevel") {
            Logger.logLevel = configData.value as LogLevel;
          }
        } catch (error) {
          this.rendererLogger.error("Config change listener error:", error);
        }
      },
    );

    ipcMain.handle("log:trace", async (_event: unknown, ...args: unknown[]) => {
      try {
        if (Logger.logLevel <= LogLevel.TRACE) {
          this.rendererLogger.log("[TRACE]", ...args);
        }
        return true;
      } catch (error) {
        this.rendererLogger.error("Logging trace error:", error);
        return false;
      }
    });

    ipcMain.handle("log:debug", async (_event: unknown, ...args: unknown[]) => {
      try {
        if (Logger.logLevel <= LogLevel.DEBUG) {
          this.rendererLogger.log("[DEBUG]", ...args);
        }
        return true;
      } catch (error) {
        this.rendererLogger.error("Logging debug error:", error);
        return false;
      }
    });

    ipcMain.handle("log:info", async (_event: unknown, ...args: unknown[]) => {
      try {
        if (Logger.logLevel <= LogLevel.INFO) {
          this.rendererLogger.log("[INFO]", ...args);
        }
        return true;
      } catch (error) {
        this.rendererLogger.error("Logging info error:", error);
        return false;
      }
    });

    ipcMain.handle("log:warn", async (_event: unknown, ...args: unknown[]) => {
      try {
        if (Logger.logLevel <= LogLevel.WARN) {
          this.rendererLogger.warn("[WARN]", ...args);
        }
        return true;
      } catch (error) {
        this.rendererLogger.error("Logging warn error:", error);
        return false;
      }
    });

    ipcMain.handle("log:error", async (_event: unknown, ...args: unknown[]) => {
      try {
        if (Logger.logLevel <= LogLevel.ERROR) {
          this.rendererLogger.error("[ERROR]", ...args);
        }
        return true;
      } catch (error) {
        this.rendererLogger.error("Logging error error:", error);
        return false;
      }
    });
  }
}

export function createLoggingModule() {
  return new LoggingModule();
}
