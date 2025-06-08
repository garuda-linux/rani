import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import { ipcMain } from "electron";
import ElectronStore from "electron-store";
import { Logger } from "../logging/logging.js";

enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

interface LogObject {
  scope?: string;
  filename?: string;
  function?: string;
}

class LoggingModule implements AppModule {
  public readonly logger = Logger.child("Renderer");
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
      (_, configData: { key: string; value: unknown }) => {
        try {
          if (configData.key === "logLevel") {
            Logger.logLevel = configData.value as LogLevel;
          }
        } catch (error) {
          this.logger.error(
            `Config change listener error: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );

    ipcMain.handle("log:trace", async (_, msg: string, obj: LogObject) => {
      try {
        this.logger.trace(`${msg} ${JSON.stringify(obj, null, 2)}`);
        return true;
      } catch (error) {
        this.logger.error(
          `Logging trace error: ${error instanceof Error ? error.message : String(error)}`,
        );
        return false;
      }
    });

    ipcMain.handle("log:debug", async (_, msg: string, obj: LogObject) => {
      try {
        this.logger.debug(`${msg} ${JSON.stringify(obj, null, 2)}`);
        return true;
      } catch (error) {
        this.logger.error(
          `Logging debug error: ${error instanceof Error ? error.message : String(error)}`,
        );
        return false;
      }
    });

    ipcMain.handle("log:info", async (_, msg: string, obj: LogObject) => {
      try {
        this.logger.info(`${msg} ${JSON.stringify(obj, null, 2)}`);
        return true;
      } catch (error) {
        this.logger.error(
          `Logging info error: ${error instanceof Error ? error.message : String(error)}`,
        );
        return false;
      }
    });

    ipcMain.handle("log:warn", async (_, msg: string, obj: LogObject) => {
      try {
        this.logger.warn(`${msg} ${JSON.stringify(obj, null, 2)}`);
        return true;
      } catch (error) {
        this.logger.error(
          `Logging warn error: ${error instanceof Error ? error.message : String(error)}`,
        );
        return false;
      }
    });

    ipcMain.handle("log:error", async (_, msg: string, obj: LogObject) => {
      try {
        this.logger.error(`${msg} ${JSON.stringify(obj, null, 2)}`);
        return true;
      } catch (error) {
        this.logger.error(
          `Logging error error: ${error instanceof Error ? error.message : String(error)}`,
        );
        return false;
      }
    });
  }
}

export function createLoggingModule() {
  return new LoggingModule();
}
