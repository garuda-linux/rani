import { Injectable } from '@angular/core';
import { ElectronAPI } from './electron-types';

@Injectable({
  providedIn: 'root',
})
export class ElectronPathService {
  async appConfigDir(): Promise<string> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.path.appConfigDir();
  }

  async appDataDir(): Promise<string> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.path.appDataDir();
  }

  async appLocalDataDir(): Promise<string> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.path.appLocalDataDir();
  }

  async appCacheDir(): Promise<string> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.path.appCacheDir();
  }

  async resolve(...paths: string[]): Promise<string> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.path.resolve(...paths);
  }

  async join(...paths: string[]): Promise<string> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.path.join(...paths);
  }

  async resolveResource(resourcePath: string): Promise<string> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.path.resolveResource(resourcePath);
  }
}

// Static functions for compatibility with Tauri API
export async function appConfigDir(): Promise<string> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  return await window.electronAPI.path.appConfigDir();
}

export async function appDataDir(): Promise<string> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  return await window.electronAPI.path.appDataDir();
}

export async function appLocalDataDir(): Promise<string> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  return await window.electronAPI.path.appLocalDataDir();
}

export async function resolve(...paths: string[]): Promise<string> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  return await window.electronAPI.path.resolve(...paths);
}

export async function resolveResource(resourcePath: string): Promise<string> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  return await window.electronAPI.path.resolveResource(resourcePath);
}

export const path = {
  appConfigDir,
  appDataDir,
  appLocalDataDir,
  resolve,
  resolveResource,
};
