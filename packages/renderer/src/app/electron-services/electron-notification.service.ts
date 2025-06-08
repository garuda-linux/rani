import { Injectable } from '@angular/core';

export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ElectronNotificationService {
  async isPermissionGranted(): Promise<boolean> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.notification.isPermissionGranted();
  }

  async requestPermission(): Promise<string> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.notification.requestPermission();
  }

  async sendNotification(options: NotificationOptions): Promise<boolean> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.notification.send(options);
  }
}

// Static functions for compatibility with Tauri API
export async function isPermissionGranted(): Promise<boolean> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  return await window.electronAPI.notification.isPermissionGranted();
}

export async function requestPermission(): Promise<string> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  return await window.electronAPI.notification.requestPermission();
}

export async function sendNotification(options: NotificationOptions): Promise<boolean> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  return await window.electronAPI.notification.send(options);
}
