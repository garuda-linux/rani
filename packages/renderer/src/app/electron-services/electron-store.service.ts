import { Injectable } from '@angular/core';
import { Logger } from '../logging/logging';

export interface StoreOptions {
  key?: string;
}

export class Store {
  private logger = Logger.getInstance();

  constructor(private options: StoreOptions = {}) {}

  async get<T = unknown>(key: string): Promise<T | undefined> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return (await window.electronAPI.store.get(key)) as T | undefined;
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    await window.electronAPI.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    await window.electronAPI.store.delete(key);
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
    return await window.electronAPI.store.has(key);
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
