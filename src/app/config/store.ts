import { load, Store } from '@tauri-apps/plugin-store';
import { appConfigDir } from '@tauri-apps/api/path';
import { debug } from '@tauri-apps/plugin-log';

export async function getConfigStore(): Promise<Store> {
  const appConfigDirPath = await appConfigDir();
  void debug(`Saving config to: ${appConfigDirPath}`);

  return await load(`${appConfigDirPath}/config.json`, { autoSave: true });
}
