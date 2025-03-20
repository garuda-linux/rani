import type { LogLevel } from '../logging/interfaces';

export interface AppSettings {
  systemdUserContext: boolean;
  copyDiagnostics: boolean;
  darkMode: boolean;
  language: string;
  autoRefresh: boolean;
  leftButtons: boolean;
  showMainLinks: boolean;
  autoStart: boolean;
  logLevel: LogLevel;
  firstBoot: boolean | undefined;
  [key: string]: any;
}

export interface AppState {
  isMaximized: boolean;
  isLiveSystem: boolean | undefined;
  hostname: string;
  codeName: string;
  user: string;
  kernel: string;
  [key: string]: any;
}
