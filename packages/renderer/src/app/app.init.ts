import { Logger } from './components/logging/logging';
import { inject } from '@angular/core';
import { ConfigService } from './components/config/config.service';
import { LanguageManagerService } from './components/language-manager/language-manager.service';
import { checkFirstBoot } from './first-boot';
import { handleCliArgs } from './commands';
import { Router } from '@angular/router';

export async function initRani() {
  const configService = inject(ConfigService);
  const languageManagerService = inject(LanguageManagerService);
  await configService.init();

  // Window is hidden by default, after checking whether we are not required to autostart the
  // setup assistant, we can show it
  if (await checkFirstBoot()) return;

  await languageManagerService.init();
}
