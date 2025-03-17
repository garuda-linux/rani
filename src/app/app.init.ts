import { Logger } from './logging/logging';
import { inject } from '@angular/core';
import { ConfigService } from './config/config.service';
import { LanguageManagerService } from './language-manager/language-manager.service';
import { checkFirstBoot } from './first-boot';
import { currentMonitor, getCurrentWindow, LogicalSize, type Monitor, type Window } from '@tauri-apps/api/window';

export async function initRani() {
  const logger = Logger.getInstance();
  const configService = inject(ConfigService);
  const languageManagerService = inject(LanguageManagerService);
  await configService.init();

  // Window is hidden by default, after checking whether we are not required to autostart the
  // setup assistant, we can show it
  if (await checkFirstBoot()) return;

  await languageManagerService.init();

  // Handle window being too big for certain monitors
  const window: Window = getCurrentWindow();
  const monitor: Monitor = (await currentMonitor())!;

  const monitorSize: LogicalSize = monitor.size.toLogical(monitor.scaleFactor);
  const windowSize: LogicalSize = (await window.innerSize()).toLogical(monitor.scaleFactor);

  logger.trace(`Monitor size: ${monitorSize.width}x${monitorSize.height}`);
  logger.trace(`Window size: ${windowSize.width}x${windowSize.height}`);

  try {
    if (monitorSize.width - 30 < windowSize.width || monitorSize.height - 30 < windowSize.height) {
      const newSize = new LogicalSize(monitorSize.width - 30, monitorSize.width - 30);
      await window.setSize(newSize);

      logger.debug(`Resized window to ${newSize.width}x${newSize.height}`);
    }
  } catch (err: any) {
    logger.error(err);
  }

  await window.show();
}
