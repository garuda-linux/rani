import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import { ipcMain, Notification } from 'electron';

class NotificationModule implements AppModule {
  enable({ app: _app }: ModuleContext): void {
    this.setupNotificationHandlers();
  }

  private setupNotificationHandlers(): void {
    // Notification Operations
    ipcMain.handle('notification:isPermissionGranted', async () => {
      try {
        return true; // Electron doesn't require explicit permission
      } catch (error) {
        console.error('Notification permission check error:', error);
        return false;
      }
    });

    ipcMain.handle('notification:requestPermission', async () => {
      try {
        return 'granted';
      } catch (error) {
        console.error('Notification permission request error:', error);
        return 'denied';
      }
    });

    ipcMain.handle(
      'notification:send',
      async (_, options: { title: string; body?: string; icon?: string }) => {
        try {
          if (!Notification.isSupported()) {
            console.warn('Notifications are not supported on this system');
            return false;
          }

          if (!options.title) {
            throw new Error('Notification title is required');
          }

          const notification = new Notification({
            title: options.title,
            body: options.body,
            icon: options.icon,
            silent: false,
          });

          notification.show();

          // Handle notification events
          notification.on('click', () => {
            console.log('Notification clicked');
          });

          notification.on('close', () => {
            console.log('Notification closed');
          });

          notification.on('failed', (error) => {
            console.error('Notification failed:', error);
          });

          return true;
        } catch (error) {
          console.error('Notification send error:', error);
          throw new Error(
            `Failed to send notification: ${error instanceof Error ? error.message : error}`,
          );
        }
      },
    );

    ipcMain.handle(
      'notification:sendWithActions',
      async (
        _,
        options: {
          title: string;
          body?: string;
          icon?: string;
          actions?: Array<{ type: string; text: string }>;
        },
      ) => {
        try {
          if (!Notification.isSupported()) {
            console.warn('Notifications are not supported on this system');
            return false;
          }

          if (!options.title) {
            throw new Error('Notification title is required');
          }

          const notification = new Notification({
            title: options.title,
            body: options.body,
            icon: options.icon,
            silent: false,
          });

          notification.show();

          // Return a promise that resolves when the notification is interacted with
          return new Promise((resolve) => {
            notification.on('click', () => {
              resolve({ action: 'click' });
            });

            notification.on('action', (event, index) => {
              resolve({ action: 'action', index });
            });

            notification.on('close', () => {
              resolve({ action: 'close' });
            });

            notification.on('failed', (error) => {
              console.error('Notification failed:', error);
              resolve({ action: 'failed', error: 'Notification failed' });
            });
          });
        } catch (error) {
          console.error('Notification with actions send error:', error);
          throw new Error(
            `Failed to send notification with actions: ${error instanceof Error ? error.message : error}`,
          );
        }
      },
    );
  }
}

export function createNotificationModule() {
  return new NotificationModule();
}
