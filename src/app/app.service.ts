import { Injectable } from '@angular/core';
import {
  isPermissionGranted,
  type Options,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { Logger } from './logging/logging';
import { ThemeHandler } from './theme-handler/theme-handler';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private readonly logger = Logger.getInstance();

  // Not used in this service, but we need to instantiate it nevertheless
  private readonly themeHandler = new ThemeHandler();

  /**
   * Send a notification to the user.
   * @param options The options for the notification.
   */
  async sendNotification(options: Options): Promise<void> {
    let permissionGranted: boolean = await isPermissionGranted();
    if (!permissionGranted) {
      this.logger.info('Requesting notification permission');
      const permission: NotificationPermission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    if (permissionGranted) {
      this.logger.trace(`Sending notification: ${options.title}`);
      sendNotification(options);
    }
  }
}
