import { ElectronStoreService, Store } from '../../electron-services';

const storeService = new ElectronStoreService();

/**
 * Get the configuration store for the application.
 * @param context The context for which the configuration store is to be loaded.
 * @return A promise that resolves to the Store instance for the specified context.
 */
export async function getConfigStore(context: string): Promise<Store> {
  return await storeService.load({ key: context });
}
