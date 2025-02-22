export interface Operation {
  command: (args?: string[]) => string;
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

export interface Package {
  icon: string;
  name: string;
  pkgname: string[];
  selected?: boolean;
  initialState?: boolean;
}

export interface MaintenanceAction {
  command: (args?: string[]) => string;
  description: string;
  hasOutput: boolean;
  icon: string;
  label: string;
  name: string;
  order: number;
  sudo: boolean;
}

export interface SystemdService {
  unit: string;
  load: string;
  active: string;
  sub: string;
  description: string;
}
