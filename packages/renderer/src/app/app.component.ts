import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  OnInit,
  signal,
  untracked,
  ViewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { ScrollTop } from 'primeng/scrolltop';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { ContextMenu } from 'primeng/contextmenu';
import { ConfirmationService, type MenuItem } from 'primeng/api';
import { globalKeyHandler } from './key-handler';
import { ShellBarEndDirective, ShellBarStartDirective, ShellComponent } from './components/shell';
import { ProgressSpinner } from 'primeng/progressspinner';
import { LoadingService } from './components/loading-indicator/loading-indicator.service';
import { TerminalComponent } from './components/terminal/terminal.component';
import { OperationManagerComponent } from './components/operation-manager/operation-manager.component';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfigService } from './components/config/config.service';
import { Logger } from './components/logging/logging';
import { TaskManagerService } from './components/task-manager/task-manager.service';
import { NotificationService } from './components/notification/notification.service';
import { ThemeService } from './components/theme-service/theme-service';
import { ElectronShellService } from './components/electron-services';

@Component({
  imports: [
    RouterModule,
    NgOptimizedImage,
    DialogModule,
    ScrollTop,
    ShellComponent,
    DrawerModule,
    TableModule,
    TranslocoDirective,
    ToastModule,
    FormsModule,
    ContextMenu,
    ShellBarStartDirective,
    ShellBarStartDirective,
    ShellComponent,
    ProgressSpinner,
    ShellBarEndDirective,
    TerminalComponent,
    OperationManagerComponent,
    ConfirmDialog,
  ],
  selector: 'rani-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  @ViewChild('terminalComponent') terminalComponent!: TerminalComponent;
  @ViewChild('operationManagerComponent')
  operationManagerComponent!: OperationManagerComponent;

  readonly confirmationService = inject(ConfirmationService);
  readonly loadingService = inject(LoadingService);
  readonly taskManager = inject(TaskManagerService);
  private readonly notificationService = inject(NotificationService);

  protected readonly shellService = inject(ElectronShellService);
  protected readonly appWindow = {
    minimize: () => window.electronAPI?.window.minimize(),
    toggleMaximize: () => window.electronAPI?.window.maximize(),
    close: () => window.electronAPI?.window.requestClose(),
  };

  rightClickMenu = signal<MenuItem[]>([
    {
      label: 'Apply',
      icon: 'pi pi-check',
      command: (event) => this.operationManagerComponent.applyOperations(event),
    },
    {
      label: 'Clear',
      icon: 'pi pi-trash',
      command: (event) => this.operationManagerComponent.clearOperations(event),
    },
    {
      separator: true,
    },
    {
      label: 'Show terminal',
      icon: 'pi pi-hashtag',
      command: () => {
        void this.terminalComponent.visible.set(true);
      },
    },
    {
      separator: true,
    },
    {
      label: 'Exit',
      icon: 'pi pi-times',
      command: () => {
        void window.electronAPI?.window.requestClose();
      },
    },
  ]);

  protected readonly configService = inject(ConfigService);
  protected readonly logger = Logger.getInstance();

  protected readonly hideWindowButtons = computed(() => {
    return this.configService.state().borderlessMaximizedWindow && this.configService.state().isMaximized;
  });
  private readonly themeService = inject(ThemeService);
  private readonly translocoService = inject(TranslocoService);

  menuItems = signal<MenuItem[]>(
    this.setupLabels(this.translocoService.getActiveLang(), [
      {
        icon: 'pi pi-home',
        label: 'Welcome',
        translocoKey: 'menu.welcome',
        routerLink: '/',
      },
      {
        icon: 'pi pi-desktop',
        label: 'Maintenance',
        translocoKey: 'menu.maintenance',
        routerLink: '/maintenance',
      },
      {
        icon: 'pi pi-microchip',
        label: 'System tools',
        translocoKey: 'menu.systemTools',
        routerLink: '/system-tools',
      },
      {
        icon: 'pi pi-play-circle',
        label: 'Gaming apps',
        translocoKey: 'menu.gaming',
        routerLink: '/gaming',
      },
      {
        icon: 'pi pi-hammer',
        label: 'Boot options/repair',
        translocoKey: 'menu.boot',
        routerLink: '/boot-tools',
        // TODO: implement
        visible: false,
      },
      {
        icon: 'pi pi-globe',
        label: 'Network tools',
        translocoKey: 'menu.network',
        routerLink: '/net-tools',
        // TODO: implement
        visible: false,
      },
      {
        icon: 'pi pi-info-circle',
        label: 'Diagnostics',
        translocoKey: 'menu.diagnostics',
        routerLink: '/diagnostics',
      },
      {
        icon: 'pi pi-spinner',
        label: 'Terminal',
        translocoKey: 'menu.terminal',
        command: () => this.terminalComponent.visible.set(true),
      },
      {
        icon: 'pi pi-cog',
        label: 'Settings page',
        translocoKey: 'menu.settings',
        routerLink: '/settings',
      },
      {
        icon: 'pi pi-question-circle',
        label: 'Help',
        translocoKey: 'menu.help.title',
        items: [
          {
            icon: 'pi pi-info-circle',
            label: 'Get help on the forum',
            translocoKey: 'menu.help.getHelpForum',
            command: () => this.shellService.open('https://forum.garudalinux.org/'),
          },
          {
            icon: 'pi pi-info-circle',
            label: 'Search the wiki',
            translocoKey: 'menu.help.getHelpWiki',
            command: () => this.shellService.open('https://wiki.garudalinux.org/'),
          },
          {
            icon: 'pi pi-info-circle',
            label: 'Search the Arch wiki',
            translocoKey: 'menu.help.getHelpArchWiki',
            command: () => this.shellService.open('https://wiki.archlinux.org/'),
          },
          {
            icon: 'pi pi-info-circle',
            label: 'Garuda Linux infra status',
            translocoKey: 'menu.help.garudaStatus',
            command: () => this.shellService.open('https://status.garudalinux.org'),
          },
          {
            icon: 'pi pi-info-circle',
            label: 'About',
            translocoKey: 'menu.help.callExorcist',
            command: () =>
              this.notificationService.sendNotification({
                title: this.translocoService.translate('menu.help.callExorcistTitle'),
                body: `${this.translocoService.translate('menu.help.callExorcistBody')} 🐛`,
              }),
          },
          {
            icon: 'pi pi-info-circle',
            label: 'About',
            translocoKey: 'menu.help.about',
            command: () =>
              this.notificationService.sendNotification({
                title: this.translocoService.translate('menu.help.about'),
                body: this.translocoService.translate('menu.help.aboutBody'),
              }),
          },
        ],
      },
    ]),
  );

  constructor() {
    effect(() => {
      const curItems: MenuItem[] = untracked(this.menuItems);

      const index: number = curItems.findIndex((item) => item['translocoKey'] === 'menu.terminal');
      if (index === -1) return;

      const items: MenuItem[] = [...curItems];

      if (this.taskManager.running()) {
        items[index].icon = 'pi pi-spin pi-spinner';
        items[index].label = this.translocoService.translate('menu.terminalRunning');
        items[index].styleClass = 'garuda-button-shine';
        items[index].badge = undefined;
      } else if (this.taskManager.count() > 0) {
        items[index].icon = 'pi pi-hourglass';
        items[index].label = this.translocoService.translate('menu.terminalTasks');
        items[index].styleClass = 'garuda-button-shine';
      } else {
        items[index].icon = 'pi pi-expand';
        items[index].label = this.translocoService.translate('menu.terminal');
        items[index].badge = undefined;
        items[index].styleClass = '';
      }

      this.menuItems.set(items);
    });
  }

  ngOnInit(): void {
    // Set up global error handling for JSON parsing and network errors
    window.addEventListener('unhandledrejection', (event) => {
      this.logger.error(`Unhandled promise rejection: ${event.reason}`);

      // Handle specific JSON parsing errors
      if (event.reason instanceof SyntaxError && event.reason.message.includes('JSON')) {
        this.logger.error(`JSON parsing error detected: ${event.reason.message}`);
        event.preventDefault();
      }

      // Handle HTTP-related errors
      if (event.reason && typeof event.reason === 'string' && event.reason.includes('HTTP')) {
        this.logger.error(`HTTP error detected: ${event.reason}`);
        event.preventDefault();
      }
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.logger.error(`Global error: ${event.error}`);

      if (event.error instanceof SyntaxError) {
        this.logger.error(`Syntax error (possibly JSON): ${event.error.message}`);
      }
    });

    this.translocoService.events$.subscribe((event) => {
      if (event.type === 'langChanged') {
        this.logger.trace('Updating menu labels via event');
        this.menuItems.update((items: MenuItem[]) => {
          return this.setupLabels(this.translocoService.getActiveLang(), items);
        });
      }
    });

    // Initialize Electron window event listeners
    this.attachElectronListeners();
  }

  /**
   * Handle all relevant keyboard events on the app window. Attaches to the document.
   * @param event The keyboard event
   */
  @HostListener('document:keydown', ['$event'])
  async handleKeyboardEvent(event: KeyboardEvent): Promise<void> {
    const thisBoundKeyHandler = globalKeyHandler.bind(this);
    await thisBoundKeyHandler(event);
  }

  /**
   * Handle right click events on the app window. If the user double clicks, the window is maximized.
   * If the user single clicks, the window is dragged. Attaches to everything but the elements in the noDragSelector.
   * https://github.com/tauri-apps/tauri/issues/1656#issuecomment-1161495124
   * @param event The mouse event
   */
  @HostListener('mousedown', ['$event'])
  async handleRightClick(event: MouseEvent): Promise<void> {
    const noDragSelector =
      'a, button, input, img, span, h1, h2, h3, h4, h5, h6, p-tab, p-card, p-select, p-table, p-dialog, rani-system-status, ng-terminal, rani-languages, rani-locales';
    const target = event.target as HTMLElement;
    if (target.closest(noDragSelector)) return;

    // Left click only
    if (event.buttons === 1) {
      event.detail === 2 ? null : null;
    }
  }

  /**
   * Set up the labels for the menu items with the given language.
   * @param lang The language to set the labels in
   * @param entries The menu items to set the labels for
   * @returns The menu items with the labels set
   */
  setupLabels(lang: string, entries: MenuItem[]): MenuItem[] {
    const newItems: MenuItem[] = [];

    for (const item of entries) {
      const newSubItems: MenuItem[] = [];
      if (item.items) {
        for (const subItem of item.items) {
          newSubItems.push(
            Object.assign({}, subItem, {
              label: this.translocoService.translate(subItem['translocoKey'], {}, lang),
            }),
          );
        }
      }
      newItems.push(
        Object.assign({}, item, {
          label: this.translocoService.translate(item['translocoKey'], {}, lang),
          items: newSubItems,
        }),
      );
    }

    return newItems;
  }

  /**
   * Shutdown the app, saving the settings and closing the window.
   * @private
   */
  private async shutdown(): Promise<void> {
    this.logger.info('Shutting down');
    void window.electronAPI?.window.close();
  }

  /**
   * Attach the Electron listeners for the app window.
   * @private
   */
  private attachElectronListeners() {
    this.logger.trace('Electron window listeners initialized');

    // Handle close events through beforeunload if needed
    window.addEventListener('beforeunload', (event) => {
      if (this.taskManager.running() || this.taskManager.count()) {
        event.preventDefault();
        event.returnValue = '';
        this.requestShutdown();
      }
    });
  }

  /**
   * Close the window
   */
  closeWindow(): void {
    void window.electronAPI?.window.requestClose();
  }

  /**
   * Minimize the window
   */
  minimizeWindow(): void {
    void window.electronAPI?.window.minimize();
  }

  /**
   * Toggle maximize/restore the window
   */
  toggleMaximize(): void {
    void window.electronAPI?.window.maximize();
  }

  /**
   * Request a shutdown of the app. If there are any tasks running, ask the user for confirmation.
   * @protected
   */
  protected async requestShutdown() {
    this.logger.info(`Close requested, ${this.taskManager.currentTask() ? 'one' : 'no'} action is running`);

    if (!this.taskManager.running() && !this.taskManager.count()) {
      void this.shutdown();
      return;
    }

    this.confirmationService.confirm({
      message: this.taskManager.running()
        ? this.translocoService.translate('confirmation.exitAppRunningAction')
        : this.translocoService.translate('confirmation.exitApp'),
      header: this.translocoService.translate('confirmation.exitAppHeader'),
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: 'pi pi-check',
      rejectIcon: 'pi pi-times',
      acceptButtonProps: {
        severity: this.taskManager.running() ? 'danger' : 'success',
        label: this.translocoService.translate('confirmation.accept'),
      },
      rejectButtonProps: {
        severity: 'secondary',
        label: this.translocoService.translate('confirmation.reject'),
      },
      accept: () => {
        void this.shutdown();
      },
    });
  }
}
