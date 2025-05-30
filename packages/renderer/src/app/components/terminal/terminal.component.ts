import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  type OnDestroy,
  type OnInit,
  signal,
  type Signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ITerminalOptions } from '@xterm/xterm';
import { CatppuccinXtermJs } from '../../theme';
import { type NgTerminal, NgTerminalModule } from 'ng-terminal';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Dialog } from 'primeng/dialog';
import { ProgressBar } from 'primeng/progressbar';
import { Card } from 'primeng/card';
import { ScrollPanel } from 'primeng/scrollpanel';
import { Logger } from '../logging/logging';
import { WebglAddon } from '@xterm/addon-webgl';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { ConfigService } from '../config/config.service';
import { Subscription } from 'rxjs';
import { TaskManagerService } from '../task-manager/task-manager.service';
import { clear, writeText } from '../electron-services';
import { MessageToastService } from '@garudalinux/core';
import { GarudaBin } from '../privatebin/privatebin';
import { LoadingService } from '../loading-indicator/loading-indicator.service';

@Component({
  selector: 'rani-terminal',
  imports: [
    CommonModule,
    NgTerminalModule,
    TranslocoDirective,
    Dialog,
    ProgressBar,
    Card,
    ScrollPanel,
  ],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalComponent implements OnInit, AfterViewInit, OnDestroy {
  public visible = signal<boolean>(false);
  private subscriptions: Subscription[] = [];

  @ViewChild('dialog', { static: false }) dialog!: Dialog;
  @ViewChild('term', { static: false }) term!: NgTerminal;

  protected readonly taskManagerService = inject(TaskManagerService);
  private readonly configService = inject(ConfigService);
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();
  private readonly messageToastService = inject(MessageToastService);
  private readonly translocoService = inject(TranslocoService);

  readonly progressTracker = computed(() => {
    const progress = this.taskManagerService.progress();
    if (progress === null) {
      return null;
    }
    return ((progress / this.taskManagerService.count()) * 100).toPrecision(1);
  });
  readonly xtermOptions: Signal<ITerminalOptions> = computed(() => {
    return {
      disableStdin: false,
      scrollback: 10000,
      convertEol: true,
      theme: this.configService.settings().darkMode
        ? CatppuccinXtermJs.dark
        : CatppuccinXtermJs.light,
    };
  });

  constructor() {
    effect(() => {
      const darkMode = this.configService.settings().darkMode;
      if (this.term?.underlying) {
        this.term.underlying.options.theme = darkMode
          ? CatppuccinXtermJs.dark
          : CatppuccinXtermJs.light;
      }
      this.logger.trace('Terminal theme switched via effect');
    });
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.taskManagerService.events.subscribe((output: string) => {
        if (output === 'show') this.visible.set(true);
        else if (output === 'hide') this.visible.set(false);
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
        if (output === 'clear') this.term.underlying?.clear();
      }),
    );
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }

  @HostListener('keydown', ['$event'])
  respondToKeydown(event: KeyboardEvent) {
    if (event.ctrlKey) {
      switch (event.key) {
        case 'q':
          this.visible.set(false);
          break;
        case 'c':
          void this.copyToClipboard();
          break;
        case 'x':
          this.clearCache();
          break;
        case 'e':
          void this.taskManagerService.executeTasks();
          break;
        case 's':
          void this.uploadLog();
      }
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

  /**
   * Copy the current terminal output to the clipboard.
   */
  async copyToClipboard() {
    await clear();
    await writeText(this.taskManagerService.cachedData());

    this.messageToastService.success(
      this.translocoService.translate('terminal.copyToClipboardTitle'),
      this.translocoService.translate('terminal.copyToClipboard'),
    );
  }

  /**
   * Clear the cached terminal output.
   */
  clearCache() {
    this.taskManagerService.cachedData.set('');
    this.messageToastService.success(
      this.translocoService.translate('terminal.clearCachedDataTitle'),
      this.translocoService.translate('terminal.clearCachedData'),
    );
  }

  /**
   * Upload the current terminal output to PrivateBin and copy the URL to the clipboard.
   */
  async uploadLog() {
    this.logger.trace('Uploading output to PrivateBin');
    this.loadingService.loadingOn();

    const garudaBin = new GarudaBin();
    const url: string = await garudaBin.sendText(
      this.taskManagerService.cachedData(),
    );
    this.logger.info(`Uploaded to ${url}`);

    void writeText(url);
    this.messageToastService.info(
      this.translocoService.translate('diagnostics.success'),
      this.translocoService.translate('diagnostics.uploadSuccess'),
    );

    this.loadingService.loadingOff();
  }
}
