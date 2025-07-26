import { error, warn, trace } from './logging.js';

// Config storage key prefix
const CONFIG_PREFIX = 'electron-config:';

// In-memory cache for config values
const configCache = new Map<string, unknown>();

// Event listeners for config changes
const changeListeners = new Map<string, Set<(value: unknown) => void>>();

export function notifyChange(key: string, value: unknown): boolean {
  try {
    if (!key || typeof key !== 'string') {
      error('Config key must be a non-empty string');
      return false;
    }

    // Update cache
    configCache.set(key, value);

    // Store in localStorage
    try {
      localStorage.setItem(CONFIG_PREFIX + key, JSON.stringify(value));
    } catch (storageError) {
      warn(
        `Failed to persist config to localStorage: ${storageError instanceof Error ? storageError.message : String(storageError)}`,
      );
    }

    // Notify listeners
    const listeners = changeListeners.get(key);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(value);
        } catch (listenerError) {
          error(
            `Config change listener error: ${listenerError instanceof Error ? listenerError.message : String(listenerError)}`,
          );
        }
      }
    }

    trace(`Config changed: ${key} = ${JSON.stringify(value)}`);
    return true;
  } catch (err) {
    error(`Config notifyChange error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function get(key: string): unknown {
  try {
    if (!key || typeof key !== 'string') {
      error('Config key must be a non-empty string');
      return undefined;
    }

    // Check cache first
    if (configCache.has(key)) {
      return configCache.get(key);
    }

    // Try to load from localStorage
    try {
      const stored = localStorage.getItem(CONFIG_PREFIX + key);
      if (stored !== null) {
        const value = JSON.parse(stored);
        configCache.set(key, value);
        return value;
      }
    } catch (storageError) {
      warn(
        `Failed to load config from localStorage: ${storageError instanceof Error ? storageError.message : String(storageError)}`,
      );
    }

    return undefined;
  } catch (err) {
    error(`Config get error: ${err instanceof Error ? err.message : String(err)}`);
    return undefined;
  }
}

export function set(key: string, value: unknown): boolean {
  try {
    if (!key || typeof key !== 'string') {
      error('Config key must be a non-empty string');
      return false;
    }

    return notifyChange(key, value);
  } catch (err) {
    error(`Config set error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function has(key: string): boolean {
  try {
    if (!key || typeof key !== 'string') {
      error('Config key must be a non-empty string');
      return false;
    }

    // Check cache first
    if (configCache.has(key)) {
      return true;
    }

    // Check localStorage
    try {
      return localStorage.getItem(CONFIG_PREFIX + key) !== null;
    } catch (storageError) {
      warn(
        `Failed to check config in localStorage: ${storageError instanceof Error ? storageError.message : String(storageError)}`,
      );
      return false;
    }
  } catch (err) {
    error(`Config has error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function remove(key: string): boolean {
  try {
    if (!key || typeof key !== 'string') {
      error('Config key must be a non-empty string');
      return false;
    }

    // Remove from cache
    configCache.delete(key);

    // Remove from localStorage
    try {
      localStorage.removeItem(CONFIG_PREFIX + key);
    } catch (storageError) {
      warn(
        `Failed to remove config from localStorage: ${storageError instanceof Error ? storageError.message : String(storageError)}`,
      );
    }

    // Notify listeners with undefined value
    const listeners = changeListeners.get(key);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(undefined);
        } catch (listenerError) {
          error(
            `Config change listener error: ${listenerError instanceof Error ? listenerError.message : String(listenerError)}`,
          );
        }
      }
    }

    trace(`Config removed: ${key}`);
    return true;
  } catch (err) {
    error(`Config remove error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function clear(): boolean {
  try {
    // Get all config keys
    const keysToRemove: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CONFIG_PREFIX)) {
          keysToRemove.push(key.substring(CONFIG_PREFIX.length));
        }
      }
    } catch (storageError) {
      warn(
        `Failed to enumerate localStorage keys: ${storageError instanceof Error ? storageError.message : String(storageError)}`,
      );
    }

    // Add cached keys
    configCache.forEach((_, key) => {
      if (!keysToRemove.includes(key)) {
        keysToRemove.push(key);
      }
    });

    // Remove all config items
    for (const key of keysToRemove) {
      remove(key);
    }

    trace('Config cleared');
    return true;
  } catch (err) {
    error(`Config clear error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export function keys(): string[] {
  try {
    const configKeys = new Set<string>();

    // Add cached keys
    configCache.forEach((_, key) => configKeys.add(key));

    // Add localStorage keys
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CONFIG_PREFIX)) {
          configKeys.add(key.substring(CONFIG_PREFIX.length));
        }
      }
    } catch (storageError) {
      warn(
        `Failed to enumerate localStorage keys: ${storageError instanceof Error ? storageError.message : String(storageError)}`,
      );
    }

    return Array.from(configKeys);
  } catch (err) {
    error(`Config keys error: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

export function addChangeListener(key: string, listener: (value: unknown) => void): () => void {
  try {
    if (!key || typeof key !== 'string') {
      error('Config key must be a non-empty string');
      return () => {
        // No-op unsubscribe function for invalid key
      };
    }

    if (typeof listener !== 'function') {
      error('Listener must be a function');
      return () => {
        // No-op unsubscribe function for invalid listener
      };
    }

    if (!changeListeners.has(key)) {
      changeListeners.set(key, new Set());
    }

    const listeners = changeListeners.get(key);
    if (!listeners) {
      error('Failed to get listeners for key');
      return () => {
        // No-op unsubscribe function for error case
      };
    }
    listeners.add(listener);

    // Return unsubscribe function
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        changeListeners.delete(key);
      }
    };
  } catch (err) {
    error(`Config addChangeListener error: ${err instanceof Error ? err.message : String(err)}`);
    return () => {
      // No-op unsubscribe function for error case
    };
  }
}

export function getAll(): Record<string, unknown> {
  try {
    const allConfig: Record<string, unknown> = {};

    const allKeys = keys();
    for (const key of allKeys) {
      allConfig[key] = get(key);
    }

    return allConfig;
  } catch (err) {
    error(`Config getAll error: ${err instanceof Error ? err.message : String(err)}`);
    return {};
  }
}
