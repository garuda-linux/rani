// Electron Services - Barrel exports for easy importing
export * from './electron-fs.service';
export * from './electron-shell.service';
export * from './electron-store.service';
export * from './electron-path.service';
export * from './electron-os.service';
export * from './electron-notification.service';
export * from './electron-log.service';
export * from './electron-clipboard.service';
export * from './electron-types';

// Re-export commonly used interfaces and classes
export { ElectronFsService } from './electron-fs.service';
export { ElectronShellService } from './electron-shell.service';
export { ElectronStoreService } from './electron-store.service';
export { resolveResource, appLocalDataDir, resolve, appConfigDir } from './electron-path.service';
export { debug, error, info, trace, warn } from './electron-log.service';
export { locale } from './electron-os.service';
export { isPermissionGranted, requestPermission, sendNotification } from './electron-notification.service';
export type { Store, StoreOptions } from './electron-store.service';
export type { CommandResult, ChildProcess, Child } from '../../types/shell';
export type { NotificationOptions } from './electron-notification.service';
export type { LogLevel } from './electron-log.service';
export { writeText, readText, clear } from './electron-clipboard.service';
export type { ElectronAPI } from './electron-types';
