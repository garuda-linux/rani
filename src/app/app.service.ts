import { inject, Injectable, signal } from '@angular/core';
import { ThemeHandler } from './theme-handler/theme-handler';
import { Store } from '@tauri-apps/plugin-store';
import { locale } from '@tauri-apps/plugin-os';
import { TranslocoService } from '@jsverse/transloco';
import { isPermissionGranted, Options, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { attachConsole, debug } from '@tauri-apps/plugin-log';
import { AppSettings } from './interfaces';
import { MessageToastService } from '@garudalinux/core';
import { getConfigStore } from './store';
import { ConfirmationService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  activeLanguage = signal<string>('en');
  readonly themeHandler = new ThemeHandler();

  state = {
    isMaximized: signal<boolean>(false),
    leftButtons: signal<boolean>(false),
  };
  settings: AppSettings = {
    leftButtons: true,
    autoRefresh: false,
    copyDiagnostics: true,
    showMainLinks: false,
    systemdUserContext: false,
  };
  store!: Store;

  readonly confirmationService = inject(ConfirmationService);
  readonly messageToastService = inject(MessageToastService);
  readonly translocoService = inject(TranslocoService);

  constructor() {
    void this.init();
  }

  async init() {
    const detach = await attachConsole();
    this.store = await getConfigStore();

    if (this.store) {
      const settings = (await this.store.get('settings')) as AppSettings;
      if (settings) {
        this.settings = settings;
      }
    }

    const activeLang: string = ((await this.store.get('language')) as string) ?? (await locale());
    if (activeLang && (this.translocoService.getAvailableLangs() as string[]).includes(activeLang)) {
      this.activeLanguage.set(activeLang);
      void this.store.set('language', activeLang);
      void debug(`Active language: ${activeLang}`);
    }
  }

  /**
   * Send a notification to the user.
   * @param options The options for the notification.
   */
  async sendNotification(options: Options): Promise<void> {
    let permissionGranted: boolean = await isPermissionGranted();
    if (!permissionGranted) {
      const permission: NotificationPermission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    if (permissionGranted) {
      sendNotification(options);
    }
  }
}
