import type { Router } from '@angular/router';
import { Logger } from './logging/logging';
import { LogLevel } from './logging/interfaces';

/**
 * Handle the CLI arguments and navigate to the appropriate route.
 * @param router The router to use for navigation.
 */
export async function handleCliArgs(router: Router) {
  const logger = Logger.getInstance();

  // TODO: FIX THIS SHIT
  const verbose = router.routerState.snapshot.root.queryParams['verbose'];
  const matches = router.routerState.snapshot.root.queryParams['matches'];
  if (verbose.value) {
    if (verbose.occurrences === 1) Logger.logLevel = LogLevel.DEBUG;
    if (verbose.occurrences > 1) Logger.logLevel = LogLevel.TRACE;
  }

  if (!matches.subcommand) return;
  switch (matches.subcommand.name) {
    case 'maintenance':
      await handleMaintenanceCommands(matches.subcommand, router);
      break;
    case 'settings':
      await handleSettingsCommands(matches.subcommand, router);
      break;
    case 'gaming':
      await handleGamingCommands(matches.subcommand, router);
      break;
    case 'diagnostics':
      await handleDiagnosticsCommands(matches.subcommand, router);
      break;
    case 'app-settings':
      await router.navigate(['/settings']);
      break;
    default:
      logger.error(`Unknown command: ${matches.subcommand.name}`);
  }
}

/**
 * Handle the maintenance commands.
 * @param maintenanceCommand The maintenance command to handle.
 * @param router The router to use for navigation.
 */
async function handleMaintenanceCommands(maintenanceCommand: any, router: Router) {
  if (maintenanceCommand?.matches?.subcommand?.name) {
    switch (maintenanceCommand.matches.subcommand.name) {
      case 'common':
        await router.navigate(['/maintenance'], { fragment: 'common' });
        break;
      case 'reset':
        await router.navigate(['/maintenance'], { fragment: 'reset' });
        break;
      case 'garuda-update':
        await router.navigate(['/maintenance'], { fragment: 'garuda-update' });
        break;
      default:
        await router.navigate(['/maintenance']);
    }
  } else {
    await router.navigate(['/maintenance']);
  }
}

/**
 * Handle the settings commands.
 * @param settingsCommand The settings command to handle.
 * @param router The router to use for navigation.
 */
async function handleSettingsCommands(settingsCommand: any, router: Router) {
  if (settingsCommand?.matches?.subcommand?.name) {
    switch (settingsCommand.matches.subcommand.name) {
      case 'components':
        await router.navigate(['/system-tools'], { fragment: 'components' });
        break;
      case 'system':
        await router.navigate(['/system-tools'], { fragment: 'system' });
        break;
      case 'packages':
        await router.navigate(['/system-tools'], { fragment: 'packages' });
        break;
      case 'kernels':
        await router.navigate(['/system-tools'], { fragment: 'kernels' });
        break;
      case 'locales':
        await router.navigate(['/system-tools'], { fragment: 'locales' });
        break;
      case 'services':
        await router.navigate(['/system-tools'], { fragment: 'services' });
        break;
      default:
        await router.navigate(['/system-tools']);
    }
  } else {
    await router.navigate(['/system-tools']);
  }
}

/**
 * Handle the gaming commands.
 * @param gamingCommand The gaming command to handle.
 * @param router The router to use for navigation.
 */
async function handleGamingCommands(gamingCommand: any, router: Router) {
  if (gamingCommand?.matches?.subcommand?.name) {
    switch (gamingCommand.matches.subcommand.name) {
      case 'launchers':
        await router.navigate(['/gaming'], { fragment: 'launchers' });
        break;
      case 'wine':
        await router.navigate(['/gaming'], { fragment: 'wine' });
        break;
      case 'tools':
        await router.navigate(['/gaming'], { fragment: 'tools' });
        break;
      case 'misc':
        await router.navigate(['/gaming'], { fragment: 'misc' });
        break;
      case 'controllers':
        await router.navigate(['/gaming'], { fragment: 'controllers' });
        break;
      case 'games':
        await router.navigate(['/gaming'], { fragment: 'games' });
        break;
      case 'emulators':
        await router.navigate(['/gaming'], { fragment: 'emulators' });
        break;
      default:
        await router.navigate(['/gaming'], { fragment: 'launchers' }); // Default to launchers
    }
  } else {
    await router.navigate(['/gaming'], { fragment: 'launchers' }); // Default to launchers if no subcommand
  }
}

/**
 * Handle the diagnostics commands.
 * @param diagnosticsCommand The diagnostics command to handle.
 * @param router The router to use for navigation.
 */
async function handleDiagnosticsCommands(diagnosticsCommand: any, router: Router) {
  const queryParams: Record<string, string> = {};

  if (diagnosticsCommand?.matches?.subcommand?.name) {
    switch (diagnosticsCommand.matches.subcommand.name) {
      case 'inxi':
        queryParams['action'] = 'inxi';
        break;
      case 'systemctl':
        queryParams['action'] = 'systemd-analyze';
        break;
      case 'journalctl':
        queryParams['action'] = 'journalctl';
        break;
      case 'dmesg':
        queryParams['action'] = 'dmesg';
        break;
      case 'pacman':
        queryParams['action'] = 'pacman';
        break;
      case 'full':
        queryParams['action'] = 'full-logs';
        break;
    }
  }

  if (diagnosticsCommand?.matches?.args['upload']) {
    const upload: any = diagnosticsCommand.matches.args['upload'];
    queryParams['upload'] = (upload.value as string) ?? 'false';
  }

  await router.navigate(['/diagnostics'], { queryParams });
}
