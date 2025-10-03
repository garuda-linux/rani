import { inject } from '@angular/core';
import { ConfigService } from './components/config/config.service';
import { LanguageManagerService } from './components/language-manager/language-manager.service';
import { SplashService } from './components/splash/splash.service';
import { checkFirstBoot } from './first-boot';

export async function initRani() {
  const configService = inject(ConfigService);
  const languageManagerService = inject(LanguageManagerService);
  const splashService = inject(SplashService);

  splashService.show();
  splashService.updateStep(50, 'Loading configuration...');
  await configService.init();

  if (!configService.state().isLiveSystem && (await checkFirstBoot())) {
    await splashService.hide();
    return;
  }

  splashService.updateStep(60, 'Initializing languages..');
  await languageManagerService.init();

  splashService.updateStep(90, 'Ready!');
  await splashService.hide();
}
