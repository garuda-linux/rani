import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import {
  type ApplicationConfig,
  isDevMode,
  LOCALE_ID,
  provideAppInitializer,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideGarudaNG } from '@garudalinux/core';
import { routes } from './app.routes';
import { CatppuccinAura } from './theme';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';
import { ConfirmationService } from 'primeng/api';
import { LoadingInterceptor } from './loading-indicator/loading-indicator.interceptor';
import { ConfigService } from './config/config.service';
import { LanguageManagerService } from './language-manager/language-manager.service';
import { initRani } from './app.init';
import { ThemeService } from './theme-service/theme-service';

export const appConfig: ApplicationConfig = {
  providers: [
    ConfigService,
    ConfirmationService,
    LanguageManagerService,
    ThemeService,
    provideAnimationsAsync(),
    provideAppInitializer(initRani),
    provideExperimentalZonelessChangeDetection(),
    provideGarudaNG(
      { font: 'InterVariable' },
      {
        theme: {
          preset: CatppuccinAura,
          options: {
            darkModeSelector: '.p-dark',
          },
        },
        ripple: true,
        inputStyle: 'outlined',
      },
    ),
    provideHttpClient(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
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
