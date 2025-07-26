import { inject } from '@angular/core';
import { ConfigService } from './components/config/config.service';
import { LanguageManagerService } from './components/language-manager/language-manager.service';
import { checkFirstBoot } from './first-boot';
import { ElectronWindowService } from './electron-services';

export async function initRani() {
  const configService = inject(ConfigService);
  const languageManagerService = inject(LanguageManagerService);
  await configService.init();

  // Window is hidden by default, after checking whether we are not required to autostart the
  // setup assistant, we can show it
  if (await checkFirstBoot()) return;

  await languageManagerService.init();

  const windowService = new ElectronWindowService();
  await windowService.show();
}
