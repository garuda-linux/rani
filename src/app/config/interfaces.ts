export interface AppSettings {
  systemdUserContext: boolean;
  copyDiagnostics: boolean;
  language: string;
  autoRefresh: boolean;
  leftButtons: boolean;
  showMainLinks: boolean;
  [key: string]: any;
}

export interface AppState {
  isMaximized: boolean;
  [key: string]: any;
}
