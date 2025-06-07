import { Injectable } from "@angular/core";

export enum LogLevel {
  Trace = 1,
  Debug = 2,
  Info = 3,
  Warn = 4,
  Error = 5,
}

@Injectable({
  providedIn: "root",
})
export class ElectronLogService {
  async trace(...args: any[]): Promise<void> {
    if (!window.electronAPI) {
      console.trace(`[TRACE]`, ...args);
      return;
    }
    await window.electronAPI.log.trace(...args);
  }

  async debug(...args: any[]): Promise<void> {
    if (!window.electronAPI) {
      console.debug(`[DEBUG]`, ...args);
      return;
    }
    await window.electronAPI.log.debug(...args);
  }

  async info(...args: any[]): Promise<void> {
    if (!window.electronAPI) {
      console.info(`[INFO]`, ...args);
      return;
    }
    await window.electronAPI.log.info(...args);
  }

  async warn(...args: any[]): Promise<void> {
    if (!window.electronAPI) {
      console.warn(`[WARN]`, ...args);
      return;
    }
    await window.electronAPI.log.warn(...args);
  }

  async error(...args: any[]): Promise<void> {
    if (!window.electronAPI) {
      console.error(`[ERROR]`, ...args);
      return;
    }
    await window.electronAPI.log.error(...args);
  }
}

// Static functions for compatibility with Tauri API
export async function trace(...args: any[]): Promise<void> {
  if (!window.electronAPI) {
    console.trace(`[TRACE]`, ...args);
    return;
  }
  await window.electronAPI.log.trace(...args);
}

export async function debug(...args: any[]): Promise<void> {
  if (!window.electronAPI) {
    console.debug(`[DEBUG]`, ...args);
    return;
  }
  await window.electronAPI.log.debug(...args);
}

export async function info(...args: any[]): Promise<void> {
  if (!window.electronAPI) {
    console.info(`[INFO]`, ...args);
    return;
  }
  await window.electronAPI.log.info(...args);
}

export async function warn(...args: any[]): Promise<void> {
  if (!window.electronAPI) {
    console.warn(`[WARN]`, ...args);
    return;
  }
  await window.electronAPI.log.warn(...args);
}

export async function error(...args: any[]): Promise<void> {
  if (!window.electronAPI) {
    console.error(`[ERROR]`, ...args);
    return;
  }
  await window.electronAPI.log.error(...args);
}
