import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ITerminalOptions } from '@xterm/xterm';
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
import { Logger } from '../logging/logging';
import { WebglAddon } from '@xterm/addon-webgl';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { ConfigService } from '../config/config.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'rani-terminal',
  imports: [CommonModule, NgTerminalModule, TranslocoDirective, Dialog, ProgressBar, Card, Popover, ScrollPanel],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalComponent implements AfterViewInit, OnDestroy {
  progressTracker = signal<any | null>(null);
  visible = signal<boolean>(false);

  operationManager = inject(OperationManagerService);
  subscriptions: Subscription[] = [];

  @ViewChild('dialog', { static: false }) dialog!: Dialog;
  @ViewChild('term', { static: false }) term!: NgTerminal;

  private readonly configService = inject(ConfigService);
  readonly xtermOptions: ITerminalOptions = {
    disableStdin: false,
    scrollback: 10000,
    convertEol: true,
    theme: this.configService.settings().darkMode ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light,
  };
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = Logger.getInstance();
  private readonly messageToastService = inject(MessageToastService);
  private readonly translocoService = inject(TranslocoService);

  constructor() {
    effect(() => {
      const darkMode = this.configService.settings().darkMode;
      if (this.term?.underlying) {
        this.term.underlying.options.theme = darkMode ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light;
      }
      this.cdr.markForCheck();
      this.logger.trace('Terminal theme switched via effect');
    });
    effect(() => {
      const progress = this.operationManager.currentAction();
      if (progress && progress.match(/\(\d\/\d\)/)) {
        const [current, total] = progress.match(/\d+/g)!.map((x) => parseInt(x, 10));
        this.progressTracker.set((current / total) * 100);
      } else if (!progress) {
        this.progressTracker.set(null);
      }
      this.cdr.markForCheck();
    });
    effect(() => {
      const visible: boolean = this.operationManager.showTerminal();
      this.logger.trace(`Setting terminal visibility on terminal to ${visible} via effect`);
      this.visible.set(visible);
      this.cdr.markForCheck();
    });
    effect(() => {
      const visible: boolean = this.visible();
      this.logger.trace(`Setting terminal visibility on manager to ${visible} via effect`);
      this.operationManager.showTerminal.set(visible);
      this.cdr.markForCheck();
    });
  }

  async ngAfterViewInit() {
    this.logger.debug('Terminal component initialized');
    await this.loadXterm();

    this.logger.trace('Subscribing to terminal output/clear emitter');
    this.subscriptions.push(
      this.operationManager.operationOutputEmitter.subscribe((output: string) => {
        this.term.write(output);
      }),
    );
    this.subscriptions.push(
      this.operationManager.operationNewEmitter.subscribe((output: string) => {
        this.logger.trace(`Entered new stage ${output}, clearing terminal output`);
        this.term.underlying?.clear();
      }),
    );

    this.subscriptions.push(
      this.dialog.onHide.subscribe(() => {
        this.logger.trace('Terminal dialog hidden, clearing terminal output');
        this.term.underlying?.clear();
      }),
    );

    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    if (!this.operationManager.pending().find((op) => op.status === 'running')) {
      this.logger.trace('Terminal component destroyed, clearing terminal output as no pending operations');
      this.operationManager.operationOutput.set(null);
    }

    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }

    this.operationManager.showTerminal.set(false);
    this.logger.trace(
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
      this.logger.trace('Showing operation logs, clearing terminal output');
      this.term.underlying?.clear();
      this.operationManager.operationOutput.set(operation.output);
      this.term.write(this.operationManager.operationOutput()!);
    } else if (opIsRunning) {
      this.logger.trace('Operation is running, cannot show logs');
      this.messageToastService.warn('Warning', this.translocoService.translate('terminal.opRunning'));
    } else if (generalOpRunning) {
      this.logger.trace('General operation is running, cannot show logs');
      this.messageToastService.warn('Warning', this.translocoService.translate('terminal.outputExists'));
      return;
    } else if (!operation.hasOutput || !operation.output || operation.status === 'pending') {
      this.logger.trace('Operation has no output, cannot show logs');
      this.messageToastService.warn('Warning', this.translocoService.translate('terminal.noOutput'));
      return;
    }

    this.cdr.markForCheck();
  }

  /**
   * Remove an operation from the pending operations list.
   * @param operation The operation to remove
   */
  removeOperation(operation: Operation) {
    this.operationManager.removeFromPending(operation);
    this.cdr.markForCheck();
  }

  /**
   * Load the xterm terminal into the terminal div, and set up the terminal.
   */
  private async loadXterm(): Promise<void> {
    this.term.underlying?.loadAddon(new WebglAddon());
    this.term.underlying?.loadAddon(new WebLinksAddon());

    if (this.operationManager.operationOutput()) {
      this.term.underlying?.clear();
      this.logger.trace('Terminal output cleared, now writing to terminal');
      this.term.write(this.operationManager.operationOutput()!);
    }
  }
}
