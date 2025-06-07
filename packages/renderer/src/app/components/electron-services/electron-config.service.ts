import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ElectronConfigService {
  /**
   * Notify the backend about a configuration change
   * @param key The configuration key that changed
   * @param value The new value
   */
  async notifyConfigChange(key: string, value: unknown): Promise<boolean> {
    if (!window.electronAPI) {
      throw new Error("Electron API not available");
    }

    try {
      return await window.electronAPI.config.notifyChange(key, value);
    } catch (error) {
      console.error("Failed to notify config change:", error);
      return false;
    }
  }
}

// Export function for direct use
export async function notifyConfigChange(
  key: string,
  value: unknown,
): Promise<boolean> {
  if (!window.electronAPI) {
    throw new Error("Electron API not available");
  }

  try {
    return await window.electronAPI.config.notifyChange(key, value);
  } catch (error) {
    console.error("Failed to notify config change:", error);
    return false;
  }
}
