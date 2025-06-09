import { error, warn } from './logging.js';

export function isPermissionGranted(): boolean {
  try {
    return Notification.permission === 'granted';
  } catch (err) {
    error(`Notification permission check error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function requestPermission(): Promise<boolean> {
  try {
    if (!('Notification' in window)) {
      warn('Notifications not supported in this environment');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    error(`Notification permission request error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function send(options: { title: string; body?: string; icon?: string }): boolean {
  try {
    if (!isPermissionGranted()) {
      warn('Notification permission not granted');
      return false;
    }

    if (!options.title) {
      error('Notification title is required');
      return false;
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return true;
  } catch (err) {
    error(`Notification send error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function sendWithActions(options: {
  title: string;
  body?: string;
  icon?: string;
  actions?: { type: string; text: string }[];
}): boolean {
  try {
    if (!isPermissionGranted()) {
      warn('Notification permission not granted');
      return false;
    }

    if (!options.title) {
      error('Notification title is required');
      return false;
    }

    // Note: Web Notifications API doesn't support custom actions in the same way
    // as native notifications, so we'll send a regular notification
    // In a real implementation, you might want to use Electron's native notifications
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon,
    });

    // If actions are provided, log them (since web notifications don't support actions)
    if (options.actions && options.actions.length > 0) {
      warn('Custom actions not fully supported in web notifications');
    }

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return true;
  } catch (err) {
    error(`Notification sendWithActions error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
