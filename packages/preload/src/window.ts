import { error } from './logging.js';
import { ipcRenderer } from 'electron';

export async function close(): Promise<boolean> {
  try {
    await ipcRenderer.invoke('window:close');
    return true;
  } catch (err) {
    error(`Window close error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function requestClose(): boolean {
  try {
    window.close();
    return true;
  } catch (err) {
    error(`Window requestClose error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function minimize(): Promise<boolean> {
  try {
    await ipcRenderer.invoke('window:minimize');
    return true;
  } catch (err) {
    error(`Window minimize error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function maximize(): Promise<boolean> {
  try {
    await ipcRenderer.invoke('window:maximize');
    return true;
  } catch (err) {
    error(`Window maximize error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function hide(): Promise<boolean> {
  try {
    await ipcRenderer.invoke('window:hide');
    return true;
  } catch (err) {
    error(`Window hide error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function show(): Promise<boolean> {
  try {
    await ipcRenderer.invoke('window:show');
    return true;
  } catch (err) {
    error(`Window show error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function focus(): boolean {
  try {
    window.focus();
    return true;
  } catch (err) {
    error(`Window focus error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function isMaximized(): Promise<boolean> {
  try {
    return await ipcRenderer.invoke('window:isMaximized');
  } catch (err) {
    error(`Window isMaximized error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function isMinimized(): Promise<boolean> {
  try {
    return await ipcRenderer.invoke('window:isMinimized');
  } catch (err) {
    error(`Window isMinimized error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function isVisible(): Promise<boolean> {
  try {
    return await ipcRenderer.invoke('window:isVisible');
  } catch (err) {
    error(`Window isVisible error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function setTitle(title: string): boolean {
  try {
    if (!title || typeof title !== 'string') {
      error('Invalid title provided');
      return false;
    }
    document.title = title;
    return true;
  } catch (err) {
    error(`Window setTitle error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function getTitle(): string {
  try {
    return document.title || '';
  } catch (err) {
    error(`Window getTitle error: ${err instanceof Error ? err.message : String(err)}`);
    return '';
  }
}

export function setSize(width: number, height: number): boolean {
  try {
    if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
      error('Invalid size parameters');
      return false;
    }
    window.resizeTo(width, height);
    return true;
  } catch (err) {
    error(`Window setSize error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function getSize(): { width: number; height: number } {
  try {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  } catch (err) {
    error(`Window getSize error: ${err instanceof Error ? err.message : String(err)}`);
    return { width: 0, height: 0 };
  }
}

export function setPosition(x: number, y: number): boolean {
  try {
    if (typeof x !== 'number' || typeof y !== 'number') {
      error('Invalid position parameters');
      return false;
    }
    window.moveTo(x, y);
    return true;
  } catch (err) {
    error(`Window setPosition error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function getPosition(): { x: number; y: number } {
  try {
    return {
      x: window.screenX,
      y: window.screenY,
    };
  } catch (err) {
    error(`Window getPosition error: ${err instanceof Error ? err.message : String(err)}`);
    return { x: 0, y: 0 };
  }
}

export async function relaunch(): Promise<boolean> {
  try {
    await ipcRenderer.invoke('window:relaunch');
    return true;
  } catch (err) {
    error(`Window relaunch error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
