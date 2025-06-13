import { StatefulPackage } from '../gaming/interfaces';

export interface LanguagePack extends StatefulPackage {
  locale: string;
  base: string;
}

export type LanguagePacks = LanguagePack[];
