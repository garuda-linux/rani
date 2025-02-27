import { Command } from '@tauri-apps/plugin-shell';

export interface Operation {
  command: ((args?: string[]) => string) | (() => Promise<string | void>) | ((args?: string[]) => Command<string>);
  commandArgs: any[];
  hasOutput?: boolean;
  name: OperationType;
  order?: number;
  output?: string;
  prettyName: string;
  sudo?: boolean;
  status: OperationStatus;
}

export type OperationStatus = 'pending' | 'running' | 'complete' | 'error';

export type OperationType =
  | typeof INSTALL_ACTION_NAME
  | typeof REMOVE_ACTION_NAME
  | typeof ADD_USER_GROUP_ACTION_NAME
  | typeof REMOVE_USER_GROUP_ACTION_NAME
  | typeof DISABLE_SERVICE_ACTION_NAME
  | typeof ENABLE_SERVICE_ACTION_NAME
  | typeof ENABLE_HBLOCK_NAME
  | typeof DISABLE_HBLOCK_NAME
  | typeof SET_NEW_DNS_SERVER
  | typeof RESET_DNS_SERVER
  | typeof ENABLE_USER_SERVICE_ACTION_NAME
  | typeof DISABLE_USER_SERVICE_ACTION_NAME
  | typeof SET_DEFAULT_SHELL_ACTION_NAME;

export const INSTALL_ACTION_NAME = 'install';
export const REMOVE_ACTION_NAME = 'remove';

export const ADD_USER_GROUP_ACTION_NAME = 'addUserGroup';
export const REMOVE_USER_GROUP_ACTION_NAME = 'removeUserGroup';

export const DISABLE_SERVICE_ACTION_NAME = 'disableService';
export const ENABLE_SERVICE_ACTION_NAME = 'enableService';

export const ENABLE_HBLOCK_NAME = 'enableHBlock';
export const DISABLE_HBLOCK_NAME = 'disableHBlock';

export const SET_NEW_DNS_SERVER = 'setNewDnsServer';
export const RESET_DNS_SERVER = 'resetDnsServer';

export const ENABLE_USER_SERVICE_ACTION_NAME = 'enableUserService';
export const DISABLE_USER_SERVICE_ACTION_NAME = 'disableUserService';

export const SET_DEFAULT_SHELL_ACTION_NAME = 'setDefaultShell';
