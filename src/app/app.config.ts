import { HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  type ApplicationConfig,
  isDevMode,
  LOCALE_ID,
  provideAppInitializer,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideGarudaNG } from '@garudalinux/core';
import { routes } from './app.routes';
import { CatppuccinAura } from './theme';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';
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
    provideRouter(routes),
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
        missingHandler: {
          useFallbackTranslation: true,
        },
        prodMode: !isDevMode(),
        reRenderOnLangChange: true,
      },
      loader: TranslocoHttpLoader,
    }),
    { provide: LOCALE_ID, useValue: 'en-GB' },
    { provide: HTTP_INTERCEPTORS, useValue: [LoadingInterceptor], multi: true },
  ],
};
