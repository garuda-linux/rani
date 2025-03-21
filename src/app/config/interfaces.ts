import type { LogLevel } from '../logging/interfaces';

export interface AppSettings {
  autoRefresh: boolean;
  autoStart: boolean;
  copyDiagnostics: boolean;
  darkMode: boolean;
  firstBoot: boolean | undefined;
  language: string;
  leftButtons: boolean;
  logLevel: LogLevel;
  showMainLinks: boolean;
  systemdUserContext: boolean;
  [key: string]: any;
}

export interface AppState {
  codeName: string;
  desktopEnvironment: DesktopEnvironment;
  hostname: string;
  isLiveSystem: boolean | undefined;
  isMaximized: boolean;
  kernel: string;
  user: string;
  [key: string]: any;
}

export type DesktopEnvironment =
  | 'GNOME'
  | 'GNOME-Flashback'
  | 'KDE'
  | 'LXDE'
  | 'LXQt'
  | 'MATE'
  | 'TDE'
  | 'Unity'
  | 'XFCE'
  | 'EDE'
  | 'Cinnamon'
  | 'Pantheon'
  | 'DDE'
  | 'Hyprland';
