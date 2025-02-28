export interface AppSettings {
  systemdUserContext: boolean;
  copyDiagnostics: boolean;
  darkMode: boolean;
  language: string;
  autoRefresh: boolean;
  leftButtons: boolean;
  showMainLinks: boolean;
  [key: string]: any;
}

export interface AppState {
  isMaximized: boolean;
  user: string;
  [key: string]: any;
}
