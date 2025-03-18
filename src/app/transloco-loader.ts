import { Injectable } from '@angular/core';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';
import { resolveResource } from '@tauri-apps/api/path';
import { readTextFile } from '@tauri-apps/plugin-fs';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  async getTranslation(lang: string): Promise<Translation> {
    const resourcePath: string = await resolveResource(`../assets/i18n/${lang}.json`);
    return JSON.parse(await readTextFile(resourcePath)) as Translation;
  }
}
