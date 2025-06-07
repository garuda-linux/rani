import type { AppInitConfig } from "./AppInitConfig.js";
import { createModuleRunner } from "./ModuleRunner.js";
import { disallowMultipleAppInstance } from "./modules/SingleInstanceApp.js";
import { createWindowManagerModule } from "./modules/WindowManager.js";
import { terminateAppOnLastWindowClose } from "./modules/ApplicationTerminatorOnLastWindowClose.js";
import { allowInternalOrigins } from "./modules/BlockNotAllowdOrigins.js";
import { allowExternalUrls } from "./modules/ExternalUrls.js";
import { createFileSystemModule } from "./modules/FileSystemModule.js";
import { createShellModule } from "./modules/ShellModule.js";
import { createStoreModule } from "./modules/StoreModule.js";
import { createPathModule } from "./modules/PathModule.js";
import { createOSModule } from "./modules/OSModule.js";
import { createNotificationModule } from "./modules/NotificationModule.js";
import { createWindowControlModule } from "./modules/WindowControlModule.js";
import { createLoggingModule } from "./modules/LoggingModule.js";
import { createDialogModule } from "./modules/DialogModule.js";
import { createClipboardModule } from "./modules/ClipboardModule.js";
import { createEnhancedSecurityModule } from "./modules/EnhancedSecurityModule.js";
import { app } from "electron";

export async function initApp(initConfig: AppInitConfig) {
  const isDevelopment = import.meta.env.DEV;

  try {
    // Register IPC handlers immediately and synchronously BEFORE any async operations
    const loggingModule = createLoggingModule();
    const fileSystemModule = createFileSystemModule();
    const storeModule = createStoreModule();
    const pathModule = createPathModule(isDevelopment);
    const osModule = createOSModule();
    const notificationModule = createNotificationModule();
    const windowControlModule = createWindowControlModule();
    const dialogModule = createDialogModule();
    const clipboardModule = createClipboardModule();
    const shellModule = createShellModule(isDevelopment);

    // Create module context
    const moduleContext = { app };

    // Enable IPC modules synchronously first
    loggingModule.enable(moduleContext);
    fileSystemModule.enable(moduleContext);
    storeModule.enable(moduleContext);
    pathModule.enable(moduleContext);
    osModule.enable(moduleContext);
    notificationModule.enable(moduleContext);
    windowControlModule.enable(moduleContext);
    dialogModule.enable(moduleContext);
    clipboardModule.enable(moduleContext);
    shellModule.enable(moduleContext);

    console.log("IPC handlers registered successfully");

    // Now run the async module runner for other modules
    const moduleRunner = createModuleRunner()
      // Core modules
      .init(disallowMultipleAppInstance())
      .init(terminateAppOnLastWindowClose())
      .init(createEnhancedSecurityModule(isDevelopment))

      // Security modules
      .init(
        allowInternalOrigins(
          new Set(
            initConfig.renderer instanceof URL
              ? [initConfig.renderer.origin]
              : [],
          ),
        ),
      )
      .init(
        allowExternalUrls(
          new Set(
            initConfig.renderer instanceof URL ? ["garudalinux.org"] : [],
          ),
        ),
      )

      // Window manager — after all IPC handlers are ready
      .init(
        createWindowManagerModule({
          initConfig,
          openDevTools: isDevelopment,
          isDevelopment,
        }),
      );

    await moduleRunner;
  } catch (error) {
    console.error("Failed to initialize app:", error);
    throw error;
  }
}
