import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, inject, isDevMode, LOCALE_ID, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { MessageToastService, provideGarudaNG } from '@garudalinux/core';
import { routes } from './app.routes';
import { Catppuccin } from './theme';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';
import { ConfirmationService } from 'primeng/api';
import { PrivilegeManagerService } from './privilege-manager/privilege-manager.service';
import { OperationManagerService } from './operation-manager/operation-manager.service';
import { LoadingInterceptor } from './loading-indicator/loading-indicator.interceptor';
import { ConfigService } from './config/config.service';
import { getCurrentWindow, Window } from '@tauri-apps/api/window';
import { checkFirstBoot } from './first-boot';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(async () => {
      const configService = inject(ConfigService);
      await configService.init();

      // Window is hidden by default, after checking whether we are not required to autostart the
      // setup assistant, we can show it
      if (await checkFirstBoot())
        return;

      const window: Window = getCurrentWindow();
      await window.show();
    }),
    ConfigService,
    ConfirmationService,
    MessageToastService,
    OperationManagerService,
    PrivilegeManagerService,
    provideAnimationsAsync(),
    provideGarudaNG(
      { font: 'Inter' },
      {
        theme: {
          preset: Catppuccin,
          options: {
            darkModeSelector: '.p-dark',
          },
        },
        ripple: true,
        inputStyle: 'outlined',
      },
    ),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: [
          'am',
          'ar',
          'de',
          'en',
          'es',
          'eu',
          'fr',
          'gl',
          'hi',
          'hu',
          'id',
          'it',
          'ja',
          'ko',
          'pl',
          'pt',
          'ru',
          'sl',
          'sv',
          'sw',
          'tr',
          'uz',
          'zh-CN',
        ],
        defaultLang: 'en',
        fallbackLang: 'en',
        flatten: {
          aot: !isDevMode(),
        },
        missingHandler: {
          useFallbackTranslation: true,
        },
        prodMode: !isDevMode(),
        reRenderOnLangChange: true,
      },
      loader: TranslocoHttpLoader,
    }),
    provideTranslocoLocale({
      langToLocaleMapping: {
        en: 'en-US',
        de: 'de-DE',
      },
    }),
    { provide: LOCALE_ID, useValue: 'en-GB' },
    { provide: HTTP_INTERCEPTORS, useValue: [LoadingInterceptor], multi: true },
  ],
};
