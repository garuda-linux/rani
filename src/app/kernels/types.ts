import { StatefulPackage } from '../gaming/interfaces';

export interface Kernel extends StatefulPackage {
  version: string;
  repo: string;
  description: string;
  selected?: boolean;
  headersSelected?: boolean;
}

export type Kernels = Kernel[];
