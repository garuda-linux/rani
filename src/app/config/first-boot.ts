import { ChildProcess, Command } from '@tauri-apps/plugin-shell';
import { getCurrentWindow, Window } from '@tauri-apps/api/window';
import { Logger } from '../logging/logging';
import { getConfigStore } from './store';
import { Store } from '@tauri-apps/plugin-store';
import { relaunch } from '@tauri-apps/plugin-process';

const logger = Logger.getInstance();

/**
 * Check if the system is on first boot and act accordingly, showing the setup assistant if required.
 * Sets the firstBoot flag to false after the first boot is detected.
 */
export async function checkFirstBoot(): Promise<void> {
  const store: Store = await getConfigStore();
  const firstBoot: boolean | undefined = await store.get<boolean>('firstBoot');
  if (firstBoot === false) return;

  const cmd = 'last reboot';
  const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

  if (result.code === 0) {
    if (result.stdout.split('\n').length <= 3) {
      logger.info('First boot detected');

      const cmd = 'test -f /usr/bin/setup-assistant';
      const setupAssistantExists: boolean = (await Command.create('exec-bash', ['-c', cmd]).execute()).code === 0;
      if (setupAssistantExists) {
        logger.info('Setup assistant exists, running');
        await runSetupAssistant();

        // Set first boot flag to false
        await store.set('firstBoot', false);

        // And finally relaunch
        await relaunch();
      }
    } else {
      logger.info('Not first boot');
      if (firstBoot === undefined) {
        await store.set('firstBoot', false);
      }
    }
  } else {
    logger.error('Failed to check first boot');
  }
}

/**
 * Run the setup assistant and wait until it's done.
 */
async function runSetupAssistant(): Promise<void> {
  const cmdRef: Command<string> = Command.create('exec-bash', ['-c', 'VERSION=2 setup-assistant']);
  let stillRunning: boolean = true;

  const window: Window = getCurrentWindow();
  await window.hide();

  cmdRef.on('close', () => {
    stillRunning = false;
  });
  cmdRef.on('error', () => {
    stillRunning = false;
  });

  while (stillRunning) {
    await new Promise((r) => setTimeout(r, 1000));
  }

  logger.info('Setup assistant closed, proceeding to show UI');
  await window.show();
}
