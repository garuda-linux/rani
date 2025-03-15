import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Signal,
  ViewChild,
} from '@angular/core';
import { Button } from 'primeng/button';
import { ChildProcess } from '@tauri-apps/plugin-shell';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { CatppuccinXtermJs } from '../theme';
import { ITerminalOptions } from '@xterm/xterm';
import { clear, writeText } from 'tauri-plugin-clipboard-api';
import { MessageToastService } from '@garudalinux/core';
import { GarudaBin } from '../privatebin/privatebin';
import { NgTerminal, NgTerminalModule } from 'ng-terminal';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { ConfigService } from '../config/config.service';
import { Logger } from '../logging/logging';
import { WebglAddon } from '@xterm/addon-webgl';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { TaskManagerService } from '../task-manager/task-manager.service';

@Component({
  selector: 'app-diagnostics',
  imports: [Button, TranslocoDirective, NgTerminalModule],
  templateUrl: './diagnostics.component.html',
  styleUrl: './diagnostics.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosticsComponent implements AfterViewInit {
  private outputCache = '';

  @ViewChild('term', { static: false }) term!: NgTerminal;

  private readonly configService = inject(ConfigService);
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();
  private readonly messageToastService = inject(MessageToastService);
  private readonly translocoService = inject(TranslocoService);
  private readonly taskManagerService = inject(TaskManagerService);
  private readonly garudaBin = new GarudaBin();

  readonly xtermOptions: Signal<ITerminalOptions> = computed(() => {
    return {
      disableStdin: false,
      scrollback: 10000,
      convertEol: true,
      theme: this.configService.settings().darkMode ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light,
    };
  });

  constructor() {
    effect(() => {
      const darkMode: boolean = this.configService.settings().darkMode;
      if (this.term?.underlying) {
        this.term.underlying.options.theme = darkMode ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light;
      }
      this.logger.trace('Terminal theme switched via effect');
    });

    this.logger.debug('Diagnostics component initialized');
  }

  ngAfterViewInit(): void {
    this.term.underlying?.loadAddon(new WebglAddon());
    this.term.underlying?.loadAddon(new WebLinksAddon());
  }

  /**
   * Get the full logs for the system and copy them to the clipboard.
   */
  async getFullLogs(): Promise<void> {
    this.logger.debug('Getting full logs');
    this.loadingService.loadingOn();

    let cmd = '';
    for (const type of ['inxi', 'systemd-analyze', 'journalctl', 'pacman-log', 'dmesg']) {
      const command = this.getCommand(type);
      if (!command) {
        this.logger.error(`Failed to get command for ${type}`);
        continue;
      }

      cmd += `echo "### ${type} ###"; ${command.cmd}; echo "### END ${command.cmd} ###"; echo`;
    }

    const result: ChildProcess<string> = await this.taskManagerService.executeAndWaitBash(`pkexec sh -c '${cmd}'`);
    await this.processResult(result);
  }

  /**
   * Upload the output to PrivateBin and copy the URL to the clipboard.
   */
  async uploadPrivateBin() {
    this.logger.trace('Uploading buffer to PrivateBin');
    this.loadingService.loadingOn();

    const url: string = await this.garudaBin.sendText(this.outputCache);
    this.logger.info(`Uploaded to ${url}`);

    void writeText(url);
    this.messageToastService.info(
      this.translocoService.translate('diagnostics.success'),
      this.translocoService.translate('diagnostics.uploadSuccess'),
    );

    this.loadingService.loadingOff();
  }

  /**
   * Get the output for the specified type of diagnostic.
   * @param type The type of diagnostic to get the output for.
   */
  async getOutput(type: string): Promise<void> {
    this.logger.debug(`Getting output for ${type}`);

    this.loadingService.loadingOn();
    try {
      const command = this.getCommand(type);
      if (!command) {
        this.messageToastService.error(
          this.translocoService.translate('diagnostics.failedCmdHeader'),
          this.translocoService.translate('diagnostics.failedCmd'),
        );
        return;
      }

      this.logger.trace(`Getting output for ${type}`);
      const result: ChildProcess<string> = await this.executeCommand(command.cmd, command.sudo);
      await this.processResult(result);
    } catch (err: any) {
      this.logger.trace(`Error getting output for ${type}: ${err}`);
    }

    this.logger.trace(`Done getting output for ${type}`);
    this.loadingService.loadingOff();
  }

  /**
   * Process the result of the command execution.
   * @param result The result of the command execution
   * @private
   */
  private async processResult(result: ChildProcess<string>): Promise<void> {
    if (result.code === 0) {
      this.logger.trace('Writing to clear terminal and buffer');
      this.term.underlying?.clear();
      this.term.write(result.stdout);

      this.outputCache = result.stdout;

      if (this.configService.settings().copyDiagnostics) {
        this.logger.trace('Writing to clipboard');
        await clear();
        await writeText(result.stdout);
        this.messageToastService.info(
          this.translocoService.translate('diagnostics.copySuccess'),
          this.translocoService.translate('diagnostics.copied'),
        );
      }
    } else {
      this.messageToastService.error(this.translocoService.translate('diagnostics.failedCmdHeader'), result.stderr);
      this.logger.error(`Error collecting output: ${result.stderr}`);
    }
  }

  /**
   * Assemble the command to be executed, optionally with sudo and prompting for the password if needed.
   * @param command The command to be executed.
   * @param needsSudo Whether the command needs to be run with sudo.
   */
  private async executeCommand(command: string, needsSudo = false): Promise<ChildProcess<string>> {
    if (needsSudo) {
      return await this.taskManagerService.executeAndWaitBash(`pkexec ${command}`);
    } else {
      return await this.taskManagerService.executeAndWaitBash(command);
    }
  }

  /**
   * Get the command to be executed based on the type of diagnostic.
   * @param command The type of diagnostic to get the command for.
   * @private
   */
  private getCommand(command: string): { sudo: boolean; cmd: string } | null {
    const result = { sudo: false, cmd: '' };

    switch (command) {
      case 'inxi':
        result.cmd = 'garuda-inxi';
        break;
      case 'systemd-analyze':
        result.cmd = 'systemd-analyze blame --no-pager && systemd-analyze critical-chain --no-pager';
        break;
      case 'journalctl':
        result.cmd = 'journalctl -xe --no-pager';
        result.sudo = true;
        break;
      case 'pacman':
        result.cmd = "tac /var/log/pacman.log | awk '!flag; /PACMAN.*pacman/{flag = 1};' | tac";
        break;
      case 'dmesg':
        result.cmd = 'dmesg';
        result.sudo = true;
        break;
      default:
        this.logger.error('Invalid type');
        return null;
    }

    return result;
  }
}
