export interface SystemUpdate {
  pkg: string;
  version: string;
  newVersion: string;
  aur: boolean;
}

export type UpdateStatusOption = 'repo' | 'aur';

export type UpdateType = 'Updates' | 'AUR updates';
