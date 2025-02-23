import { Component, inject, model, OnInit, signal } from '@angular/core';
import { debug, error, info, trace } from '@tauri-apps/plugin-log';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { MaintenanceAction, ResettableConfig } from '../interfaces';
import { AppService } from '../app.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { ChildProcess, Command } from '@tauri-apps/plugin-shell';
import { Tooltip } from 'primeng/tooltip';
import { ProgressBar } from 'primeng/progressbar';
import { Checkbox } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { path } from '@tauri-apps/api';

@Component({
  selector: 'app-maintenance',
  imports: [Card, Button, TranslocoDirective, Tooltip, ProgressBar, Checkbox, FormsModule, ConfirmDialog],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.css',
})
export class MaintenanceComponent implements OnInit {
  loading = signal<boolean>(false);
  selectedResetConfigs = model<any[]>([]);

  actions: MaintenanceAction[] = [
    {
      name: 'updateSystem',
      label: 'maintenance.updateSystem',
      description: 'maintenance.updateSystemSub',
      icon: 'pi pi-refresh',
      sudo: true,
      hasOutput: true,
      order: 5,
      command: (): string => {
        void info('Updating system');
        return 'garuda-update --aur --noconfirm';
      },
    },
    {
      name: 'cleanCache',
      label: 'maintenance.cleanCache',
      description: 'maintenance.cleanCacheSub',
      icon: 'pi pi-trash',
      sudo: true,
      hasOutput: true,
      order: 99,
      command: (): string => {
        void info('Cleaning cache');
        return 'paccache -rk0';
      },
    },
    {
      name: 'cleanOrphans',
      label: 'maintenance.clearOrphans',
      description: 'maintenance.clearOrphansSub',
      icon: 'pi pi-trash',
      sudo: true,
      hasOutput: true,
      order: 98,
      command: (): string => {
        void info('Cleaning orphans');
        return 'pacman --noconfirm -Rns $(pacman -Qtdq) || true';
      },
    },
    {
      name: 'refreshMirrors',
      label: 'maintenance.refreshMirrors',
      description: 'maintenance.refreshMirrorsSub',
      icon: 'pi pi-refresh',
      sudo: false,
      hasOutput: false,
      order: 0,
      onlyDirect: true,
      command: async (): Promise<void> => {
        void info('Refreshing mirrors');
        void this.ensurePackageAndRun('reflector-simple');
      },
    },
    {
      name: 'btrfsAssistant',
      label: 'maintenance.btrfsAssistant',
      description: 'maintenance.btrfsAssistantSub',
      icon: 'pi pi-refresh',
      sudo: true,
      hasOutput: false,
      order: 0,
      onlyDirect: true,
      command: async (): Promise<void> => {
        void info('Refreshing mirrors');
        void this.ensurePackageAndRun('btrfs-assistant', 'btrfs-assistant', true);
      },
    },
    {
      name: 'reinstallPackages',
      label: 'maintenance.reinstallPackages',
      description: 'maintenance.reinstallPackagesSub',
      icon: 'pi pi-refresh',
      sudo: true,
      hasOutput: true,
      order: 5,
      command: (): string => {
        void info('Reinstalling packages');
        return 'garuda-update remote reinstall';
      },
    },
    {
      name: 'removeLock',
      label: 'maintenance.removeLock',
      description: 'maintenance.removeLockSub',
      icon: 'pi pi-trash',
      hasOutput: false,
      sudo: true,
      order: 1,
      command: (): string => {
        void info('Removing database lock');
        return 'rm /var/lib/pacman/db.lck || true';
      },
    },
    {
      name: 'Edit repositories',
      label: 'maintenance.editRepos',
      description: 'maintenance.editReposSub',
      icon: 'pi pi-pencil',
      hasOutput: false,
      sudo: false,
      order: 0,
      onlyDirect: true,
      command: async (): Promise<void> => {
        void info('Editing repositories, checking for pace');
        void this.ensurePackageAndRun('pace');
      },
    },
    {
      name: 'updateRemoteFix',
      label: 'maintenance.updateRemoteFix',
      description: 'maintenance.updateRemoteFixSub',
      icon: 'pi pi-pencil',
      hasOutput: false,
      sudo: false,
      order: 0,
      command: (): string => {
        void info('Running remote fix');
        return 'garuda-update remote fix';
      },
    },
    {
      name: 'updateRemoteKeyring',
      label: 'maintenance.updateRemoteKeyring',
      description: 'maintenance.updateRemoteKeyringSub',
      icon: 'pi pi-pencil',
      hasOutput: false,
      sudo: false,
      order: 0,
      command: (): string => {
        void info('Running remote keyring');
        return 'garuda-update remote keyring';
      },
    },
    {
      name: 'updateRemoteFullFix',
      label: 'maintenance.updateRemoteFullFix',
      description: 'maintenance.updateRemoteFullFixSub',
      icon: 'pi pi-pencil',
      hasOutput: false,
      sudo: false,
      order: 0,
      command: (): string => {
        void info('Running remote full fix');
        return 'garuda-update remote fullfix';
      },
    },
    {
      name: 'updateRemoteResetAudio',
      label: 'maintenance.updateRemoteResetAudio',
      description: 'maintenance.updateRemoteResetAudioSub',
      icon: 'pi pi-pencil',
      hasOutput: false,
      sudo: false,
      order: 0,
      command: (): string => {
        void info('Running remote reset audio');
        return 'garuda-update remote reset-audio';
      },
    },
    {
      name: 'updateRemoteResetSnapper',
      label: 'maintenance.updateRemoteResetSnapper',
      description: 'maintenance.updateRemoteResetSnapperSub',
      icon: 'pi pi-pencil',
      hasOutput: false,
      sudo: false,
      order: 0,
      command: (): string => {
        void info('Running remote reset snapper');
        return 'garuda-update remote reset-snapper';
      },
    },
  ];

