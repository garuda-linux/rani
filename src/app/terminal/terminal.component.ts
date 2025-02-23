import { AfterViewInit, Component, effect, inject, input, OnDestroy, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ITerminalOptions } from '@xterm/xterm';
import { AppService } from '../app.service';
import { trace } from '@tauri-apps/plugin-log';
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
  staticOutput = input<boolean>(false);

  appService = inject(AppService);
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

    if (!this.staticOutput()) {
      void trace('Subscribing to terminal output/clear emitter');
      this.appService.termOutputEmitter.subscribe((output: string) => {
        this.term.write(output);
      });
      this.appService.termOutputEmitter.subscribe((output: string) => {
        void trace(`Entered new stage ${output}, clearing terminal output`);
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
  }
}
