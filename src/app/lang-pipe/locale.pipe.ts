import { Pipe, PipeTransform } from '@angular/core';
import { localeMap, locales } from './constants';

@Pipe({
  name: 'locale',
})
export class LocalePipe implements PipeTransform {
  transform(value: string, withUtf8: boolean): string {
    if (!withUtf8) return localeMap.get(value) ?? value;

    const onlyLocale: string = value.split('_')[0];
    if (onlyLocale && locales[onlyLocale]) {
      return `${locales[onlyLocale].name} ${locales[onlyLocale].flag} (${value})`;
    }
    return value;
  }
}
