import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  ViewChild,
} from '@angular/core';
import { Button } from 'primeng/button';
import { ChildProcess, Command } from '@tauri-apps/plugin-shell';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { CatppuccinXtermJs } from '../theme';
import { ITerminalOptions } from '@xterm/xterm';
import { clear, writeText } from 'tauri-plugin-clipboard-api';
import { MessageToastService } from '@garudalinux/core';
import { GarudaBin } from '../privatebin/privatebin';
import { NgTerminal, NgTerminalModule } from 'ng-terminal';
import { PrivilegeManagerService } from '../privilege-manager/privilege-manager.service';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { ConfigService } from '../config/config.service';
import { Logger } from '../logging/logging';
import { WebglAddon } from '@xterm/addon-webgl';
import { WebLinksAddon } from '@xterm/addon-web-links';

@Component({
  selector: 'app-diagnostics',
  imports: [Button, TranslocoDirective, NgTerminalModule],
  templateUrl: './diagnostics.component.html',
  styleUrl: './diagnostics.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosticsComponent implements AfterViewInit {
  @ViewChild('term', { static: false }) term!: NgTerminal;

  private readonly configService = inject(ConfigService);
  readonly xtermOptions: ITerminalOptions = {
    disableStdin: false,
    scrollback: 10000,
    convertEol: true,
    theme: this.configService.settings().darkMode ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light,
  };

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();
  private readonly messageToastService = inject(MessageToastService);
  private readonly privilegeManager = inject(PrivilegeManagerService);
  private readonly translocoService = inject(TranslocoService);
  private readonly garudaBin = new GarudaBin();
  private outputCache = '';

  constructor() {
    effect(() => {
      const darkMode = this.configService.settings().darkMode;
      if (this.term?.underlying) {
        this.term.underlying.options.theme = darkMode ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light;
      }
      this.cdr.markForCheck();
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

    for (const type of ['inxi', 'systemd-analyze', 'journalctl', 'pacman-log', 'dmesg']) {
      await this.getOutput(type, true);
    }

    if (this.configService.settings().copyDiagnostics) {
      await writeText(this.outputCache);
      this.messageToastService.info(
        this.translocoService.translate('diagnostics.copySuccess'),
        this.translocoService.translate('diagnostics.copied'),
      );
    }
  }

  /**
   * Upload the output to PrivateBin and copy the URL to the clipboard.
   */
  async uploadPrivateBin() {
    this.logger.trace('Uploading buffer to PrivateBin');

    this.loadingService.loadingOn();
    const url = await this.garudaBin.sendText(this.outputCache);
    this.logger.info(`Uploaded to ${url}`);

    void writeText(url);
    this.loadingService.loadingOff();
    this.messageToastService.info('Success', 'URL copied to clipboard');
  }

  /**
   * Get the output for the specified type of diagnostic.
   * @param type The type of diagnostic to get the output for.
   * @param writeToBuffer Whether to write the output to the buffer, appending to the existing content.
   */
  async getOutput(type: string, writeToBuffer = false): Promise<void> {
    this.logger.debug(`Getting output for ${type}`);

    this.loadingService.loadingOn();
    try {
      let cmd: string;
      let sudo = false;

      switch (type) {
        case 'inxi':
          cmd = 'garuda-inxi';
          break;
        case 'systemd-analyze':
          cmd = 'systemd-analyze blame --no-pager && systemd-analyze critical-chain --no-pager';
          break;
        case 'journalctl':
          cmd = 'journalctl -xe --no-pager';
          sudo = true;
          break;
        case 'pacman':
          cmd = "tac /var/log/pacman.log | awk '!flag; /PACMAN.*pacman/{flag = 1};' | tac ";
          break;
        case 'dmesg':
          cmd = 'dmesg';
          sudo = true;
          break;
        default:
          this.logger.error('Invalid type');
          return;
      }

      this.logger.trace(`Getting output for ${type}`);
      const result: ChildProcess<string> = await this.getCommand(cmd!, sudo);
      await this.processResult(result, writeToBuffer);
    } catch (err: any) {
      this.logger.trace(`Error getting output for ${type}: ${err}`);
    }

    this.logger.trace(`Done getting output for ${type}`);
    this.cdr.markForCheck();
    this.loadingService.loadingOff();
  }

  /**
   * Process the result of the command execution.
   * @param result The result of the command execution
   * @param writeToBuffer Whether to write the output to the buffer, appending to the existing content.
   * @private
   */
  private async processResult(result: ChildProcess<string>, writeToBuffer = false): Promise<void> {
    if (result.code === 0) {
      if (writeToBuffer) {
        this.logger.trace('Appending to terminal and buffer');
        this.outputCache += `\n\n\n${result.stdout}`;
        this.term.write(`\n\n\n${result.stdout}`);
      } else {
        this.logger.trace('Writing to clear terminal and buffer');
        this.term.underlying?.clear();
        this.outputCache = result.stdout;
        this.term.write(result.stdout);
      }

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
      this.messageToastService.error('Error collecting output', result.stderr);
      this.logger.error(`Error collecting output: ${result.stderr}`);
    }
  }

  /**
   * Assemble the command to be executed, optionally with sudo and prompting for the password if needed.
   * @param command The command to be executed.
   * @param needsSudo Whether the command needs to be run with sudo.
   */
  private async getCommand(command: string, needsSudo = false): Promise<ChildProcess<string>> {
    if (needsSudo) {
      return await this.privilegeManager.executeCommandAsSudo(command);
    } else {
      return Command.create('exec-bash', ['-c', command]).execute();
    }
  }
}
