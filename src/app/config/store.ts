import { load, Store } from '@tauri-apps/plugin-store';
import { appConfigDir } from '@tauri-apps/api/path';
import { Logger } from '../logging/logging';

const logger = Logger.getInstance();

export async function getConfigStore(): Promise<Store> {
  const appConfigDirPath = await appConfigDir();
  logger.debug(`Saving config to: ${appConfigDirPath}`);

  return await load(`${appConfigDirPath}/config.json`, { autoSave: true });
}
