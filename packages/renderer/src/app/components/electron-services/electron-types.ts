export interface ElectronAPI {
  fs: {
    exists: (filePath: string) => Promise<boolean>;
    readTextFile: (filePath: string) => Promise<string>;
    writeTextFile: (filePath: string, contents: string) => Promise<boolean>;
    createDirectory: (dirPath: string) => Promise<boolean>;
    removeFile: (filePath: string) => Promise<boolean>;
  };
  shell: {
    open: (url: string) => Promise<boolean>;
    execute: (
      command: string,
      args?: string[],
      options?: Record<string, unknown>,
    ) => Promise<unknown>;
  };
  store: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
    clear: () => Promise<boolean>;
    has: (key: string) => Promise<boolean>;
  };
  path: {
    appConfigDir: () => Promise<string>;
    appDataDir: () => Promise<string>;
    appLocalDataDir: () => Promise<string>;
    appCacheDir: () => Promise<string>;
    resolve: (...paths: string[]) => Promise<string>;
    join: (...paths: string[]) => Promise<string>;
    resolveResource: (resourcePath: string) => Promise<string>;
  };
  os: {
    platform: () => Promise<string>;
    arch: () => Promise<string>;
    version: () => Promise<string>;
    locale: () => Promise<string>;
  };
  notification: {
    isPermissionGranted: () => Promise<boolean>;
    requestPermission: () => Promise<string>;
    send: (options: {
      title: string;
      body?: string;
      icon?: string;
    }) => Promise<boolean>;
  };
  window: {
    close: () => Promise<void>;
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    hide: () => Promise<void>;
    show: () => Promise<void>;
  };
  log: {
    trace: (message: string) => Promise<void>;
    debug: (message: string) => Promise<void>;
    info: (message: string) => Promise<void>;
    warn: (message: string) => Promise<void>;
    error: (message: string) => Promise<void>;
  };
  dialog: {
    open: (options: Record<string, unknown>) => Promise<unknown>;
    save: (options: Record<string, unknown>) => Promise<unknown>;
    message: (options: Record<string, unknown>) => Promise<unknown>;
  };
  clipboard: {
    writeText: (text: string) => Promise<boolean>;
    readText: () => Promise<string>;
    clear: () => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
