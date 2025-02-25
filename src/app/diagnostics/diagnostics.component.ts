import { Component, effect, inject, signal, ViewChild } from '@angular/core';
import { Button } from 'primeng/button';
import { AppService } from '../app.service';
import { error, info, trace } from '@tauri-apps/plugin-log';
import { ChildProcess, Command } from '@tauri-apps/plugin-shell';
import { TranslocoDirective } from '@jsverse/transloco';
import { CatppuccinXtermJs } from '../theme';
import { ITerminalOptions } from '@xterm/xterm';
import { clear, writeText } from 'tauri-plugin-clipboard-api';
import { MessageToastService } from '@garudalinux/core';
import { GarudaBin } from '../privatebin/privatebin';
import { ProgressBar } from 'primeng/progressbar';
import { NgTerminal, NgTerminalModule } from 'ng-terminal';

@Component({
  selector: 'app-diagnostics',
  imports: [Button, TranslocoDirective, ProgressBar, NgTerminalModule],
  templateUrl: './diagnostics.component.html',
  styleUrl: './diagnostics.component.css',
})
export class DiagnosticsComponent {
  loading = signal<boolean>(false);

  @ViewChild('term', { static: false }) term!: NgTerminal;

  private readonly appService = inject(AppService);
  readonly xtermOptions: ITerminalOptions = {
    disableStdin: false,
    scrollback: 10000,
    convertEol: true,
    theme: this.appService.themeHandler.darkMode() ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light,
  };
  private readonly messageToastService = inject(MessageToastService);
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

  async getInxi() {
    try {
      this.loading.set(true);
      const cmd = 'garuda-inxi';
      const result: ChildProcess<string> = await (await this.getCommand(cmd)).execute();
      void this.processResult(result);
    } catch (err: any) {
      void trace(`Error running inxi: ${err}`);
    }
  }

  async getSystemdAnalyze() {
    try {
      this.loading.set(true);
      const cmd = 'systemd-analyze blame --no-pager && systemd-analyze critical-chain --no-pager';
      const result: ChildProcess<string> = await (await this.getCommand(cmd)).execute();
      void this.processResult(result);
    } catch (err: any) {
      void trace(`Error running systemd-analyze: ${err}`);
    }
  }

  async processResult(result: ChildProcess<string>): Promise<void> {
    if (result.code === 0) {
      this.outputCache = result.stdout;

      void trace('Writing to terminal');
      this.term.underlying?.clear();
      this.term.write(result.stdout);

      void trace('Writing to clipboard');
      await clear();
      await writeText(result.stdout);

      this.messageToastService.info('Success', 'Output copied to clipboard');
    } else {
      this.messageToastService.error('Error collecting output', result.stderr);
      void error(`Error collecting output: ${result.stderr}`);
    }

    this.loading.set(false);
  }

  async getJournalctl() {
    try {
      this.loading.set(true);
      const cmd = 'journalctl -xe --no-pager';
      const result: ChildProcess<string> = await (await this.getCommand(cmd, true)).execute();
      void this.processResult(result);
    } catch (err: any) {
      void trace(`Error running journalctl: ${err}`);
    }
  }

  async getLastPacmanLog() {
    try {
      this.loading.set(true);
      const cmd = "tac /var/log/pacman.log | awk '!flag; /PACMAN.*pacman/{flag = 1};' | tac ";
      const result: ChildProcess<string> = await (await this.getCommand(cmd)).execute();
      void this.processResult(result);
    } catch (err: any) {
      void trace(`Error receiving pacman logs: ${err}`);
    }
  }

  async getDmesg() {
    try {
      this.loading.set(true);
      const cmd = 'dmesg';
      const result: ChildProcess<string> = await (await this.getCommand(cmd, true)).execute();
      void this.processResult(result);
    } catch (err: any) {
      void trace(`Error running dmesg: ${err}`);
    }
  }

  getFullLogs() {}

  async uploadPrivateBin() {
    this.loading.set(true);
    const url = await this.garudaBin.sendText(this.outputCache);
    void info(`Uploaded to ${url}`);

    void writeText(url);
    this.loading.set(false);
    this.messageToastService.info('Success', 'URL copied to clipboard');
  }

  /**
   * Assemble the command to be executed, optionally with sudo and prompting for the password if needed.
   * @param command The command to be executed.
   * @param needsSudo Whether the command needs to be run with sudo.
   */
  private async getCommand(command: string, needsSudo = false) {
    let cmd: string = command;
    if (needsSudo) {
      await this.appService.getSudoPassword();
      cmd = `echo ${this.appService.sudoPassword()} | sudo -p "" -S bash -c '${cmd}'`;
    }
    void trace(`Assembled command: ${command}`);
    return Command.create('exec-bash', ['-c', cmd]);
  }
}
