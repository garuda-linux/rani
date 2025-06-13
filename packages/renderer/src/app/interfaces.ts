export interface MenuToggleMappings {
  [key: string]: MenuToggleMapping;
}

export interface MenuToggleMapping {
  on: string;
  off: string;
  onIcon: string;
  offIcon: string;
}

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

export interface MaintenanceAction {
  command: ((args?: string[]) => string) | (() => Promise<void>);
  description: string;
  hasOutput: boolean;
  icon: string;
  label: string;
  name: string;
  onlyDirect?: boolean;
  priority: number;
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
  disabler?: string | string[];
  disabled?: boolean;
  check: {
    type: 'pkg' | 'group' | 'service' | 'serviceUser';
    name: string;
  };
}

export interface Link {
  title: string;
  subTitle: string;
  icon?: any | string;
}

export type ExternalLink = Link & {
  externalLink: string;
};

export type HomepageLink = Link & {
  routerLink?: string;
  command?: () => void;
  condition?: () => boolean;
};
