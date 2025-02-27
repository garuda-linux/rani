export type SystemdServiceAction =
  | 'start'
  | 'stop'
  | 'restart'
  | 'reload'
  | 'enable'
  | 'disable'
  | 'logs'
  | 'mask'
  | 'unmask';

export interface StatefulPackage {
  pkgname: string[];
  selected?: boolean;
  initialState?: boolean;
}

export interface Package {
  description?: string;
  icon: string;
  name: string;
}

export type FullPackageDefinition = StatefulPackage & Package;

export interface MaintenanceAction {
  addedToPending?: boolean;
  command: ((args?: string[]) => string) | (() => Promise<void>);
  description: string;
  hasOutput: boolean;
  icon: string;
  label: string;
  name: string;
  onlyDirect?: boolean;
  order: number;
  sudo: boolean;
}

export interface ResettableConfig {
  name: string;
  checked?: boolean;
  exists?: boolean;
  description: string;
  files: string[];
}

export interface SystemdService {
  unit?: string;
  unit_file?: string;
  load: string;
  active: string;
  sub: string;
  description: string;
  tooltip?: string;
}

export interface SystemToolsEntry {
  name: string;
  icon: string;
  sections: SystemToolsSubEntry[];
}

export interface SystemToolsSubEntry {
  name: string;
  fancyTitle: string;
  description: string;
  checked: boolean;
  disabler?: string;
  disabled?: boolean;
  handler: () => void;
  initialState: boolean;
  check: {
    type: 'pkg' | 'group' | 'service' | 'serviceUser';
    name: string;
  };
}

export interface Link {
  title: string;
  subTitle: string;
  icon?: string;
}

export type ExternalLink = Link & {
  externalLink: string;
};

export type HomepageLink = Link & {
  routerLink?: string;
  command?: () => void;
};
