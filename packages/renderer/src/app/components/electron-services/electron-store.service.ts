import { Injectable } from '@angular/core';
import { ElectronAPI } from './electron-types';

export interface StoreOptions {
  key?: string;
}

export class Store {
  constructor(private options: StoreOptions = {}) {}

  async get<T = unknown>(key: string): Promise<T | undefined> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const fullKey = this.options.key ? `${this.options.key}.${key}` : key;
    return (await window.electronAPI.store.get(fullKey)) as T | undefined;
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const fullKey = this.options.key ? `${this.options.key}.${key}` : key;
    await window.electronAPI.store.set(fullKey, value);
  }

  async delete(key: string): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const fullKey = this.options.key ? `${this.options.key}.${key}` : key;
    await window.electronAPI.store.delete(fullKey);
  }

  async clear(): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    await window.electronAPI.store.clear();
  }

  async has(key: string): Promise<boolean> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    const fullKey = this.options.key ? `${this.options.key}.${key}` : key;
    return await window.electronAPI.store.has(fullKey);
  }
}

@Injectable({
  providedIn: 'root',
})
export class ElectronStoreService {
  async load(options: StoreOptions = {}): Promise<Store> {
    return new Store(options);
  }

  createStore(options: StoreOptions = {}): Store {
    return new Store(options);
  }
}
