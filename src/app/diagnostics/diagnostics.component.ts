import { Component, effect, inject, ViewChild } from '@angular/core';
import { Button } from 'primeng/button';
import { AppService } from '../app.service';
import { error, info, trace } from '@tauri-apps/plugin-log';
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

@Component({
  selector: 'app-diagnostics',
  imports: [Button, TranslocoDirective, NgTerminalModule],
  templateUrl: './diagnostics.component.html',
  styleUrl: './diagnostics.component.css',
})
export class DiagnosticsComponent {
  @ViewChild('term', { static: false }) term!: NgTerminal;

  private readonly appService = inject(AppService);
  readonly xtermOptions: ITerminalOptions = {
    disableStdin: false,
    scrollback: 10000,
    convertEol: true,
    theme: this.appService.themeHandler.darkMode() ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light,
  };

  private readonly configService = inject(ConfigService);
  private readonly loadingService = inject(LoadingService);
  private readonly messageToastService = inject(MessageToastService);
  private readonly privilegeManager = inject(PrivilegeManagerService);
  private readonly translocoService = inject(TranslocoService);
  private readonly garudaBin = new GarudaBin();
  private outputCache = '';

  constructor() {
    effect(() => {
      const darkMode = this.appService.themeHandler.darkMode();
      if (this.term?.underlying) {
        this.term.underlying.options.theme = darkMode ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light;
      }
      void trace('Terminal theme switched via effect');
    });
  }

  async getFullLogs() {
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
    this.loadingService.loadingOn();
    const url = await this.garudaBin.sendText(this.outputCache);
    void info(`Uploaded to ${url}`);

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
          void error('Invalid type');
          return;
      }

      void trace(`Getting output for ${type}`);
      const result: ChildProcess<string> = await this.getCommand(cmd!, sudo);
      await this.processResult(result, writeToBuffer);
    } catch (err: any) {
      void trace(`Error getting output for ${type}: ${err}`);
    }

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
        void trace('Appending to terminal and buffer');
        this.outputCache += `\n\n\n${result.stdout}`;
        this.term.write(`\n\n\n${result.stdout}`);
      } else {
        void trace('Writing to clear terminal and buffer');
        this.term.underlying?.clear();
        this.outputCache = result.stdout;
        this.term.write(result.stdout);
      }

      if (this.configService.settings().copyDiagnostics) {
        void trace('Writing to clipboard');
        await clear();
        await writeText(result.stdout);
        this.messageToastService.info(
          this.translocoService.translate('diagnostics.copySuccess'),
          this.translocoService.translate('diagnostics.copied'),
        );
      }
    } else {
      this.messageToastService.error('Error collecting output', result.stderr);
      void error(`Error collecting output: ${result.stderr}`);
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
