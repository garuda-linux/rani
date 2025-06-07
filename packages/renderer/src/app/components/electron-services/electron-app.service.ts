import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ElectronAppService {
  async relaunch(): Promise<void> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.app.relaunch();
  }

  async exit(exitCode: number = 0): Promise<void> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.app.exit(exitCode);
  }

  async quit(): Promise<void> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.app.quit();
  }

  async getVersion(): Promise<string> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.app.getVersion();
  }

  async getName(): Promise<string> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.app.getName();
  }

  async isReady(): Promise<boolean> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.app.isReady();
  }
}
