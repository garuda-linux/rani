import type { LogLevel } from '../../logging/interfaces';
import { AppTheme } from '../../theme';

export interface AppSettings {
  activeTheme: AppTheme;
  autoRefresh: boolean;
  autoStart: boolean;
  copyDiagnostics: boolean;
  darkMode: boolean;
  firstBoot: boolean | undefined;
  language: string;
  logLevel: LogLevel;
  showMainLinks: boolean;
  systemdUserContext: boolean;
  [key: string]: any;
}

export interface AppState {
  availablePkgs: Map<string, boolean>;
  borderlessMaximizedWindow: boolean;
  codeName: string;
  desktopEnvironment: DesktopEnvironment;
  hostname: string;
  isLiveSystem: boolean | undefined;
  isMaximized: boolean;
  kernel: string;
  locale: string;
  rebootPending: boolean;
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
  | 'EDGE'
  | 'Cinnamon'
  | 'Pantheon'
  | 'DDE'
  | 'Hyprland';
