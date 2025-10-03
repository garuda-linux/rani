import type { AppInitConfig } from './AppInitConfig.js';
import { createModuleRunner } from './ModuleRunner.js';
import { disallowMultipleAppInstance } from './modules/SingleInstanceApp.js';
import { createWindowManagerModule } from './modules/WindowManager.js';
import { allowInternalOrigins } from './modules/BlockNotAllowdOrigins.js';
import { allowExternalUrls } from './modules/ExternalUrls.js';
import { createConfigModule } from './modules/ConfigModule.js';
import { createOSModule } from './modules/OSModule.js';
import { createNotificationModule } from './modules/NotificationModule.js';
import { createWindowControlModule } from './modules/WindowControlModule.js';
import { createLoggingModule } from './modules/LoggingModule.js';
import { createDialogModule } from './modules/DialogModule.js';
import { createClipboardModule } from './modules/ClipboardModule.js';
import { createContextMenuModule } from './modules/ContextMenuModule.js';
import { createAppMenuModule } from './modules/AppMenuModule.js';
import { createHttpModule } from './modules/HttpModule.js';
import { createEnhancedSecurityModule } from './modules/EnhancedSecurityModule.js';
import { app } from 'electron';
import { Logger } from './logging/logging.js';

export async function initApp(initConfig: AppInitConfig) {
  const isDevelopment = import.meta.env.DEV;
  const logger = Logger.getInstance();

  // Shut the fuck up, thank you.
  process.env.ELECTRON_NO_ATTACH_CONSOLE = '1';

  try {
    // First priority: Show window immediately with minimal setup
    const moduleRunner = createModuleRunner()
      // Core modules for window creation
      .init(disallowMultipleAppInstance())
      .init(createEnhancedSecurityModule(isDevelopment))

      // Security modules
      .init(allowInternalOrigins(new Set(initConfig.renderer instanceof URL ? [initConfig.renderer.origin] : [])))
      .init(allowExternalUrls(new Set(initConfig.renderer instanceof URL ? ['garudalinux.org'] : [])))

      // Window manager — show window ASAP
      .init(
        createWindowManagerModule({
          initConfig,
          openDevTools: isDevelopment,
          isDevelopment,
        }),
      );

    await moduleRunner;

    const { ipcMain } = await import('electron');
    ipcMain.handle('app:splash-complete', () => {
      logger.debug('Splash completion signal received from renderer');
      return true;
    });

    // Register other IPC handlers in background after window is shown
    await registerBackgroundIPCHandlers(app, logger);
  } catch (error) {
    logger.error(`Failed to initialize app: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function registerBackgroundIPCHandlers(app: Electron.App, logger: Logger) {
  try {
    logger.debug('Registering background IPC handlers...');

    // Create all IPC modules
    const loggingModule = createLoggingModule();
    const configModule = createConfigModule();
    const osModule = createOSModule();
    const notificationModule = createNotificationModule();
    const windowControlModule = createWindowControlModule();
    const dialogModule = createDialogModule();
    const clipboardModule = createClipboardModule();
    const contextMenuModule = createContextMenuModule();
    const appMenuModule = createAppMenuModule();
    const httpModule = createHttpModule();

    // Create module context
    const moduleContext = { app };

    // Enable IPC modules
    loggingModule.enable(moduleContext);
    configModule.enable(moduleContext);
    osModule.enable(moduleContext);
    notificationModule.enable(moduleContext);
    windowControlModule.enable(moduleContext);
    dialogModule.enable(moduleContext);
    clipboardModule.enable(moduleContext);
    contextMenuModule.enable(moduleContext);
    appMenuModule.enable(moduleContext);
    httpModule.enable(moduleContext);

    logger.debug('Background IPC handlers registered successfully');
  } catch (error) {
    logger.error(
      `Failed to register background IPC handlers: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
