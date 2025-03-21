import { Injectable } from '@angular/core';
import {
  isPermissionGranted,
  type Options,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { Logger } from '../logging/logging';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private permissionGranted: boolean = false;
  private readonly logger = Logger.getInstance();

  constructor() {
    void this.init();
  }

  async init(): Promise<void> {
    const permissionGranted: boolean = await isPermissionGranted();
    if (!permissionGranted) {
      this.logger.info('Requesting notification permission');
      const permission: NotificationPermission = await requestPermission();
      this.permissionGranted = permission === 'granted';
    } else {
      this.logger.info('Notification permission already granted');
      this.permissionGranted = true;
    }
  }

  /**
   * Send a notification to the user.
   * @param options The options for the notification.
   */
  async sendNotification(options: Options): Promise<void> {
    if (!this.permissionGranted) {
      this.logger.warn('Notification permission not granted');
      return;
    }

    sendNotification(options);
  }
}
