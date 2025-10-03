import { ipcRenderer } from 'electron';

/**
 * Signal to the main process that the splash screen can be hidden
 * and that the app initialization is complete
 */
export async function splashComplete(): Promise<boolean> {
  try {
    await ipcRenderer.invoke('app:splash-complete');
    return true;
  } catch (error) {
    console.error('Failed to signal splash completion:', error);
    return false;
  }
}
