import { inject, Injectable, signal } from '@angular/core';
import { LanguagePack, LanguagePacks } from './types';
import { ChildProcess } from '@tauri-apps/plugin-shell';
import { Logger } from '../logging/logging';
import { TaskManagerService } from '../task-manager/task-manager.service';
import { OsInteractService } from '../task-manager/os-interact.service';
import { LoadingService } from '../loading-indicator/loading-indicator.service';

@Injectable({
  providedIn: 'root',
})
export class LanguagePacksService {
  languagePacks = signal<LanguagePacks>([]);
  loading = signal<boolean>(true);

  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();
  private readonly osInteractService = inject(OsInteractService);
  private readonly taskManagerService = inject(TaskManagerService);

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    this.loadingService.loadingOn();
    await this.getAvailableLangPacks();
    this.loadingService.loadingOff();
    this.loading.set(false);
  }

  async getAvailableLangPacks(): Promise<void> {
    const locales: string[] = await this.getLocales();
    const allAvailablePackages: string[] = await this.getAllAvailablePackages();
    const totalPacks: LanguagePacks = [];

    for (const locale of locales) {
      this.logger.trace(`Checking locale: ${locale}`);
      const [language, territory] = locale.split('_');
      if (!territory) continue;

      for (const pkgname of allAvailablePackages) {
        const firstMatch = `^.*-(${language}(_${territory}|-${territory})?|${locale})?$`;
        if (!pkgname.match(new RegExp(firstMatch, 'i'))) continue;
        this.logger.trace(`Checking package: ${pkgname} for locale: ${locale}`);

        let langString: string;
        let regexLangOnly: string = `^.*\-${language}$`;
        switch (true) {
          case pkgname.match(new RegExp(regexLangOnly)) !== null:
            this.logger.trace(`Package ${pkgname} found for locale: ${locale}`);
            langString = `${language}`;
            break;
          case pkgname.includes(`${language}-${territory}`):
            langString = `${language}-${territory}`;
            break;
          case pkgname.includes(`${language}_${territory}`):
            this.logger.trace(`Package ${pkgname} found for locale: ${locale}`);
            langString = `${language}_${territory}`;
            break;
          case pkgname.includes(`${language}-${territory}`.toLowerCase()):
            this.logger.trace(`Package ${pkgname} found for locale: ${locale}`);
            langString = `${language}-${territory}`.toLowerCase();
            break;
          case pkgname.includes(`${language}_${territory}`.toLowerCase()):
            this.logger.trace(`Package ${pkgname} found for locale: ${locale}`);
            langString = `${language}_${territory}`.toLowerCase();
            break;
          default:
            continue;
        }

        const base: string = pkgname.replace(`-${langString}`, '');
        if (!this.osInteractService.packages().get(base)) {
          this.logger.debug(`Package ${base} is not installed, skipping ${pkgname}`);
          continue;
        }

        const languagePack: LanguagePack = {
          pkgname: [pkgname],
          locale,
          selected: this.osInteractService.packages().get(pkgname) === true,
          base,
        };
        totalPacks.push(languagePack);
      }
    }

    this.logger.info(`Found ${totalPacks.length} language packs for ${locales.length} locales`);
    this.languagePacks.set(totalPacks);
  }

  async getLocales(): Promise<string[]> {
    const cmd = 'locale -a';
    const result: ChildProcess<string> = await this.taskManagerService.executeAndWaitBash(cmd);

    if (result.code !== 0) {
      this.logger.error(`Failed to get available language packs: ${result.stderr}`);
    }

    const locales = result.stdout
      .trim()
      .split('\n')
      .filter((locale) => locale.includes('utf8'))
      .map((locale) => locale.split('.')[0]);
    this.logger.debug(`Available locales: ${locales.length}`);
    return locales;
  }

  async getAllAvailablePackages(): Promise<string[]> {
    const cmd = 'pacman -Ssq';
    const result: ChildProcess<string> = await this.taskManagerService.executeAndWaitBash(cmd);

    if (result.code !== 0) {
      this.logger.error(`Failed to get available language packs: ${result.stderr}`);
    }

    const packages: string[] = result.stdout.trim().split('\n');
    this.logger.debug(`Available packages: ${packages.length}`);
    return packages;
  }
}
