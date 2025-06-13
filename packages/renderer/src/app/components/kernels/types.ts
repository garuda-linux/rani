import type { StatefulPackage } from '../gaming/interfaces';

export interface Kernel extends StatefulPackage {
  version: string;
  repo: string;
  description: string;
  selected?: boolean;
  headersSelected?: boolean;
  dkmsModulesMissing: string[];
  initialState: boolean;
}

export type Kernels = Kernel[];

export interface DkmsModule {
  moduleName: string;
  moduleVersion: string;
  kernelVersion: string;
  status: DkmsModuleStatus;
}

export type DkmsModuleStatus = 'installed' | 'broken' | 'unknown';

export type DkmsModules = DkmsModule[];
