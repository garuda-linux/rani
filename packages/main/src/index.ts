import type { AppInitConfig } from './AppInitConfig.js';
import { createModuleRunner } from './ModuleRunner.js';
import { disallowMultipleAppInstance } from './modules/SingleInstanceApp.js';
import { createWindowManagerModule } from './modules/WindowManager.js';
import { terminateAppOnLastWindowClose } from './modules/ApplicationTerminatorOnLastWindowClose.js';
import { autoUpdater } from './modules/AutoUpdater.js';
import { allowInternalOrigins } from './modules/BlockNotAllowdOrigins.js';
import { allowExternalUrls } from './modules/ExternalUrls.js';
import { createFileSystemModule } from './modules/FileSystemModule.js';
import { createShellModule } from './modules/ShellModule.js';
import { createStoreModule } from './modules/StoreModule.js';
import { createPathModule } from './modules/PathModule.js';
import { createOSModule } from './modules/OSModule.js';
import { createNotificationModule } from './modules/NotificationModule.js';
import { createWindowControlModule } from './modules/WindowControlModule.js';
import { createLoggingModule } from './modules/LoggingModule.js';
import { createDialogModule } from './modules/DialogModule.js';
import { createClipboardModule } from './modules/ClipboardModule.js';
import { createEnhancedSecurityModule } from './modules/EnhancedSecurityModule.js';

export async function initApp(initConfig: AppInitConfig) {
  const isDevelopment = import.meta.env.DEV;

  const moduleRunner = createModuleRunner()
    // Core modules
    .init(
      createWindowManagerModule({
        initConfig,
        openDevTools: isDevelopment,
        isDevelopment,
      }),
    )
    .init(disallowMultipleAppInstance())
    .init(terminateAppOnLastWindowClose())
    .init(autoUpdater())

    // Enhanced security
    .init(createEnhancedSecurityModule(isDevelopment))

    // Original security modules
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
        new Set(initConfig.renderer instanceof URL ? ['garudalinux.org'] : []),
      ),
    )

    // IPC API modules
    .init(createFileSystemModule())
    .init(createShellModule(isDevelopment))
    .init(createStoreModule())
    .init(createPathModule(isDevelopment))
    .init(createOSModule())
    .init(createNotificationModule())
    .init(createWindowControlModule())
    .init(createLoggingModule())
    .init(createDialogModule())
    .init(createClipboardModule());

  // Install DevTools extension if needed
  // .init(chromeDevToolsExtension({extension: 'VUEJS3_DEVTOOLS'}))

  await moduleRunner;
}
