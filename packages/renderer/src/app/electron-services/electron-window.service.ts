import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ElectronWindowService {
  async close(): Promise<void> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.close();
  }

  async requestClose(): Promise<void> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.requestClose();
  }

  async minimize(): Promise<void> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.minimize();
  }

  async maximize(): Promise<void> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.maximize();
  }

  async hide(): Promise<void> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.hide();
  }

  async show(): Promise<void> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.show();
  }

  async focus(): Promise<void> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.focus();
  }

  async isMaximized(): Promise<boolean> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.isMaximized();
  }

  async isMinimized(): Promise<boolean> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.isMinimized();
  }

  async isVisible(): Promise<boolean> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.isVisible();
  }

  async setTitle(title: string): Promise<void> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.setTitle(title);
  }

  async getTitle(): Promise<string> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.getTitle();
  }

  async setSize(width: number, height: number): Promise<void> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.setSize(width, height);
  }

  async getSize(): Promise<number[]> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.getSize();
  }

  async setPosition(x: number, y: number): Promise<void> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.setPosition(x, y);
  }

  async getPosition(): Promise<number[]> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.window.getPosition();
  }
}
