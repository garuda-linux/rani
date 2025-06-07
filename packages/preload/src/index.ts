import { sha256sum } from "./node-crypto.js";
import { versions } from "./versions.js";
import {
  shellSpawnStreaming,
  shellWriteStdin,
  shellKillProcess,
} from "./shell.js";
import { contextBridge, ipcRenderer } from "electron";

function send(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // File System Operations
  fs: {
    exists: (filePath: string) => ipcRenderer.invoke("fs:exists", filePath),
    readTextFile: (filePath: string) =>
      ipcRenderer.invoke("fs:readTextFile", filePath),
    writeTextFile: (filePath: string, contents: string) =>
      ipcRenderer.invoke("fs:writeTextFile", filePath, contents),
    createDirectory: (dirPath: string) =>
      ipcRenderer.invoke("fs:createDirectory", dirPath),
    removeFile: (filePath: string) =>
      ipcRenderer.invoke("fs:removeFile", filePath),
  },

  // Shell Operations
  shell: {
    open: (url: string) => ipcRenderer.invoke("shell:open", url),
    spawnStreaming(
      command: string,
      args?: string[],
      options?: Record<string, unknown>,
    ) {
      return shellSpawnStreaming(command, args, options);
    },
    writeStdin: (processId: string, data: string) =>
      shellWriteStdin(processId, data),
    killProcess: (processId: string, signal?: string) =>
      shellKillProcess(processId, signal),
    execute: (
      command: string,
      args?: string[],
      options?: Record<string, unknown>,
    ) => ipcRenderer.invoke("shell:execute", command, args, options),
  },

  // Store Operations
  store: {
    get: (key: string) => ipcRenderer.invoke("store:get", key),
    set: (key: string, value: unknown) =>
      ipcRenderer.invoke("store:set", key, value),
    delete: (key: string) => ipcRenderer.invoke("store:delete", key),
    clear: () => ipcRenderer.invoke("store:clear"),
    has: (key: string) => ipcRenderer.invoke("store:has", key),
  },

  // Path Operations
  path: {
    appConfigDir: () => ipcRenderer.invoke("path:appConfigDir"),
    appDataDir: () => ipcRenderer.invoke("path:appDataDir"),
    appLocalDataDir: () => ipcRenderer.invoke("path:appLocalDataDir"),
    appCacheDir: () => ipcRenderer.invoke("path:appCacheDir"),
    resolve: (...paths: string[]) =>
      ipcRenderer.invoke("path:resolve", ...paths),
    join: (...paths: string[]) => ipcRenderer.invoke("path:join", ...paths),
    resolveResource: (resourcePath: string) =>
      ipcRenderer.invoke("path:resolveResource", resourcePath),
  },

  // OS Operations
  os: {
    platform: () => ipcRenderer.invoke("os:platform"),
    arch: () => ipcRenderer.invoke("os:arch"),
    version: () => ipcRenderer.invoke("os:version"),
    locale: () => ipcRenderer.invoke("os:locale"),
    hostname: () => ipcRenderer.invoke("os:hostname"),
    homedir: () => ipcRenderer.invoke("os:homedir"),
    tmpdir: () => ipcRenderer.invoke("os:tmpdir"),
  },

  // Notification Operations
  notification: {
    isPermissionGranted: () =>
      ipcRenderer.invoke("notification:isPermissionGranted"),
    requestPermission: () =>
      ipcRenderer.invoke("notification:requestPermission"),
    send: (options: { title: string; body?: string; icon?: string }) =>
      ipcRenderer.invoke("notification:send", options),
    sendWithActions: (options: {
      title: string;
      body?: string;
      icon?: string;
      actions?: { type: string; text: string }[];
    }) => ipcRenderer.invoke("notification:sendWithActions", options),
  },

  // Window Operations
  window: {
    close: () => ipcRenderer.invoke("window:close"),
    requestClose: () => ipcRenderer.invoke("window:requestClose"),
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    hide: () => ipcRenderer.invoke("window:hide"),
    show: () => ipcRenderer.invoke("window:show"),
    focus: () => ipcRenderer.invoke("window:focus"),
    isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
    isMinimized: () => ipcRenderer.invoke("window:isMinimized"),
    isVisible: () => ipcRenderer.invoke("window:isVisible"),
    setTitle: (title: string) => ipcRenderer.invoke("window:setTitle", title),
    getTitle: () => ipcRenderer.invoke("window:getTitle"),
    setSize: (width: number, height: number) =>
      ipcRenderer.invoke("window:setSize", width, height),
    getSize: () => ipcRenderer.invoke("window:getSize"),
    setPosition: (x: number, y: number) =>
      ipcRenderer.invoke("window:setPosition", x, y),
    getPosition: () => ipcRenderer.invoke("window:getPosition"),
  },

  // Logging Operations
  log: {
    trace: (message: string) => ipcRenderer.invoke("log:trace", message),
    debug: (message: string) => ipcRenderer.invoke("log:debug", message),
    info: (message: string) => ipcRenderer.invoke("log:info", message),
    warn: (message: string) => ipcRenderer.invoke("log:warn", message),
    error: (message: string) => ipcRenderer.invoke("log:error", message),
    structured: (level: string, message: string, data?: unknown) =>
      ipcRenderer.invoke("log:structured", level, message, data),
    withContext: (
      level: string,
      message: string,
      context: Record<string, unknown>,
    ) => ipcRenderer.invoke("log:withContext", level, message, context),
  },

  // Dialog Operations
  dialog: {
    open: (options: Record<string, unknown>) =>
      ipcRenderer.invoke("dialog:open", options),
    save: (options: Record<string, unknown>) =>
      ipcRenderer.invoke("dialog:save", options),
    message: (options: Record<string, unknown>) =>
      ipcRenderer.invoke("dialog:message", options),
    error: (title: string, content: string) =>
      ipcRenderer.invoke("dialog:error", title, content),
    certificate: (options: Record<string, unknown>) =>
      ipcRenderer.invoke("dialog:certificate", options),
    confirm: (message: string, title?: string, detail?: string) =>
      ipcRenderer.invoke("dialog:confirm", message, title, detail),
    warning: (message: string, title?: string, detail?: string) =>
      ipcRenderer.invoke("dialog:warning", message, title, detail),
    info: (message: string, title?: string, detail?: string) =>
      ipcRenderer.invoke("dialog:info", message, title, detail),
  },

  // Clipboard Operations
  clipboard: {
    writeText: (text: string) =>
      ipcRenderer.invoke("clipboard:writeText", text),
    readText: () => ipcRenderer.invoke("clipboard:readText"),
    clear: () => ipcRenderer.invoke("clipboard:clear"),
    writeHTML: (markup: string, text?: string) =>
      ipcRenderer.invoke("clipboard:writeHTML", markup, text),
    readHTML: () => ipcRenderer.invoke("clipboard:readHTML"),
    writeRTF: (text: string) => ipcRenderer.invoke("clipboard:writeRTF", text),
    readRTF: () => ipcRenderer.invoke("clipboard:readRTF"),
    writeImage: (dataURL: string) =>
      ipcRenderer.invoke("clipboard:writeImage", dataURL),
    readImage: () => ipcRenderer.invoke("clipboard:readImage"),
    writeBookmark: (title: string, url: string) =>
      ipcRenderer.invoke("clipboard:writeBookmark", title, url),
    readBookmark: () => ipcRenderer.invoke("clipboard:readBookmark"),
    availableFormats: () => ipcRenderer.invoke("clipboard:availableFormats"),
    has: (format: string) => ipcRenderer.invoke("clipboard:has", format),
    read: (format: string) => ipcRenderer.invoke("clipboard:read", format),
    isEmpty: () => ipcRenderer.invoke("clipboard:isEmpty"),
    hasText: () => ipcRenderer.invoke("clipboard:hasText"),
    hasImage: () => ipcRenderer.invoke("clipboard:hasImage"),
  },

  // Event listeners for renderer-main communication
  events: {
    on: (channel: string, callback: (...args: unknown[]) => void) => {
      const validChannels = [
        "window-focus",
        "window-blur",
        "window-maximize",
        "window-unmaximize",
        "window-minimize",
        "window-restore",
        "app-update",
        "system-theme-changed",
        "shell:stdout",
        "shell:stderr",
        "shell:close",
        "shell:error",
      ];

      if (validChannels.includes(channel)) {
        const subscription = (
          _event: Electron.IpcRendererEvent,
          ...args: unknown[]
        ) => callback(...args);
        ipcRenderer.on(channel, subscription);
        return () => ipcRenderer.removeListener(channel, subscription);
      } else {
        console.warn(`Invalid event channel: ${channel}`);
      }
    },

    off: (channel: string, listener: (...args: unknown[]) => void) => {
      ipcRenderer.removeListener(channel, listener);
    },

    once: (channel: string, listener: (...args: unknown[]) => void) => {
      const validChannels = [
        "window-focus",
        "window-blur",
        "window-maximize",
        "window-unmaximize",
        "window-minimize",
        "window-restore",
        "app-update",
        "system-theme-changed",
        "shell:stdout",
        "shell:stderr",
        "shell:close",
        "shell:error",
      ];

      if (validChannels.includes(channel)) {
        const subscription = (
          _event: Electron.IpcRendererEvent,
          ...args: unknown[]
        ) => listener(...args);
        ipcRenderer.once(channel, subscription);
      } else {
        console.warn(`Invalid event channel: ${channel}`);
      }
    },
  },
});

// Expose version information
contextBridge.exposeInMainWorld("electronVersions", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

// Expose process information
contextBridge.exposeInMainWorld("electronProcess", {
  platform: process.platform,
  arch: process.arch,
  version: process.version,
});

export {
  sha256sum,
  versions,
  send,
  shellSpawnStreaming,
  shellWriteStdin,
  shellKillProcess,
};
