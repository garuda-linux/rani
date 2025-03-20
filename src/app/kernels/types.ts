import { StatefulPackage } from '../gaming/interfaces';

export interface Kernel extends StatefulPackage {
  version: string;
  repo: string;
  description: string;
  selected?: boolean;
  headersSelected?: boolean;
}

export type Kernels = Kernel[];

export interface DkmsModule {
  name: string;
  version: string;
  status: DkmsModuleStatus;
}

export type DkmsModuleStatus = 'installed' | 'broken';

export type DkmsModules = DkmsModule[];
