export interface StatefulPackage {
  aur?: boolean;
  pkgname: string[];
  selected?: boolean;
}

export interface Package {
  description?: string;
  icon: string;
  name: string;
  url?: string;
}

export type FullPackageDefinition = StatefulPackage & Package;

export interface GamingSection {
  name: string;
  hint?: string;
  sections: FullPackageDefinition[];
}
export type GamingSections = GamingSection[];
