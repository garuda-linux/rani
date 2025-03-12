import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  Signal,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ITerminalOptions } from '@xterm/xterm';
import { CatppuccinXtermJs } from '../theme';
import { NgTerminal, NgTerminalModule } from 'ng-terminal';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Dialog } from 'primeng/dialog';
import { ProgressBar } from 'primeng/progressbar';
import { MessageToastService } from '@garudalinux/core';
import { Card } from 'primeng/card';
import { Popover } from 'primeng/popover';
import { ScrollPanel } from 'primeng/scrollpanel';
import { Logger } from '../logging/logging';
import { WebglAddon } from '@xterm/addon-webgl';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { ConfigService } from '../config/config.service';
import { Subscription } from 'rxjs';
import { TaskManagerService } from '../task-manager/task-manager.service';

@Component({
  selector: 'rani-terminal',
  imports: [CommonModule, NgTerminalModule, TranslocoDirective, Dialog, ProgressBar, Card, Popover, ScrollPanel],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalComponent implements OnInit, AfterViewInit, OnDestroy {
  subscriptions: Subscription[] = [];

  @ViewChild('dialog', { static: false }) dialog!: Dialog;
  @ViewChild('term', { static: false }) term!: NgTerminal;

  private readonly configService = inject(ConfigService);
  readonly xtermOptions: Signal<ITerminalOptions> = computed(() => {
    return {
      disableStdin: false,
      scrollback: 10000,
      convertEol: true,
      theme: this.configService.settings().darkMode ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light
    };
  });
  readonly visible = signal<boolean>(false);

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = Logger.getInstance();
  protected readonly taskManagerService = inject(TaskManagerService);

  readonly progressTracker = computed(() => {
    const progress = this.taskManagerService.progress();
    if (progress === null) {
      return null;
    }
    return (progress / this.taskManagerService.count()) * 100;
  });

  constructor() {
    effect(() => {
      const darkMode = this.configService.settings().darkMode;
      if (this.term?.underlying) {
        this.term.underlying.options.theme = darkMode ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light;
      }
      this.cdr.markForCheck();
      this.logger.trace('Terminal theme switched via effect');
    });
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.taskManagerService.events.subscribe((output: string) => {
        if (output === 'show')
          this.visible.set(true);
        else if (output === 'hide')
          this.visible.set(false);
      }),
    );
  }

  async ngAfterViewInit() {
    this.logger.debug('Terminal component initialized');
    await this.loadXterm();

    this.logger.trace('Subscribing to terminal output/clear emitter');
    this.subscriptions.push(
      this.taskManagerService.dataEvents.subscribe((output: string) => {
        this.term.write(output);
      }),
    );
    this.subscriptions.push(
      this.taskManagerService.events.subscribe((output: string) => {
        if (output === 'clear')
          this.term.underlying?.clear();
      }),
    );
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }

  /**
   * Load the xterm terminal into the terminal div, and set up the terminal.
   */
  private async loadXterm(): Promise<void> {
    this.term.underlying?.loadAddon(new WebglAddon());
    this.term.underlying?.loadAddon(new WebLinksAddon());
    this.term.underlying?.clear();

    if (this.taskManagerService.data) {
      this.logger.trace('Terminal output cleared, now writing to terminal');
      this.term.write(this.taskManagerService.data);
    }
  }
}
