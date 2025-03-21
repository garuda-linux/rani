import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { type ChildProcess, Command, open } from '@tauri-apps/plugin-shell';
import { Logger } from '../logging/logging';
import { OverlayBadge } from 'primeng/overlaybadge';
import { Tooltip } from 'primeng/tooltip';
import { TranslocoDirective } from '@jsverse/transloco';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { type Task, TaskManagerService } from '../task-manager/task-manager.service';
import type { SystemUpdate, UpdateStatusOption, UpdateType } from './types';
import { ConfigService } from '../config/config.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'rani-system-status',
  imports: [OverlayBadge, Tooltip, TranslocoDirective, Dialog, Button, RouterLink],
  templateUrl: './system-status.component.html',
  styleUrl: './system-status.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemStatusComponent implements OnInit {
  compareTool = computed(() => {
    switch (this.configService.state().desktopEnvironment) {
      case 'Cinnamon':
      case 'GNOME-Flashback':
      case 'GNOME':
      case 'Hyprland':
      case 'Pantheon':
      case 'MATE':
      case 'XFCE':
        return 'meld';
      case 'KDE':
      case 'LXQt':
        return 'kompare';
      default:
        return 'meld';
    }
  });
  dialogVisible = signal<boolean>(false);
  firstRun = true;
  pacdiffDialogVisible = signal<boolean>(false);
  pacFiles = signal<string[]>([]);
  rebootDialogVisible = signal<boolean>(false);
  updates = signal<SystemUpdate[]>([]);
  warnUpdate = signal<boolean>(false);

  protected readonly configService = inject(ConfigService);
  protected readonly open = open;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();
  private readonly taskManagerService = inject(TaskManagerService);

  buttonDisabled = computed(() => this.taskManagerService.findTaskById('updateSystem') !== null);

  constructor() {
    effect(async () => {
      const tasks: Task[] = this.taskManagerService.tasks();
      if (!this.firstRun) {
        this.logger.trace('Tasks changed, refreshing system statuses');
        const allPromises: Promise<void>[] = this.refreshStatuses();
        await Promise.all(allPromises);
        this.cdr.markForCheck();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.logger.debug('Initializing SystemStatusComponent');
    this.loadingService.loadingOn();

    const initPromises: Promise<void>[] = this.refreshStatuses();
    await Promise.all(initPromises);

    this.cdr.markForCheck();
    this.loadingService.loadingOff();
    this.firstRun = false;
    this.logger.debug('Done initializing SystemStatusComponent');
  }

  /**
   * Refresh the system statuses.
   * @returns An array of promises that will be resolved when the statuses are refreshed.
   */
  private refreshStatuses(): Promise<void>[] {
    this.pacFiles.set([]);
    this.updates.set([]);

    return [
      this.getPacFiles(),
      this.checkSystemUpdate('checkupdates --nocolor', 'repo'),
      this.checkSystemUpdate('paru -Qua', 'aur'),
      this.checkLastUpdate(),
    ];
  }

  /**
   * Get a list of pacfiles to check and merge.
   */
  private async getPacFiles(): Promise<void> {
    const cmd = 'pacdiff -o';
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

    if (result.code === 0) {
      if (result.stdout.trim() === '') return;

      this.pacFiles.set(result.stdout.trim().split('\n') ?? []);
      this.logger.trace(`Pacfiles: ${this.pacFiles().join(', ')}`);
    } else {
      this.logger.error(`Failed to get pacfiles: ${result.stderr}`);
    }
  }

  /**
   * Check for system updates, either from the repo or AUR.
   * @param cmd The command to run to check for updates.
   * @param type The type of updates to check for.
   */
  private async checkSystemUpdate(cmd: string, type: UpdateStatusOption): Promise<void> {
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();
    const updateString: UpdateType = type === 'repo' ? 'Updates' : 'AUR updates';

    if (result.code === 0) {
      const updates: string[] = result.stdout.trim().split('\n') ?? [];
      for (const update of updates) {
        this.logger.trace(`${updateString}: ${update}`);

        const [pkg, version, invalid, newVersion] = update.split(' ');
        this.updates.update((updates: SystemUpdate[]) => {
          updates.push({ pkg, version, newVersion: newVersion, aur: type === 'aur' });
          return updates;
        });
      }
    } else if ((type === 'repo' && result.code === 2) || (type === 'aur' && result.code === 1)) {
      this.logger.info(`No ${updateString.toLowerCase()} available`);
    } else {
      this.logger.error(`Failed to get ${updateString.toLowerCase()}: ${result.stderr}`);
    }
  }

  /**
   * Schedule a system update, confirming with the user first. If confirmed, schedule the update.
   * @param confirmed Whether the user has confirmed the update.
   */
  scheduleUpdates(confirmed = false): void {
    if (!confirmed) {
      this.dialogVisible.set(true);
      return;
    }

    if (this.updates().length > 0 && this.updates().some((update: SystemUpdate) => !update.aur)) {
      const task: Task = this.taskManagerService.createTask(
        0,
        'updateSystem',
        true,
        'maintenance.updateSystem',
        'pi pi-refresh',
        'GARUDA_UPDATE_RANI=1 garuda-update --skip-mirrorlist --noconfirm',
      );
      this.taskManagerService.scheduleTask(task);
    }

    this.dialogVisible.set(false);
  }

  /**
   * Check the last update time.
   */
  private async checkLastUpdate(): Promise<void> {
    const cmd = 'awk \'END{sub(/\\[/,""); print $1}\' /var/log/pacman.log';
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

    if (result.code === 0) {
      const date = new Date(result.stdout.trim().replace(']', ''));
      this.logger.info(`Last update: ${date.toISOString()}`);

      if (date < new Date(new Date().setDate(new Date().getDate() - 14))) {
        this.logger.warn('Last update was more than two week ago');
        this.warnUpdate.set(true);
      }
    } else {
      this.logger.error(`Failed to get last update: ${result.stderr}`);
    }
  }

  rebootNow(confirmed = false) {
    if (!confirmed) {
      this.rebootDialogVisible.set(true);
      return;
    }

    void this.taskManagerService.executeAndWaitBash('systemctl reboot');
  }
}
