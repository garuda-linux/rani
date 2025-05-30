import { Logger } from './components/logging/logging';
import { getConfigStore } from './components/config/store';

const logger = Logger.getInstance();

/**
 * Check if the system is on first boot and act accordingly, showing the setup assistant if required.
 * Sets the firstBoot flag to false after the first boot is detected.
 */
export async function checkFirstBoot(): Promise<boolean> {
  // const store: Store = await getConfigStore('checkFirstBoot');
  // const firstBoot: boolean | undefined = await store.get<boolean>('firstBoot');

  // // Check if we've been through this before
  // if (firstBoot === false) return false;

  // const cmd = 'last reboot -n 2 --time-format notime';
  // const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

  // // If row count of the result is 1, then it's the first boot, otherwise it's not
  // if (result.stdout.split('\n').length !== 2) {
  //   logger.info('Not first boot');
  //   await store.set('firstBoot', false);
  //   return false;
  // }

  // if (await exists('/usr/bin/setup-assistant')) {
  //   logger.info('Setup assistant exists, running');

  //   const window: Window = getCurrentWindow();
  //   await window.hide();

  //   await runSetupAssistant();

  //   // Set first boot flag to false
  //   await store.set('firstBoot', false);
  //   await store.save();

  //   // And finally relaunch
  //   await relaunch();
  //   return true;
  // }

  // logger.info('Setup assistant does not exist');
  return false;
}

/**
 * Run the setup assistant and wait until it's done.
 */
async function runSetupAssistant(): Promise<void> {
  // const cmdRef: Command<string> = Command.create('exec-bash', ['-c', 'VERSION=3 setup-assistant']);
  // try {
  //   await cmdRef.execute();
  // } catch (error) {
  //   logger.error(`Error running setup assistant: ${error}`);
  // }
}
