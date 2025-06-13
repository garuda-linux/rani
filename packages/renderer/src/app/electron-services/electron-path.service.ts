import { Injectable } from '@angular/core';
import {
  appConfigDir as getAppConfigDir,
  appDataDir as getAppDataDir,
  appLocalDataDir as getAppLocalDataDir,
  appCacheDir as getAppCacheDir,
  pathResolve,
  pathJoin,
  resolveResource as getResolveResource,
} from './electron-api-utils.js';

@Injectable({
  providedIn: 'root',
})
export class ElectronPathService {
  async appConfigDir(): Promise<string> {
    return await getAppConfigDir();
  }

  async appDataDir(): Promise<string> {
    return await getAppDataDir();
  }

  async appLocalDataDir(): Promise<string> {
    return await getAppLocalDataDir();
  }

  async appCacheDir(): Promise<string> {
    return await getAppCacheDir();
  }

  async resolve(...paths: string[]): Promise<string> {
    return await pathResolve(...paths);
  }

  async join(...paths: string[]): Promise<string> {
    return await pathJoin(...paths);
  }

  async resolveResource(resourcePath: string): Promise<string> {
    return await getResolveResource(resourcePath);
  }
}

// Static functions for compatibility with Tauri API
export async function appConfigDir(): Promise<string> {
  return await getAppConfigDir();
}

export async function appDataDir(): Promise<string> {
  return await getAppDataDir();
}

export async function appLocalDataDir(): Promise<string> {
  return await getAppLocalDataDir();
}

export async function resolve(...paths: string[]): Promise<string> {
  return await pathResolve(...paths);
}

export async function resolveResource(resourcePath: string): Promise<string> {
  return await getResolveResource(resourcePath);
}

export const path = {
  appConfigDir,
  appDataDir,
  appLocalDataDir,
  resolve,
  resolveResource,
};
