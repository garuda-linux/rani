import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ElectronClipboardService {
  async writeText(text: string): Promise<boolean> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.clipboard.writeText(text);
  }

  async readText(): Promise<string> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.clipboard.readText();
  }

  async clear(): Promise<boolean> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }
    return await window.electronAPI.clipboard.clear();
  }
}

// Static functions for compatibility with Tauri clipboard API
export async function writeText(text: string): Promise<boolean> {
  if (!window.electronAPI) {
    throw new Error("Electron API not available");
  }
  return await window.electronAPI.clipboard.writeText(text);
}

export async function readText(): Promise<string> {
  if (!window.electronAPI) {
    throw new Error("Electron API not available");
  }
  return await window.electronAPI.clipboard.readText();
}

export async function clear(): Promise<boolean> {
  if (!window.electronAPI) {
    throw new Error("Electron API not available");
  }
  return await window.electronAPI.clipboard.clear();
}
