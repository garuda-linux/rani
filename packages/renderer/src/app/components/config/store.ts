import { ElectronStoreService, Store } from "../../electron-services";
import { appConfigDir } from "../../electron-services";
import { Logger } from "../../logging/logging";

const logger = Logger.getInstance();
const storeService = new ElectronStoreService();

export async function getConfigStore(context: string): Promise<Store> {
  const appConfigDirPath: string = await appConfigDir();
  return await storeService.load({ key: context });
}
