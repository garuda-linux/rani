import { Injectable } from '@angular/core';
import { ThemeHandler } from './theme-handler/theme-handler';
import {
  isPermissionGranted,
  type Options,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { Logger } from './logging/logging';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  readonly themeHandler = new ThemeHandler();
  private readonly logger = Logger.getInstance();

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
