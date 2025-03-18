import { Injectable } from '@angular/core';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';
import { resolveResource } from '@tauri-apps/api/path';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { Logger } from './logging/logging';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly logger = Logger.getInstance();

  async getTranslation(lang: string): Promise<Translation> {
    try {
      const resourcePath: string = await resolveResource(`../assets/i18n/${lang}.json`);
      const jsonString: string = await readTextFile(resourcePath);

      this.logger.trace(`Loaded translation for ${lang}, ${jsonString.length} bytes`);
      return JSON.parse(jsonString) as Translation;
    } catch (err: any) {
      this.logger.error(err);
      return {};
    }
  }
}
