import type { AppModule } from "../AppModule.js";
import type { ModuleContext } from "../ModuleContext.js";
import { ipcMain } from "electron";
import { Logger } from "../logging/logging.js";

class ConfigModule implements AppModule {
  private readonly logger = Logger.getInstance();

  enable(_moduleContext: ModuleContext): void {
    this.setupConfigHandlers();
  }

  private setupConfigHandlers(): void {
    ipcMain.handle(
      "config:notify-change",
      async (_event: unknown, key: string, value: unknown) => {
        try {
          this.logger.info(`Configuration change received: ${key} = ${value}`);

          // Emit event to other modules that might be interested in config changes
          ipcMain.emit("config:changed", null, { key, value });

          return true;
        } catch (error) {
          this.logger.error(
            `Config notification error: ${error instanceof Error ? error.message : String(error)}`,
          );
          return false;
        }
      },
    );
  }
}

export function createConfigModule() {
  return new ConfigModule();
}
