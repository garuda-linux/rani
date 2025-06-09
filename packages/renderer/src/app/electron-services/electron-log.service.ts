import { Injectable } from '@angular/core';
import { logTrace, logDebug, logInfo, logWarn, logError } from './electron-api-utils.js';

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
    logTrace(message);
  }

  async debug(message: string): Promise<void> {
    logDebug(message);
  }

  async info(message: string): Promise<void> {
    logInfo(message);
  }

  async warn(message: string): Promise<void> {
    logWarn(message);
  }

  async error(message: string): Promise<void> {
    logError(message);
  }
}

// Standalone functions for direct use
export async function trace(message: string): Promise<void> {
  logTrace(message);
}

export async function debug(message: string): Promise<void> {
  logDebug(message);
}

export async function info(message: string): Promise<void> {
  logInfo(message);
}

export async function warn(message: string): Promise<void> {
  logWarn(message);
}

export async function error(message: string): Promise<void> {
  logError(message);
}
