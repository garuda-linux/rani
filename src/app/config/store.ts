import { load, type Store } from '@tauri-apps/plugin-store';
import { appConfigDir } from '@tauri-apps/api/path';
import { Logger } from '../logging/logging';

const logger = Logger.getInstance();

export async function getConfigStore(context: string): Promise<Store> {
  const appConfigDirPath: string = await appConfigDir();
  logger.debug(`Saving config to: ${appConfigDirPath}, context: ${context}`);

  return await load(`${appConfigDirPath}/config.json`, { autoSave: true });
}
