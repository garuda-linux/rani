export interface AppSettings {
  systemdUserContext: boolean;
  copyDiagnostics: boolean;
  darkMode: boolean;
  language: string;
  autoRefresh: boolean;
  leftButtons: boolean;
  showMainLinks: boolean;
  autoStart: boolean;
  firstBoot: boolean;
  [key: string]: any;
}

export interface AppState {
  isMaximized: boolean;
  isLiveSystem: boolean;
  hostname: string;
  codeName: string;
  user: string;
  [key: string]: any;
}
