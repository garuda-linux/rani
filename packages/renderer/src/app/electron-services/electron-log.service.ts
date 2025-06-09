import { Injectable } from '@angular/core';
import { logTrace, logDebug, logInfo, logWarn, logError } from './electron-api-utils.js';

export enum LogLevel {
  Trace = 1,
  Debug = 2,
  Info = 3,
  Warn = 4,
  Error = 5,
}

export interface LogObject {
  scope?: string;
  filename?: string;
  function?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ElectronLogService {
  async trace(message: string, logObj?: LogObject): Promise<void> {
    logTrace(message, logObj);
  }

  async debug(message: string, logObj?: LogObject): Promise<void> {
    logDebug(message, logObj);
  }

  async info(message: string, logObj?: LogObject): Promise<void> {
    logInfo(message, logObj);
  }

  async warn(message: string, logObj?: LogObject): Promise<void> {
    logWarn(message, logObj);
  }

  async error(message: string, logObj?: LogObject): Promise<void> {
    logError(message, logObj);
  }
}

// Standalone functions for direct use
export async function trace(message: string, logObj?: LogObject): Promise<void> {
  logTrace(message, logObj);
}

export async function debug(message: string, logObj?: LogObject): Promise<void> {
  logDebug(message, logObj);
}

export async function info(message: string, logObj?: LogObject): Promise<void> {
  logInfo(message, logObj);
}

export async function warn(message: string, logObj?: LogObject): Promise<void> {
  logWarn(message, logObj);
}

export async function error(message: string, logObj?: LogObject): Promise<void> {
  logError(message, logObj);
}
