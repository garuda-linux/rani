import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, isDevMode, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideGarudaNG } from '@garudalinux/core';
import { routes } from './app.routes';
import { Catppuccin } from './theme';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';
import { provideTranslocoPersistLang } from '@jsverse/transloco-persist-lang';
import { provideTranslocoLocale } from '@jsverse/transloco-locale';

export const appConfig: ApplicationConfig = {
  providers: [
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
        availableLangs: ['en', 'de'],
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
    provideTranslocoPersistLang({
      storage: {
        useValue: localStorage,
      },
    }),
    { provide: LOCALE_ID, useValue: 'en-GB' },
  ],
};
