import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, model, OnInit, signal } from '@angular/core';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { MaintenanceAction, ResettableConfig } from '../interfaces';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Tooltip } from 'primeng/tooltip';
import { Checkbox } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { path } from '@tauri-apps/api';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { MessageToastService } from '@garudalinux/core';
import { exists } from '@tauri-apps/plugin-fs';
import { OsInteractService } from '../task-manager/os-interact.service';
import { TaskManagerService } from '../task-manager/task-manager.service';
import { ConfirmationService } from 'primeng/api';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { Logger } from '../logging/logging';
import { ChildProcess } from '@tauri-apps/plugin-shell';

@Component({
  selector: 'app-maintenance',
  imports: [Card, Button, TranslocoDirective, Tooltip, Checkbox, FormsModule, Tab, TabPanels, Tabs, TabList, TabPanel],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceComponent implements OnInit {
  selectedResetConfigs = model<any[]>([]);
  tabIndex = signal<number>(0);

  resettableConfigs = signal<ResettableConfig[]>([
    {
      name: 'Bash',
      description: 'maintenance.resettableConfigs.bash',
      files: ['/etc/skel/.bashrc_garuda', '/etc/skel/autostart/bashrc-setup.desktop'],
    },
    {
      name: 'Fish',
      description: 'maintenance.resettableConfigs.fish',
      files: ['/etc/skel/.config/fish/config.fish'],
    },
    {
      name: 'ZSH',
      description: 'maintenance.resettableConfigs.zsh',
      files: ['/etc/skel/.zshrc'],
    },
    {
      name: 'Kvantum',
      description: 'maintenance.resettableConfigs.kvantum',
      files: ['/etc/skel/.config/Kvantum/kvantum.kvconfig'],
    },
    {
      name: 'Libinput',
      description: 'maintenance.resettableConfigs.libinput',
      files: ['/etc/skel/.config/libinput-gestures.conf'],
    },
    {
      name: 'Bleachbit',
      description: 'maintenance.resettableConfigs.bleachbit',
      files: ['/etc/skel/.config/bleachbit/bleachbit.ini'],
    },
    {
      name: 'LibreOffice',
      description: 'maintenance.resettableConfigs.libreoffice',
      files: ['/etc/skel/.config/libreoffice/4/user/registrymodifications.xcu'],
    },
    {
      name: 'Starship',
      description: 'maintenance.resettableConfigs.starship',
      files: ['/etc/skel/.config/starship.toml'],
    },
    {
      name: 'SMPlayer',
      description: 'maintenance.resettableConfigs.smplayer',
      files: ['/etc/skel/.config/smplayer/smplayer.ini'],
    },
    {
      name: 'VLC',
      description: 'maintenance.resettableConfigs.vlc',
      files: ['/etc/skel/.config/vlc/vlcrc'],
    },
    {
      name: 'Deluge',
      description: 'maintenance.resettableConfigs.deluge',
      files: ['/etc/skel/.config/deluge/gtk3ui.conf'],
    },
    {
      name: 'MPV',
      description: 'maintenance.resettableConfigs.mpv',
      files: ['/etc/skel/.config/mpv/mpv.conf'],
    },
    {
      name: 'Micro',
      description: 'maintenance.resettableConfigs.micro',
      files: ['/etc/skel/.config/micro/settings.json'],
    },
    {
      name: 'Bat',
      description: 'maintenance.resettableConfigs.bat',
      files: ['/etc/skel/.config/bat/config', '/etc/skel/.config/bat/themes'],
    },
    {
      name: 'Environment',
      description: 'maintenance.resettableConfigs.environment',
      files: ['/etc/skel/.config/environment.d/garuda.conf', '/etc/skel/.config/environment.d/firefox.conf'],
    },
    {
      name: 'GTK3/4',
      description: 'maintenance.resettableConfigs.gtk',
      files: ['/etc/skel/.config/gtk-3.0', '/etc/skel/.config/gtk-4.0'],
    },
    {
      name: 'PacSeek',
      description: 'maintenance.resettableConfigs.pacseek',
      files: ['/etc/skel/.config/pacseek/config.json'],
    },
    {
      name: 'Profile sync daemon',
      description: 'maintenance.resettableConfigs.psd',
      files: ['/etc/skel/.config/psd/psd.conf'],
    },
    {
      name: 'KDE settings',
      description: 'maintenance.resettableConfigs.kde',
      files: [
        '/etc/skel/.config/auroraerc',
        '/etc/skel/.config/baloofilerc',
        '/etc/skel/.config/dolphinrc',
        '/etc/skel/.config/katerc',
        '/etc/skel/.config/kcminputrc',
        '/etc/skel/.config/kdeglobals',
        '/etc/skel/.config/konsolerc',
        '/etc/skel/.config/kscreenlockerrc',
        '/etc/skel/.config/kwinrc',
        '/etc/skel/.config/touchpadrc',
        '/etc/skel/.config/yakuakerc',
        '/etc/skel/.local/share/konsole/Garuda.profile',
        '/etc/skel/.local/share/kxmlgui5/dolphin/dolphinui.rc',
      ],
    },
  ]);

  protected readonly taskManager = inject(TaskManagerService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();
  private readonly osInteractService = inject(OsInteractService);

  actionsGarudaUpdate: MaintenanceAction[] = [
    {
      name: 'updateRemoteFix',
      label: 'maintenance.updateRemoteFix',
      description: 'maintenance.updateRemoteFixSub',
      icon: 'pi pi-pencil',
      hasOutput: true,
      sudo: true,
      priority: 5,
      command: (): string => {
        this.logger.info('Running remote fix');
        return 'garuda-update remote fix';
      },
    },
    {
      name: 'updateRemoteKeyring',
      label: 'maintenance.updateRemoteKeyring',
      description: 'maintenance.updateRemoteKeyringSub',
      icon: 'pi pi-pencil',
      hasOutput: true,
      sudo: true,
      priority: 5,
      command: (): string => {
        this.logger.info('Running remote keyring');
        return 'garuda-update remote keyring';
      },
    },
    {
      name: 'updateRemoteFullFix',
      label: 'maintenance.updateRemoteFullFix',
      description: 'maintenance.updateRemoteFullFixSub',
      icon: 'pi pi-pencil',
      hasOutput: true,
      sudo: true,
      priority: 5,
      command: (): string => {
        this.logger.info('Running remote full fix');
        return 'garuda-update remote fullfix';
      },
    },
    {
      name: 'updateRemoteResetAudio',
      label: 'maintenance.updateRemoteResetAudio',
      description: 'maintenance.updateRemoteResetAudioSub',
      icon: 'pi pi-pencil',
      hasOutput: true,
      sudo: true,
      priority: 7,
      command: (): string => {
        this.logger.info('Running remote reset audio');
        return 'garuda-update remote reset-audio';
      },
    },
    {
      name: 'updateRemoteResetSnapper',
      label: 'maintenance.updateRemoteResetSnapper',
      description: 'maintenance.updateRemoteResetSnapperSub',
      icon: 'pi pi-pencil',
      hasOutput: true,
      sudo: true,
      priority: 7,
      command: (): string => {
        this.logger.info('Running remote reset snapper');
        return 'garuda-update remote reset-snapper';
      },
    },
    {
      name: 'reinstallPackages',
      label: 'maintenance.reinstallPackages',
      description: 'maintenance.reinstallPackagesSub',
      icon: 'pi pi-refresh',
      sudo: true,
      hasOutput: true,
      priority: 6,
      command: (): string => {
        this.logger.info('Reinstalling packages');
        return 'garuda-update remote reinstall';
      },
    },
  ];
  actions: MaintenanceAction[] = [
    {
      name: 'updateSystem',
      label: 'maintenance.updateSystem',
      description: 'maintenance.updateSystemSub',
      icon: 'pi pi-refresh',
      sudo: true,
      hasOutput: true,
      priority: 5,
      command: (): string => {
        this.logger.info('Updating system');
        return 'garuda-update --skip-mirrorlist --aur --noconfirm';
      },
    },
    {
      name: 'cleanCache',
      label: 'maintenance.cleanCache',
      description: 'maintenance.cleanCacheSub',
      icon: 'pi pi-trash',
      sudo: true,
      hasOutput: true,
      priority: 99,
      command: (): string => {
        this.logger.info('Cleaning cache');
        return 'paccache -ruk 0';
      },
    },
    {
      name: 'cleanOrphans',
      label: 'maintenance.clearOrphans',
      description: 'maintenance.clearOrphansSub',
      icon: 'pi pi-trash',
      sudo: true,
      hasOutput: true,
      priority: 10,
      command: (): string => {
        this.logger.info('Cleaning orphans');
        return 'pacman --noconfirm -Rns $(pacman -Qtdq)';
      },
    },
    {
      name: 'refreshMirrors',
      label: 'maintenance.refreshMirrors',
      description: 'maintenance.refreshMirrorsSub',
      icon: 'pi pi-refresh',
      sudo: false,
      hasOutput: false,
      priority: 3,
      onlyDirect: true,
      command: async (): Promise<void> => {
        this.logger.info('Refreshing mirrors');
        if (await this.osInteractService.ensurePackageArchlinux('reflector-simple')) {
          void this.taskManager.executeAndWaitBash('reflector-simple');
        }
      },
    },
    {
      name: 'btrfsAssistant',
      label: 'maintenance.btrfsAssistant',
      description: 'maintenance.btrfsAssistantSub',
      icon: 'pi pi-refresh',
      sudo: true,
      hasOutput: false,
      priority: 0,
      onlyDirect: true,
      command: async (): Promise<void> => {
        this.logger.info('Refreshing mirrors');
        if (await this.osInteractService.ensurePackageArchlinux('btrfs-assistant')) {
          void this.taskManager.executeAndWaitBash('/usr/lib/garuda/pkexec-gui btrfs-assistant');
        }
      },
    },
    {
      name: 'removeLock',
      label: 'maintenance.removeLock',
      description: 'maintenance.removeLockSub',
      icon: 'pi pi-trash',
      hasOutput: false,
      sudo: true,
      priority: 0,
      command: (): string => {
        this.logger.info('Removing database lock');
        return 'test -f /var/lib/pacman/db.lck && rm /var/lib/pacman/db.lck && echo "Successfully removed lock" || echo "No lock found"';
      },
    },
    {
      name: 'Edit repositories',
      label: 'maintenance.editRepos',
      description: 'maintenance.editReposSub',
      icon: 'pi pi-pencil',
      hasOutput: false,
      sudo: false,
      priority: 0,
      onlyDirect: true,
      command: async (): Promise<void> => {
        this.logger.info('Editing repositories, checking for pace');
        if (await this.osInteractService.ensurePackageArchlinux('pace')) {
          void this.taskManager.executeAndWaitBash('pace');
        }
      },
    },
  ];

  private readonly messageToastService = inject(MessageToastService);
  private readonly translocoService = inject(TranslocoService);

  async ngOnInit(): Promise<void> {
    this.logger.debug('Initializing maintenance');
    await this.checkExistingConfigs();
  }

  /**
   * Check for existing configuration files for whether they exist.
   */
  async checkExistingConfigs() {
    this.loadingService.loadingOn();
    const promises: Promise<ResettableConfig>[] = [];
    this.logger.debug('Checking existing configs');

    for (const config of this.resettableConfigs()) {
      const promise = new Promise<ResettableConfig>(async (resolve) => {
        for (const file of config.files) {
          this.logger.trace(`Checking ${file}`);
          await exists(file);
          try {
            if (await exists(file)) {
              this.logger.trace(`${file} exists`);
              resolve({ ...config, exists: true });
              return;
            }
          } catch (error) {
            this.logger.trace(`${file} does not exist`);
            resolve({ ...config, exists: false });
          }
        }
        return resolve({ ...config, exists: false });
      });
      promises.push(promise);
    }
    this.resettableConfigs.set(await Promise.all(promises));

    this.loadingService.loadingOff();
    this.logger.debug(`Checked existing configs: ${JSON.stringify(this.resettableConfigs())}`);
  }

  /**
   * Reset a configuration file to its default state.
   */
  async resetConfigs(): Promise<void> {
    this.logger.debug('Resetting configs');
    this.loadingService.loadingOn();
    const homeDir: string = await path.homeDir();

    for (const config of this.selectedResetConfigs()) {
      this.logger.trace(`Resetting config: ${config.name}`);
      for (const file of config.files) {
        const cmd = `cp -r ${file} ${file.replace('/etc/skel', homeDir)}`;
        this.logger.debug(`Running command: ${cmd}`);

        const output: ChildProcess<string> = await this.taskManager.executeAndWaitBash(cmd);
        if (output.code === 0) {
          this.logger.info(`Successfully reset ${file}`);
        } else {
          this.logger.error(`Failed to reset ${file}`);
          this.messageToastService.error(
            this.translocoService.translate('maintenance.failedReset'),
            this.translocoService.translate('maintenance.failedResetFile', { file }),
          );
        }
      }
    }

    this.loadingService.loadingOff();
  }

  /**
   * Add a maintenance action to the pending operations.
   * @param action The action to add
   */
  addToPending(action: MaintenanceAction) {
    const entry = this.taskManager.findTaskById(action.name);

    // Not a thing
    if (action.onlyDirect || action.command.constructor.name === 'AsyncFunction') return;

    if (!entry) {
      this.logger.debug(`Adding ${action.name} to pending`);
      const task = this.taskManager.createTask(
        action.priority,
        action.name,
        action.sudo,
        action.label,
        action.icon,
        (action as any).command(),
      );
      this.taskManager.scheduleTask(task);
    } else {
      this.logger.trace(`Removing ${action.name} from pending`);
      this.taskManager.removeTask(entry);
    }
  }

  /**
   * Run a maintenance action now, either directly or by adding it to the pending operations.
   * @param action The action to run
   */
  runNow(action: MaintenanceAction) {
    this.logger.debug('Running maintenance action now');
    if (action.onlyDirect) {
      this.logger.debug('Boom its a direct action');
      void action.command();
    } else {
      if (this.taskManager.running()) {
        this.messageToastService.error(
          this.translocoService.translate('maintenance.taskRunningHeader'),
          this.translocoService.translate('maintenance.taskRunning'),
        );
        return;
      }
      const task = this.taskManager.createTask(
        action.priority,
        action.name,
        action.sudo,
        action.label,
        action.icon,
        (action as any).command(),
      );
      void this.taskManager.executeTask(task);
      this.taskManager.toggleTerminal(true);
    }
  }

  /**
   * Run a maintenance action now, either directly or by adding it to the pending operations.
   * @param event The event that triggered the action
   */
  confirmResetConfigs(event: Event): void {
    this.logger.trace('Confirming resetting configs');
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.translocoService.translate('confirmation.resetConfigsBody'),
      header: this.translocoService.translate('confirmation.resetConfigsHeader'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        severity: 'danger',
        label: this.translocoService.translate('confirmation.accept'),
      },
      rejectButtonProps: {
        severity: 'secondary',
        label: this.translocoService.translate('confirmation.reject'),
      },
      accept: () => {
        void this.resetConfigs();
      },
    });

    this.cdr.markForCheck();
  }
}
