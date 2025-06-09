import { ipcRenderer } from 'electron';
import { error } from './logging.js';

interface MenuItem {
  label: string;
  id?: string;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
  accelerator?: string;
  submenu?: MenuItem[];
  click?: () => void;
  role?: string;
}

export async function update(items: unknown[]): Promise<boolean> {
  try {
    if (!Array.isArray(items)) {
      error('Menu items must be an array');
      return false;
    }

    // Convert unknown[] to MenuItem[]
    const menuItems = items as MenuItem[];

    // Validate menu items
    for (const item of menuItems) {
      if (typeof item !== 'object' || item === null) {
        error('Invalid menu item: must be an object');
        return false;
      }

      if (!item.label && item.type !== 'separator') {
        error('Menu item must have a label (except separators)');
        return false;
      }
    }

    // Send to main process via IPC
    return await ipcRenderer.invoke('appMenu:update', menuItems);
  } catch (err) {
    error(`App menu update error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function getItems(): Promise<MenuItem[]> {
  try {
    return await ipcRenderer.invoke('appMenu:getItems');
  } catch (err) {
    error(`App menu getItems error: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

export async function addItem(item: MenuItem, position?: number): Promise<boolean> {
  try {
    if (!item || typeof item !== 'object') {
      error('Invalid menu item provided');
      return false;
    }

    if (!item.label && item.type !== 'separator') {
      error('Menu item must have a label (except separators)');
      return false;
    }

    return await ipcRenderer.invoke('appMenu:addItem', item, position);
  } catch (err) {
    error(`App menu addItem error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function removeItem(id: string): Promise<boolean> {
  try {
    if (!id || typeof id !== 'string') {
      error('Item ID must be a non-empty string');
      return false;
    }

    return await ipcRenderer.invoke('appMenu:removeItem', id);
  } catch (err) {
    error(`App menu removeItem error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function findItem(id: string): Promise<MenuItem | null> {
  try {
    if (!id || typeof id !== 'string') {
      error('Item ID must be a non-empty string');
      return null;
    }

    return await ipcRenderer.invoke('appMenu:findItem', id);
  } catch (err) {
    error(`App menu findItem error: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

export async function updateItem(id: string, updates: Partial<MenuItem>): Promise<boolean> {
  try {
    if (!id || typeof id !== 'string') {
      error('Item ID must be a non-empty string');
      return false;
    }

    if (!updates || typeof updates !== 'object') {
      error('Updates must be an object');
      return false;
    }

    return await ipcRenderer.invoke('appMenu:updateItem', id, updates);
  } catch (err) {
    error(`App menu updateItem error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function clear(): Promise<boolean> {
  try {
    return await ipcRenderer.invoke('appMenu:clear');
  } catch (err) {
    error(`App menu clear error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export async function getItemCount(): Promise<number> {
  try {
    return await ipcRenderer.invoke('appMenu:getItemCount');
  } catch (err) {
    error(`App menu getItemCount error: ${err instanceof Error ? err.message : String(err)}`);
    return 0;
  }
}
