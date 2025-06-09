import ElectronStore from 'electron-store';
import { error, trace } from './logging.js';

// Initialize the store
const store = new ElectronStore({
  encryptionKey: 'non-security-by-obscurity',
});

export async function get(key: string): Promise<unknown> {
  try {
    const result = store.get(key);
    trace(`Store get: ${key} => ${JSON.stringify(result)}`);
    return result;
  } catch (error: unknown) {
    error(`Store get error: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`Failed to get store value: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function set(key: string, value: unknown): Promise<boolean> {
  try {
    store.set(key, value);
    return true;
  } catch (error: unknown) {
    error(`Store set error: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`Failed to set store value: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function deleteKey(key: string): Promise<boolean> {
  try {
    store.delete(key);
    return true;
  } catch (error: unknown) {
    error(`Store delete error: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`Failed to delete store value: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function clear(): Promise<boolean> {
  try {
    store.clear();
    return true;
  } catch (error: unknown) {
    error(`Store clear error: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`Failed to clear store: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function has(key: string): Promise<boolean> {
  try {
    return store.has(key);
  } catch (error: unknown) {
    error(`Store has error: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`Failed to check store key: ${error instanceof Error ? error.message : String(error)}`);
  }
}
