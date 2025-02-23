export interface Operation {
  command: ((args?: string[]) => string) | (() => Promise<void>);
  commandArgs: any[];
  hasOutput?: boolean;
  name: string;
  order?: number;
  output?: string;
  prettyName: string;
  sudo?: boolean;
  status: OperationStatus;
}

export type OperationStatus = 'pending' | 'running' | 'complete' | 'error';

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

export interface Package {
  icon: string;
  name: string;
  pkgname: string[];
  selected?: boolean;
  initialState?: boolean;
  description?: string;
}

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
  unit: string;
  load: string;
  active: string;
  sub: string;
  description: string;
}
