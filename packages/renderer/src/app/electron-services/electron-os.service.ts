import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ElectronOsService {
  async platform(): Promise<string> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.os.platform();
  }

  async arch(): Promise<string> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.os.arch();
  }

  async version(): Promise<string> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.os.version();
  }

  async locale(): Promise<string> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.os.locale();
  }
}

// Static functions for compatibility with Tauri API
export async function platform(): Promise<string> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  return await window.electronAPI.os.platform();
}

export async function arch(): Promise<string> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  return await window.electronAPI.os.arch();
}

export async function version(): Promise<string> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  return await window.electronAPI.os.version();
}

export async function locale(): Promise<string> {
  if (!window.electronAPI) {
    throw new Error('Electron API not available');
  }
  return await window.electronAPI.os.locale();
}
