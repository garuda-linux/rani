import { ipcRenderer } from 'electron';
import { error, trace } from './logging.js';
import IpcRendererEvent = Electron.IpcRendererEvent;

/**
 * Send a keystroke to the PTY process.
 * @param key The keystroke to send.
 */
export async function sendPtyKeystroke(key: string): Promise<void> {
  try {
    trace(`Sending keystroke to PTY: ${key}`);
    return await ipcRenderer.invoke('pty:keystroke', key);
  } catch (err) {
    error(`Error sending keystroke: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Resize the PTY process.
 * @param cols Number of columns.
 * @param rows Number of rows.
 */
export async function resizePty(cols: number, rows: number): Promise<void> {
  try {
    trace(`Resizing PTY to cols: ${cols}, rows: ${rows}`);
    return await ipcRenderer.invoke('pty:resize', cols, rows);
  } catch (err) {
    error(`Error resizing PTY: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export type PtyDataListener = (data: string) => void;
// oxlint-disable-next-line no-unused-vars
let ptyDataListener: PtyDataListener | null = null;
let ptyIpcListener: ((event: IpcRendererEvent, data: string) => void) | null = null;

/**
 * Set a listener for incoming PTY data.
 * @param listener The listener function to handle incoming data.
 */
export function setPtyDataListener(listener: PtyDataListener): void {
  if (ptyIpcListener) {
    ipcRenderer.removeListener('pty:incomingData', ptyIpcListener);
  }
  ptyDataListener = listener;
  ptyIpcListener = (_event: IpcRendererEvent, data: string) => {
    listener(data);
  };
  ipcRenderer.on('pty:incomingData', ptyIpcListener);
}
