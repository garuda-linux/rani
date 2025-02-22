import { AfterViewInit, Component, effect, inject, input, OnDestroy, signal, ViewChild } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import type { ITerminalOptions } from '@xterm/xterm';
import { AppService } from '../app.service';
import { debug, error, trace } from '@tauri-apps/plugin-log';
import { invoke } from '@tauri-apps/api/core';
import { CatppuccinXtermJs } from '../theme';
import { NgTerminal, NgTerminalModule } from 'ng-terminal';

@Component({
  selector: 'app-terminal',
  imports: [CommonModule, NgTerminalModule],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css',
})
export class TerminalComponent implements AfterViewInit, OnDestroy {
  keysDisabled = input<boolean>(false);
  runPty = input<boolean>(false);
  staticOutput = input<boolean>(false);

  appService = inject(AppService);
  document = inject(DOCUMENT);
  theme = signal<any>({});

  @ViewChild('term', { static: false }) term!: NgTerminal;

  readonly xtermOptions: ITerminalOptions = {
    disableStdin: false,
    scrollback: 10000,
    convertEol: true,
    theme: this.appService.themeHandler.darkMode() ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light,
  };

  constructor() {
    effect(() => {
      const darkMode = this.appService.themeHandler.darkMode();
      if (this.term?.underlying) {
        this.term.underlying.options.theme = darkMode ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light;
      }
      void trace('Terminal theme switched via effect');
    });
  }

  async ngAfterViewInit() {
    await this.loadXterm();

    if (!this.runPty() && !this.staticOutput()) {
      void trace('Subscribing to terminal output/clear emitter');
      this.appService.termOutputEmitter.subscribe((output: string) => {
        this.term.write(output);
      });
      this.appService.termOutputEmitter.subscribe((output: string) => {
        this.term.underlying?.clear();
      });
    } else if (this.staticOutput()) {
      void trace('Not listening to terminal output emitter, static output');
      this.term.underlying?.clear();
    }
  }

  ngOnDestroy() {
    if (!this.appService.pendingOperations().find((op) => op.status === 'running')) {
      void trace('Terminal component destroyed, clearing terminal output as no pending operations');
      this.appService.termOutput = '';
      this.appService.currentAction.set(null);
    }
  }

  /**
   * Load the xterm terminal into the terminal div, and set up the terminal.
   */
  async loadXterm(): Promise<void> {
    if (this.appService.termOutput && !this.staticOutput()) {
      this.term.underlying?.clear();
      this.term.write(this.appService.termOutput);
    }

    if (this.runPty()) {
      void this.initShell();
      this.term.underlying?.onData(this.writeToPty);
      requestAnimationFrame(this.readFromPty.bind(this));
    }
  }

  /**
   * Clear the terminal and write data to the pty shell.
   * @param data The data to write to the pty shell.
   */
  async clearAndWriteToPty(data: string): Promise<unknown> {
    await invoke('async_clear_pty', { data: 'clear\n' });
    return await this.writeToPty(data);
  }

  /**
   * Write data to the pty shell.
   * @param data The data to write to the pty shell.
   */
  async writeToPty(data: string): Promise<unknown> {
    return await invoke('async_write_to_pty', { data });
  }

  /**
   * Read data from the pty shell and write it to the terminal.
   * @private
   */
  private async readFromPty(): Promise<void> {
    void trace('Initiating read from pty');
    const data: string = await invoke<string>('async_read_from_pty');
    if (data) {
      void trace(`Read from pty: ${data}`);
      this.term.write(data);
      this.appService.addTermOutput(data);
    }

    requestAnimationFrame(this.readFromPty.bind(this));
  }

  /**
   * Initialize the shell if it is not already running.
   * @private
   */
  private async initShell(): Promise<void> {
    if (this.appService.ptyRunning()) return;
    void debug('Creating new pty shell');

    try {
      await invoke('async_create_shell');
      this.appService.ptyRunning.set(true);
    } catch (err: any) {
      void error(`Error creating shell: ${err}`);
    }
  }
}
