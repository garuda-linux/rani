export interface ShellStreamingResult {
  processId: string;
  pid: number;
}

export interface ShellEvent {
  processId: string;
  data?: string;
  code?: number;
  signal?: string;
  error?: Error;
}

// Event channel type definitions
export interface EventChannelMap {
  "shell:stdout": ShellEvent;
  "shell:stderr": ShellEvent;
  "shell:close": ShellEvent;
  "shell:error": ShellEvent;
  "contextMenu:itemClicked": string;
  "appMenu:itemClicked": {
    id?: string;
    routerLink?: string;
    command?: string;
    item: AppMenuItem;
  };
  "window-focus": undefined;
  "window-blur": undefined;
  "window-maximize": undefined;
  "window-unmaximize": undefined;
  "window-minimize": undefined;
  "window-restore": undefined;
  "app-update": unknown;
  "system-theme-changed": unknown;
}

export type EventChannel =
  | "shell:stdout"
  | "shell:stderr"
  | "shell:close"
  | "shell:error"
  | "contextMenu:itemClicked"
  | "appMenu:itemClicked";

export interface ContextMenuItem {
  id?: string;
  label?: string;
  icon?: string;
  enabled?: boolean;
  visible?: boolean;
  type?: "normal" | "separator" | "submenu" | "checkbox" | "radio";
  checked?: boolean;
  accelerator?: string;
  submenu?: ContextMenuItem[];
}

export interface AppMenuItem {
  id?: string;
  label?: string;
  icon?: string;
  enabled?: boolean;
  visible?: boolean;
  type?: "normal" | "separator" | "submenu" | "checkbox" | "radio";
  checked?: boolean;
  accelerator?: string;
  role?: string;
  submenu?: AppMenuItem[];
  routerLink?: string;
  command?: string;
  items?: AppMenuItem[];
}

export interface ElectronAPI {
  fs: {
    exists: (filePath: string) => Promise<boolean>;
    readTextFile: (filePath: string) => Promise<string>;
    writeTextFile: (filePath: string, contents: string) => Promise<boolean>;
    createDirectory: (dirPath: string) => Promise<boolean>;
    removeFile: (filePath: string) => Promise<boolean>;
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
    hostname: () => Promise<string>;
    homedir: () => Promise<string>;
    tmpdir: () => Promise<string>;
  };
  notification: {
    isPermissionGranted: () => Promise<boolean>;
    requestPermission: () => Promise<string>;
    send: (options: {
      title: string;
      body?: string;
      icon?: string;
    }) => Promise<boolean>;
    sendWithActions: (options: {
      title: string;
      body?: string;
      icon?: string;
      actions?: { type: string; text: string }[];
    }) => Promise<boolean>;
  };
  window: {
    close: () => Promise<void>;
    requestClose: () => Promise<void>;
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    hide: () => Promise<void>;
    show: () => Promise<void>;
    focus: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    isMinimized: () => Promise<boolean>;
    isVisible: () => Promise<boolean>;
    setTitle: (title: string) => Promise<void>;
    getTitle: () => Promise<string>;
    setSize: (width: number, height: number) => Promise<void>;
    getSize: () => Promise<number[]>;
    setPosition: (x: number, y: number) => Promise<void>;
    getPosition: () => Promise<number[]>;
  };
  log: {
    trace: (...args: any[]) => Promise<void>;
    debug: (...args: any[]) => Promise<void>;
    info: (...args: any[]) => Promise<void>;
    warn: (...args: any[]) => Promise<void>;
    error: (...args: any[]) => Promise<void>;
  };
  dialog: {
    open: (options: Record<string, unknown>) => Promise<unknown>;
    save: (options: Record<string, unknown>) => Promise<unknown>;
    message: (options: Record<string, unknown>) => Promise<unknown>;
    error: (title: string, content: string) => Promise<unknown>;
    certificate: (options: Record<string, unknown>) => Promise<unknown>;
    confirm: (
      message: string,
      title?: string,
      detail?: string,
    ) => Promise<unknown>;
    warning: (
      message: string,
      title?: string,
      detail?: string,
    ) => Promise<unknown>;
    info: (
      message: string,
      title?: string,
      detail?: string,
    ) => Promise<unknown>;
  };
  clipboard: {
    writeText: (text: string) => Promise<boolean>;
    readText: () => Promise<string>;
    clear: () => Promise<boolean>;
    writeHTML: (markup: string, text?: string) => Promise<boolean>;
    readHTML: () => Promise<string>;
    writeRTF: (text: string) => Promise<boolean>;
    readRTF: () => Promise<string>;
    writeImage: (dataURL: string) => Promise<boolean>;
    readImage: () => Promise<string>;
    writeBookmark: (title: string, url: string) => Promise<boolean>;
    readBookmark: () => Promise<{ title: string; url: string }>;
    availableFormats: () => Promise<string[]>;
    has: (format: string) => Promise<boolean>;
    read: (format: string) => Promise<string>;
    isEmpty: () => Promise<boolean>;
    hasText: () => Promise<boolean>;
    hasImage: () => Promise<boolean>;
  };
  events: {
    on: <T extends EventChannel>(
      channel: T,
      listener: (event: EventChannelMap[T]) => void,
    ) => void;
    off: <T extends EventChannel>(
      channel: T,
      listener: (event: EventChannelMap[T]) => void,
    ) => void;
    once: <T extends EventChannel>(
      channel: T,
      listener: (event: EventChannelMap[T]) => void,
    ) => void;
  };
  contextMenu: {
    show: (
      items: ContextMenuItem[],
      x?: number,
      y?: number,
    ) => Promise<boolean>;
  };
  appMenu: {
    update: (items: AppMenuItem[]) => Promise<boolean>;
    getItems: () => Promise<AppMenuItem[]>;
  };
  shell: {
    open: (url: string) => Promise<boolean>;
    spawnStreaming: (
      command: string,
      args?: string[],
      cwd?: Record<string, unknown>,
      env?: Record<string, string>,
    ) => Promise<ShellStreamingResult>;
    writeStdin: (processId: string, data: string) => Promise<void>;
    killProcess: (processId: string, signal?: string) => Promise<void>;
    execute: (
      command: string,
      args?: string[],
      options?: Record<string, unknown>,
    ) => Promise<{
      stdout: string;
      stderr: string;
      code: number | null;
      signal: string | null;
    }>;
    on: (channel: string, listener: (...args: unknown[]) => void) => void;
    off: (channel: string, listener: (...args: unknown[]) => void) => void;
  };
  app: {
    relaunch: () => Promise<void>;
    exit: (exitCode?: number) => Promise<void>;
    quit: () => Promise<void>;
    getVersion: () => Promise<string>;
    getName: () => Promise<string>;
    isReady: () => Promise<boolean>;
  };
  config: {
    notifyChange: (key: string, value: unknown) => Promise<boolean>;
  };
}

export interface ElectronVersions {
  node: () => string;
  chrome: () => string;
  electron: () => string;
}

export interface ElectronProcess {
  platform: string;
  arch: string;
  version: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    electronVersions: ElectronVersions;
    electronProcess: ElectronProcess;
  }
}
