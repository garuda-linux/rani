import { MenuToggleMappings } from './interfaces';

export const settingsMenuMappings: MenuToggleMappings = {
  darkMode: {
    on: 'menu.settings.enableDarkMode',
    off: 'menu.settings.enableLightMode',
    onIcon: 'pi pi-moon',
    offIcon: 'pi pi-sun',
  },
  leftButtons: {
    on: 'menu.settings.windowButtonsLeft',
    off: 'menu.settings.windowButtonsRight',
    onIcon: 'pi pi-angle-left',
    offIcon: 'pi pi-angle-right',
  },
  autoRefresh: {
    on: 'menu.settings.enableAutoRefresh',
    off: 'menu.settings.disableAutoRefresh',
    onIcon: 'pi pi-refresh',
    offIcon: 'pi pi-ban',
  },
  copyDiagnostics: {
    on: 'menu.settings.copyDiagnostics',
    off: 'menu.settings.dontCopyDiagnostics',
    onIcon: 'pi pi-clipboard',
    offIcon: 'pi pi-ban',
  },
  autoStart: {
    on: 'menu.settings.autoStart',
    off: 'menu.settings.dontAutoStart',
    onIcon: 'pi pi-check',
    offIcon: 'pi pi-ban',
  },
  systemdUserContext: {
    on: 'menu.settings.systemdUserContext',
    off: 'menu.settings.systemdSystemContext',
    onIcon: 'pi pi-user',
    offIcon: 'pi pi-server',
  },
  showHidden: {
    on: 'menu.settings.enableAutoRefresh',
    off: 'menu.settings.disableAutoRefresh',
    onIcon: 'pi pi-eye',
    offIcon: 'pi pi-eye-slash',
  },
};
