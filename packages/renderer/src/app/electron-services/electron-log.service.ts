import { Injectable } from '@angular/core';

export enum LogLevel {
  Trace = 1,
  Debug = 2,
  Info = 3,
  Warn = 4,
  Error = 5,
}

interface LogObject {
  scope?: string;
  filename?: string;
  function?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ElectronLogService {
  async trace(message: string, logObj?: LogObject): Promise<void> {
    if (!window.electronAPI) {
      console.trace(message, logObj);
      return;
    }
    await window.electronAPI.log.trace(message, logObj);
  }

  async debug(message: string, logObj?: LogObject): Promise<void> {
    if (!window.electronAPI) {
      console.debug(message, logObj);
      return;
    }
    await window.electronAPI.log.debug(message, logObj);
  }

  async info(message: string, logObj?: LogObject): Promise<void> {
    if (!window.electronAPI) {
      console.info(message, logObj);
      return;
    }
    await window.electronAPI.log.info(message, logObj);
  }

  async warn(message: string, logObj?: LogObject): Promise<void> {
    if (!window.electronAPI) {
      console.warn(message, logObj);
      return;
    }
    await window.electronAPI.log.warn(message, logObj);
  }

  async error(message: string, logObj?: LogObject): Promise<void> {
    if (!window.electronAPI) {
      console.error(message, logObj);
      return;
    }
    await window.electronAPI.log.error(message, logObj);
  }
}

// Static functions for compatibility with Tauri API
export async function trace(message: string, logObj?: LogObject): Promise<void> {
  if (!window.electronAPI) {
    console.trace(message, logObj);
    return;
  }
  await window.electronAPI.log.trace(message, logObj);
}

export async function debug(message: string, logObj?: LogObject): Promise<void> {
  if (!window.electronAPI) {
    console.debug(message, logObj);
    return;
  }
  await window.electronAPI.log.debug(message, logObj);
}

export async function info(message: string, logObj?: LogObject): Promise<void> {
  if (!window.electronAPI) {
    console.info(message, logObj);
    return;
  }
  await window.electronAPI.log.info(message, logObj);
}

export async function warn(message: string, logObj?: LogObject): Promise<void> {
  if (!window.electronAPI) {
    console.warn(message, logObj);
    return;
  }
  await window.electronAPI.log.warn(message, logObj);
}

export async function error(message: string, logObj?: LogObject): Promise<void> {
  if (!window.electronAPI) {
    console.error(message, logObj);
    return;
  }
  await window.electronAPI.log.error(message, logObj);
}
