import { AfterViewInit, Component, effect, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ITerminalOptions } from '@xterm/xterm';
import { AppService } from '../app.service';
import { debug, trace } from '@tauri-apps/plugin-log';
import { CatppuccinXtermJs } from '../theme';
import { NgTerminal, NgTerminalModule } from 'ng-terminal';
import { OperationManagerService } from '../operation-manager/operation-manager.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Dialog } from 'primeng/dialog';
import { ProgressBar } from 'primeng/progressbar';
import { Operation } from '../operation-manager/interfaces';
import { MessageToastService } from '@garudalinux/core';
import { Card } from 'primeng/card';
import { Popover } from 'primeng/popover';
import { ScrollPanel } from 'primeng/scrollpanel';

@Component({
  selector: 'rani-terminal',
  imports: [CommonModule, NgTerminalModule, TranslocoDirective, Dialog, ProgressBar, Card, Popover, ScrollPanel],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css',
})
export class TerminalComponent implements AfterViewInit, OnDestroy {
  progressTracker = signal<any | null>(null);
  visible = signal<boolean>(false);

  appService = inject(AppService);
  operationManager = inject(OperationManagerService);

  @ViewChild('dialog', { static: false }) dialog!: Dialog;
  @ViewChild('term', { static: false }) term!: NgTerminal;

  readonly xtermOptions: ITerminalOptions = {
    disableStdin: false,
    scrollback: 10000,
    convertEol: true,
    theme: this.appService.themeHandler.darkMode() ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light,
  };
  private readonly messageToastService = inject(MessageToastService);
  private readonly translocoService = inject(TranslocoService);

  constructor() {
    effect(() => {
      const darkMode = this.appService.themeHandler.darkMode();
      if (this.term?.underlying) {
        this.term.underlying.options.theme = darkMode ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light;
      }
      void trace('Terminal theme switched via effect');
    });
    effect(() => {
      const progress = this.operationManager.currentAction();
      if (progress && progress.match(/\(\d\/\d\)/)) {
        const [current, total] = progress.match(/\d+/g)!.map((x) => parseInt(x, 10));
        this.progressTracker.set((current / total) * 100);
      } else if (!progress) {
        this.progressTracker.set(null);
      }
    });
    effect(() => {
      const visible: boolean = this.operationManager.showTerminal();
      void trace(`Setting terminal visibility on terminal to ${visible} via effect`);
      this.visible.set(visible);
    });
    effect(() => {
      const visible: boolean = this.visible();
      void trace(`Setting terminal visibility on manager to ${visible} via effect`);
      this.operationManager.showTerminal.set(visible);
    });
  }

  async ngAfterViewInit() {
    void debug('Terminal component initialized');
    await this.loadXterm();

    void trace('Subscribing to terminal output/clear emitter');
    this.operationManager.operationOutputEmitter.subscribe((output: string) => {
      this.term.write(output);
    });
    this.operationManager.operationNewEmitter.subscribe((output: string) => {
      void trace(`Entered new stage ${output}, clearing terminal output`);
      this.term.underlying?.clear();
    });

    this.dialog.onHide.subscribe(() => {
      void trace('Terminal dialog hidden, clearing terminal output');
      this.term.underlying?.clear();
    });
  }

  ngOnDestroy(): void {
    if (!this.operationManager.pending().find((op) => op.status === 'running')) {
      void trace('Terminal component destroyed, clearing terminal output as no pending operations');
      this.operationManager.operationOutput.set(null);
    }

    this.operationManager.showTerminal.set(false);
    void trace(
      `Unsubscribing from terminal output/clear emitter, set terminal visibility to ${this.operationManager.showTerminal()}`,
    );
  }

  /**
   * Show the terminal with the output of the operation, if available.
   * @param operation The operation to show the output of
   */
  showOperationLogs(operation: Operation): void {
    const opIsRunning: boolean = operation.status === 'running';
    const generalOpRunning: boolean =
      this.operationManager.pending().find((op) => op.status === 'running') !== undefined;

    if (!generalOpRunning && !opIsRunning && operation.status !== 'pending') {
      void trace('Showing operation logs, clearing terminal output');
      this.term.underlying?.clear();
      this.operationManager.operationOutput.set(operation.output);
      this.term.write(this.operationManager.operationOutput()!);
    } else if (opIsRunning) {
      void trace('Operation is running, cannot show logs');
      this.messageToastService.warn('Warning', this.translocoService.translate('terminal.opRunning'));
    } else if (generalOpRunning) {
      void trace('General operation is running, cannot show logs');
      this.messageToastService.warn('Warning', this.translocoService.translate('terminal.outputExists'));
      return;
    } else if (!operation.hasOutput || !operation.output || operation.status === 'pending') {
      void trace('Operation has no output, cannot show logs');
      this.messageToastService.warn('Warning', this.translocoService.translate('terminal.noOutput'));
      return;
    }
  }

  /**
   * Remove an operation from the pending operations list.
   * @param operation The operation to remove
   */
  removeOperation(operation: Operation) {
    this.operationManager.removeFromPending(operation);
  }

  /**
   * Load the xterm terminal into the terminal div, and set up the terminal.
   */
  private async loadXterm(): Promise<void> {
    if (this.operationManager.operationOutput()) {
      this.term.underlying?.clear();
      void trace('Terminal output cleared, now writing to terminal');
      this.term.write(this.operationManager.operationOutput()!);
    }
  }
}