  resettableConfigs: ResettableConfig[] = [
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
  ];

  readonly appService = inject(AppService);

  async ngOnInit(): Promise<void> {
    void debug('Initializing maintenance');
    await this.checkExistingConfigs();
  }

  async checkExistingConfigs() {
    for (const config of this.resettableConfigs) {
      config.files.some(async (file) => {
        void trace(`Checking file: ${file}`);
        void this.appService.getCommandOutput<string>(`test -e ${file}`, (stdout: string | null) => {
          if (stdout !== null) {
            void trace(`Found existing config: ${file}`);
            config.exists = true;
            return true;
          }
          void trace(`No existing config: ${file}`);
          return false;
        });
      });
    }
    void debug(`Checked existing configs: ${JSON.stringify(this.resettableConfigs)}`);
  }

  /**
   * Reset a configuration file to its default state.
   */
  async resetConfigs(): Promise<void> {
    void debug('Resetting configs');
    this.loading.set(true);
    const homeDir: string = await path.homeDir();

    for (const config of this.selectedResetConfigs()) {
      void trace(`Resetting config: ${config.name}`);
      for (const file of config.files) {
        const cmd: string = `cp -r ${file} ${file.replace('/etc/skel', homeDir)}`;
        void debug(`Running command: ${cmd}`);

        const result: string | null = await this.appService.getCommandOutput<string>(cmd, (stdout: string) => stdout);
        if (result !== null) {
          void info(`Successfully reset ${file}`);
        } else {
          void error(`Failed to reset ${file}`);
          this.appService.messageToastService.error('Error resetting config', `Failed to reset ${file}`);
        }
      }
    }

    this.loading.set(false);
  }

  /**
   * Add a maintenance action to the pending operations.
   * @param action The action to add
   */
  addToPending(action: MaintenanceAction) {
    void debug('Adding to pending');
    if (!this.appService.pendingOperations().find((operation) => operation.name === action.name)) {
      this.appService.pendingOperations().push({
        name: action.name,
        prettyName: action.label,
        order: action.order,
        command: action.command,
        commandArgs: [],
        sudo: action.sudo,
        status: 'pending',
        hasOutput: action.hasOutput,
      });
      action.addedToPending = true;
    } else {
      this.appService.pendingOperations.set(
        this.appService.pendingOperations().filter((operation) => operation.name !== action.name),
      );
      action.addedToPending = false;
    }
  }

  /**
   * Run a maintenance action now, either directly or by adding it to the pending operations.
   * @param action The action to run
   */
  runNow(action: MaintenanceAction) {
    void debug('Running maintenance action now');
    if (action.onlyDirect) {
      void debug('Boom its a direct action');
      void action.command();
      return;
    } else {
      void debug('Adding to pending and executing, clearing pending');
      this.appService.pendingOperations.set([]);
      this.addToPending(action);
      void this.appService.executeOperations();
    }
  }

  /**
   * Ensure a package is installed and run an executable afterward.
   * @param pkg The package to ensure is installed
   * @param executable The executable to run after the package is installed, if the executable differs from the package name
   * @param needsSudo Whether the command needs to be run with sudo
   */
  async ensurePackageAndRun(pkg: string, executable?: string, needsSudo = false): Promise<void> {
    this.loading.set(true);
    const cmd = `pacman -Qq ${pkg}`;

    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();
    if (result.code !== 0) {
      const cmd: string = await this.appService.prepareSudoCommand(`pacman -S --noconfirm ${pkg}`);
      const result: string | null = await this.appService.getCommandOutput<string>(cmd, (stdout: string) => stdout);
      if (result) {
        void info('Installed pace');
      } else {
        void error('Failed to install pace');
        this.appService.messageToastService.error('Error installing dependency', 'Failed to install pace');
      }
    }

    let pkgCmd: string = executable ? executable : pkg;
    if (needsSudo) pkgCmd = await this.appService.prepareSudoCommand(pkgCmd, true);

    // No need to block the main thread here
    void Command.create('exec-bash', ['-c', pkgCmd]).execute();
    this.loading.set(false);
  }

  confirmResetConfigs(event: Event): void {
    this.appService.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure that you want to proceed?',
      header: 'Reset configs',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Save',
        outlined: true,
      },
      accept: () => {
        void this.resetConfigs();
      },
      reject: () => {
        void trace('Rejected resetting configs');
      },
    });
  }
}
