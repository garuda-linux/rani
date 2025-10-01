import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  signal,
  type Signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ITerminalOptions, ITheme } from '@xterm/xterm';
import { CatppuccinXtermJs } from '../../theme';
import { type NgTerminal, NgTerminalModule } from 'ng-terminal';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Dialog } from 'primeng/dialog';
import { ProgressBar } from 'primeng/progressbar';
import { Card } from 'primeng/card';
import { ScrollPanel } from 'primeng/scrollpanel';
import { Logger } from '../../logging/logging';
import { WebglAddon } from '@xterm/addon-webgl';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { ConfigService } from '../config/config.service';
import { TaskManagerService } from '../task-manager/task-manager.service';
import { clear, writeText } from '../../electron-services';
import { MessageToastService } from '@garudalinux/core';
import { GarudaBin } from '../privatebin/privatebin';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { DesignerService } from '../designer/designerservice';
import { FitAddon } from '@xterm/addon-fit';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// oxlint-disable-next-line no-unused-vars
import { resizePty, sendPtyKeystroke, setPtyDataListener } from '../../electron-services/electron-api-utils';
import { WaResizeObserver } from '@ng-web-apis/resize-observer';
// oxlint-disable-next-line no-unused-vars
import { asyncScheduler } from 'rxjs';
import { WaIntersectionObserver } from '@ng-web-apis/intersection-observer';

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
    WaResizeObserver,
    WaIntersectionObserver,
  ],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalComponent implements AfterViewInit {
  public visible = signal<boolean>(false);

  @ViewChild('dialog', { static: false }) dialog!: Dialog;
  @ViewChild('term', { static: false }) term!: NgTerminal;

  protected readonly taskManagerService = inject(TaskManagerService);
  private readonly configService = inject(ConfigService);
  private readonly designerService = inject(DesignerService);
  private readonly garudaBin = inject(GarudaBin);
  private readonly loadingService = inject(LoadingService);
  private readonly logger = Logger.getInstance();
  private readonly messageToastService = inject(MessageToastService);
  private readonly translocoService = inject(TranslocoService);

  private readonly fitAddon = new FitAddon();

  readonly progressTracker = computed(() => {
    const progress = this.taskManagerService.progress();
    if (progress === null) {
      return null;
    }
    const count = this.taskManagerService.count();
    if (count <= 1) {
      return (progress === 0 ? 0 : 100).toPrecision(1);
    }
    return (((progress - 1) / (count - 1)) * 100).toPrecision(1);
  });
  readonly xtermOptions: Signal<ITerminalOptions> = computed(() => {
    let theme: ITheme = this.configService.settings().darkMode ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light;
    if (this.configService.settings().activeTheme === 'Custom Themedesigner') {
      const isDarkMode = this.configService.settings().darkMode;
      theme = this.designerService.getXtermTheme(isDarkMode);
    }

    this.logger.debug(JSON.stringify(theme, null, 2));

    return {
      disableStdin: false,
      scrollback: 10000,
      convertEol: true,
      theme: theme,
    };
  });

  constructor() {
    effect(() => {
      const darkMode = this.configService.settings().darkMode;
      if (this.term?.underlying) {
        this.term.underlying.options.theme = darkMode ? CatppuccinXtermJs.dark : CatppuccinXtermJs.light;
      }
      this.logger.trace('Terminal theme switched via effect');
    });

    this.logger.trace('Subscribing to terminal output/clear emitter');
    this.taskManagerService.dataEvents.pipe(takeUntilDestroyed()).subscribe((output: string) => {
      this.term.write(output);
    });
    this.taskManagerService.events.pipe(takeUntilDestroyed()).subscribe((output: string) => {
      if (output === 'clear') this.term.underlying?.clear();
    });
    this.taskManagerService.events.pipe(takeUntilDestroyed()).subscribe((output: string) => {
      if (output === 'show') this.visible.set(true);
      else if (output === 'hide') this.visible.set(false);
    });
  }

  ngAfterViewInit() {
    this.logger.debug('Terminal component initialized');
    void this.loadXterm();
  }

  @HostListener('keydown', ['$event'])
  respondToKeydown(event: KeyboardEvent) {
    if (!this.visible()) {
      this.logger.trace('Terminal not visible, ignoring keypress');
      return;
    }

    // Prevent default browser behavior for certain keys
    const forbiddenKeys = ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Enter'];
    if (forbiddenKeys.includes(event.key) || event.ctrlKey) {
      event.preventDefault();
    }

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
    this.fitAddon.activate(this.term.underlying!);
    this.term.underlying?.clear();

    setPtyDataListener((data: string) => {
      this.term.write(data);
      this.logger.trace(`PTY data received: ${data.length} characters`);
    });

    this.term.underlying?.onData(async (data: string) => {
      this.logger.trace(`Terminal input: ${data.length} characters`);
      sendPtyKeystroke(data);
    });

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

    const url: string = await this.garudaBin.sendText(this.taskManagerService.cachedData());
    this.logger.info(`Uploaded to ${url}`);

    void writeText(url);
    this.messageToastService.info(
      this.translocoService.translate('diagnostics.success'),
      this.translocoService.translate('diagnostics.uploadSuccess'),
    );

    this.loadingService.loadingOff();
  }

  /**
   *
   * Handle terminal resize events when the terminal is properly initialized.
   * @param _$event The resize event entries.
   */
  terminalResize(_$event?: readonly ResizeObserverEntry[]): void {
    if (!this.term?.underlying || !this.fitAddon.proposeDimensions()) return;

    this.fitAddon.fit();
    resizePty(this.term.underlying.cols, this.term.underlying.rows);
    this.logger.trace(`Terminal resized to ${this.term.underlying?.cols}x${this.term.underlying?.rows}`);
  }

  /**
   * Handle intersection observer events to determine if the terminal is visible. We can't do it on component
   * load, because the terminal is not visible at that point, and FitAddon will fail to properly size the terminal.
   * @param $event The intersection observer entries.
   */
  onIntersection($event: IntersectionObserverEntry[]): void {
    if ($event[0].isIntersecting) {
      this.logger.trace('Terminal is visible, performing resize');
      asyncScheduler.schedule(() => this.terminalResize(), 500);
    } else {
      this.logger.trace('Terminal is not visible, skipping resize');
    }
  }
}
