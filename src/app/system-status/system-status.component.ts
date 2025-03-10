import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { type ChildProcess, Command, open } from '@tauri-apps/plugin-shell';
import { Logger } from '../logging/logging';
import { OverlayBadge } from 'primeng/overlaybadge';
import { Tooltip } from 'primeng/tooltip';
import { TranslocoDirective } from '@jsverse/transloco';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { TaskManagerService } from '../task-manager/task-manager.service';

@Component({
  selector: 'rani-system-status',
  imports: [OverlayBadge, Tooltip, TranslocoDirective, Dialog, Button],
  templateUrl: './system-status.component.html',
  styleUrl: './system-status.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemStatusComponent {
  dialogVisible = signal<boolean>(false);
  pacdiffDialogVisible = signal<boolean>(false);
  pacFiles: string[] = [];
  updates: { pkg: string; version: string; newVersion: string }[] = [];
  warnUpdate = signal<boolean>(false);

  protected readonly open = open;
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();
  private readonly taskManagerService = inject(TaskManagerService);

  buttonDisabled = computed(
    () => this.taskManagerService.findTaskById('updateSystem') !== null
  );

  constructor() {
    void this.init();
  }

  async init(): Promise<void> {
    this.logger.debug('Initializing SystemStatusComponent');
    this.loadingService.loadingOn();

    const initPromises: Promise<void>[] = [this.getPacFiles(), this.getUpdates(), this.checkLastUpdate()];
    await Promise.all(initPromises);

    this.cdr.markForCheck();
    this.loadingService.loadingOff();
    this.logger.debug('Done initializing SystemStatusComponent');
  }

  /**
   * Get a list of pacfiles to check and merge.
   */
  async getPacFiles(): Promise<void> {
    const cmd = 'pacdiff -o';
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

    if (result.code === 0) {
      if (result.stdout.trim() === '') return;

      this.pacFiles = result.stdout.trim().split('\n') ?? [];
      this.logger.trace(`Pacfiles: ${this.pacFiles.join(', ')}`);
    } else {
      this.logger.error(`Failed to get pacfiles: ${result.stderr}`);
    }
  }

  /**
   * Get a list of available updates.
   */
  async getUpdates(): Promise<void> {
    const cmd = 'checkupdates --nocolor';
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

    if (result.code === 0) {
      const updates: string[] = result.stdout.trim().split('\n') ?? [];
      for (const update of updates) {
        this.logger.trace(`Update: ${update}`);

        let [pkg, version, invalid, newVersion] = update.split(' ');
        this.updates.push({ pkg, version, newVersion: newVersion });
      }
    } else if (result.code === 2) {
      this.logger.info('No updates available');
    } else {
      this.logger.error(`Failed to get updates: ${result.stderr}`);
    }
  }

  scheduleUpdates(confirmed = false): void {
    if (!confirmed) {
      this.dialogVisible.set(true);
      return;
    }

    const task = this.taskManagerService.createTask(0, "updateSystem", true, 'maintenance.updateSystem', 'pi pi-refresh', 'garuda-update --noconfirm');
    this.taskManagerService.scheduleTask(task);

    this.dialogVisible.set(false);
  }

  /**
   * Check the last update time.
   */
  async checkLastUpdate(): Promise<void> {
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
}
