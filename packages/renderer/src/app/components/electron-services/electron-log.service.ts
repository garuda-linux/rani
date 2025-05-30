import { Injectable } from '@angular/core';
import { ElectronAPI } from './electron-types';

export enum LogLevel {
  Trace = 1,
  Debug = 2,
  Info = 3,
  Warn = 4,
  Error = 5,
}

@Injectable({
  providedIn: 'root',
})
export class ElectronLogService {
  async trace(message: string): Promise<void> {
    if (!window.electronAPI) {
      console.trace(`[TRACE] ${message}`);
      return;
    }
    await window.electronAPI.log.trace(message);
  }

  async debug(message: string): Promise<void> {
    if (!window.electronAPI) {
      console.debug(`[DEBUG] ${message}`);
      return;
    }
    await window.electronAPI.log.debug(message);
  }

  async info(message: string): Promise<void> {
    if (!window.electronAPI) {
      console.info(`[INFO] ${message}`);
      return;
    }
    await window.electronAPI.log.info(message);
  }

  async warn(message: string): Promise<void> {
    if (!window.electronAPI) {
      console.warn(`[WARN] ${message}`);
      return;
    }
    await window.electronAPI.log.warn(message);
  }

  async error(message: string): Promise<void> {
    if (!window.electronAPI) {
      console.error(`[ERROR] ${message}`);
      return;
    }
    await window.electronAPI.log.error(message);
  }
}

// Static functions for compatibility with Tauri API
export async function trace(message: string): Promise<void> {
  if (!window.electronAPI) {
    console.trace(`[TRACE] ${message}`);
    return;
  }
  await window.electronAPI.log.trace(message);
}

export async function debug(message: string): Promise<void> {
  if (!window.electronAPI) {
    console.debug(`[DEBUG] ${message}`);
    return;
  }
  await window.electronAPI.log.debug(message);
}

export async function info(message: string): Promise<void> {
  if (!window.electronAPI) {
    console.info(`[INFO] ${message}`);
    return;
  }
  await window.electronAPI.log.info(message);
}

export async function warn(message: string): Promise<void> {
  if (!window.electronAPI) {
    console.warn(`[WARN] ${message}`);
    return;
  }
  await window.electronAPI.log.warn(message);
}

export async function error(message: string): Promise<void> {
  if (!window.electronAPI) {
    console.error(`[ERROR] ${message}`);
    return;
  }
  await window.electronAPI.log.error(message);
}
