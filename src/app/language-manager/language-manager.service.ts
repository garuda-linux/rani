import { effect, inject, Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { TranslocoService } from '@jsverse/transloco';
import { locale } from '@tauri-apps/plugin-os';
import { Logger } from '../logging/logging';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LanguageManagerService {
    private readonly configService = inject(ConfigService);
    private readonly translocoService = inject(TranslocoService);
    private readonly logger = Logger.getInstance();

    constructor() {
        effect(() => {
            const savedLang: string = this.configService.settings().language;
            void this.updateLanguage(savedLang);
        });
    }

    async init() {
        const savedLang: string = this.configService.settings().language;
        await this.updateLanguage(savedLang);
        // Wait for language to load by doing a dummy translation
        await firstValueFrom(this.translocoService.selectTranslate('dummy'));
    }

    async updateLanguage(lang: string) {
        const sysLang: string | null = await locale();
        let activeLang: string = lang ?? sysLang;
        if (activeLang.match(/en-/)) {
            activeLang = 'en';
        }
        this.logger.trace(`Active language: ${activeLang}`);

        if (activeLang && activeLang !== this.translocoService.getActiveLang() && (this.translocoService.getAvailableLangs() as string[]).includes(activeLang)) {
            this.translocoService.setActiveLang(activeLang);
        }
    }
}
