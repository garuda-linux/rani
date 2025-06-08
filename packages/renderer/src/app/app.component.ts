import type { OnInit } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  signal,
  untracked,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ScrollTop } from 'primeng/scrolltop';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ElectronAppService } from './electron-services';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import type { MenuItem } from 'primeng/api';
import { globalKeyHandler } from './key-handler';
import { ShellBarEndDirective, ShellBarStartDirective, ShellComponent } from './components/shell';
import { ProgressSpinner } from 'primeng/progressspinner';
import { LoadingService } from './components/loading-indicator/loading-indicator.service';
import { TerminalComponent } from './components/terminal/terminal.component';
import { OperationManagerComponent } from './components/operation-manager/operation-manager.component';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfigService } from './components/config/config.service';
import { Logger } from './logging/logging';
import { TaskManagerService } from './components/task-manager/task-manager.service';
import { NotificationService } from './components/notification/notification.service';
import { ThemeService } from './components/theme-service/theme-service';
import {
  ElectronShellService,
  ElectronContextMenuService,
  ElectronAppMenuService,
  type ContextMenuItem,
  type AppMenuItem,
  ElectronOsService,
} from './electron-services';

@Component({
  imports: [
    RouterModule,
    DialogModule,
    ScrollTop,
    ShellComponent,
    DrawerModule,
    TableModule,
    TranslocoDirective,
    ToastModule,
    FormsModule,
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
  private readonly router = inject(Router);
  private readonly electronAppService = inject(ElectronAppService);
  private readonly electronOsService = inject(ElectronOsService);

  protected readonly shellService = inject(ElectronShellService);
  private readonly contextMenuService = inject(ElectronContextMenuService);
  private readonly appMenuService = inject(ElectronAppMenuService);
  protected readonly appWindow = {
    minimize: () => window.electronAPI?.window.minimize(),
    toggleMaximize: () => window.electronAPI?.window.maximize(),
    close: () => window.electronAPI?.window.requestClose(),
  };

  rightClickMenu = signal<ContextMenuItem[]>([
    this.contextMenuService.createMenuItem({
      id: 'apply',
      label: 'Apply',
      icon: 'pi pi-check',
      onClick: () => this.operationManagerComponent.applyOperations(),
    }),
    this.contextMenuService.createMenuItem({
      id: 'clear',
      label: 'Clear',
      icon: 'pi pi-trash',
      onClick: () => this.operationManagerComponent.clearOperations(),
    }),
    this.contextMenuService.createSeparator(),
    this.contextMenuService.createMenuItem({
      id: 'show-terminal',
      label: 'Show terminal',
      icon: 'pi pi-hashtag',
      onClick: () => {
        void this.terminalComponent.visible.set(true);
      },
    }),
    this.contextMenuService.createSeparator(),
    this.contextMenuService.createMenuItem({
      id: 'exit',
      label: 'Exit',
      icon: 'pi pi-times',
      onClick: () => {
        void window.electronAPI?.window.requestClose();
      },
    }),
  ]);

  protected readonly configService = inject(ConfigService);
  protected readonly logger = Logger.getInstance();

  protected readonly hideWindowButtons = computed(() => {
    return this.configService.state().borderlessMaximizedWindow && this.configService.state().isMaximized;
  });
  private readonly themeService = inject(ThemeService);
  private readonly translocoService = inject(TranslocoService);

  readonly moduleItems = [
    {
      id: 'welcome',
      icon: 'pi pi-home',
      label: 'Welcome',
      translocoKey: 'menu.welcome',
      command: () => this.router.navigate(['/']),
    },
    {
      id: 'maintenance',
      icon: 'pi pi-desktop',
      label: 'Maintenance',
      translocoKey: 'menu.maintenance',
      command: () => this.router.navigate(['/maintenance']),
    },
    {
      id: 'system-tools',
      icon: 'pi pi-microchip',
      label: 'System tools',
      translocoKey: 'menu.systemTools',
      command: () => this.router.navigate(['/system-tools']),
    },
    {
      id: 'gaming',
      icon: 'pi pi-play-circle',
      label: 'Gaming apps',
      translocoKey: 'menu.gaming',
      command: () => this.router.navigate(['/gaming']),
    },
    {
      id: 'boot-tools',
      icon: 'pi pi-hammer',
      label: 'Boot options/repair',
      translocoKey: 'menu.boot',
      command: () => this.router.navigate(['/boot-tools']),
      // TODO: implement
      visible: false,
    },
    {
      id: 'network-tools',
      icon: 'pi pi-globe',
      label: 'Network tools',
      translocoKey: 'menu.network',
      command: () => this.router.navigate(['/net-tools']),
      // TODO: implement
      visible: false,
    },
    {
      id: 'diagnostics',
      icon: 'pi pi-info-circle',
      label: 'Diagnostics',
      translocoKey: 'menu.diagnostics',
      command: () => this.router.navigate(['/diagnostics']),
    },
    {
      id: 'terminal',
      icon: 'pi pi-spinner',
      label: 'Terminal',
      translocoKey: 'menu.terminal',
      command: () => this.terminalComponent.visible.set(true),
    },
  ];
  helpItems = [
    {
      id: 'help-forum',
      icon: 'pi pi-info-circle',
      label: 'Get help on the forum',
      translocoKey: 'menu.help.getHelpForum',
      command: () => this.shellService.open('https://forum.garudalinux.org/'),
    },
    {
      id: 'help-wiki',
      icon: 'pi pi-info-circle',
      label: 'Search the wiki',
      translocoKey: 'menu.help.getHelpWiki',
      command: () => this.shellService.open('https://wiki.garudalinux.org/'),
    },
    {
      id: 'help-arch-wiki',
      icon: 'pi pi-info-circle',
      label: 'Search the Arch wiki',
      translocoKey: 'menu.help.getHelpArchWiki',
      command: () => this.shellService.open('https://wiki.archlinux.org/'),
    },
    {
      id: 'help-status',
      icon: 'pi pi-info-circle',
      label: 'Garuda Linux infra status',
      translocoKey: 'menu.help.garudaStatus',
      command: () => this.shellService.open('https://status.garudalinux.org'),
    },
    {
      id: 'help-exorcist',
      icon: 'pi pi-info-circle',
      label: 'About',
      translocoKey: 'menu.help.callExorcist',
      command: () =>
        this.notificationService.sendNotification({
          title: this.translocoService.translate('menu.help.callExorcistTitle'),
          body: `${this.translocoService.translate('menu.help.callExorcistBody')} 🐛`,
        }),
    } as MenuItem,
    {
      id: 'help-about',
      icon: 'pi pi-info-circle',
      label: 'About',
      translocoKey: 'menu.help.about',
      command: () =>
        this.notificationService.sendNotification({
          title: this.translocoService.translate('menu.help.about'),
          body: this.translocoService.translate('menu.help.aboutBody'),
        }),
    },
  ];
  private fileItems = [
    {
      id: 'file-preferences',
      icon: 'pi pi-cog',
      label: 'Preferences',
      translocoKey: 'menu.file.preferences',
      command: () => this.router.navigate(['/settings']),
    },
    {
      id: 'file-quit',
      icon: 'pi pi-sign-out',
      label: 'Quit',
      translocoKey: 'menu.file.quit',
      command: () => {
        this.shutdown();
      },
    },
  ];

  menuItems = signal<MenuItem[]>(
    this.setupLabels(this.translocoService.getActiveLang(), [
      {
        id: 'file',
        icon: 'pi pi-file',
        label: 'File',
        translocoKey: 'menu.file.title',
        items: [...this.fileItems],
      },
      ...this.moduleItems,
      {
        id: 'help',
        icon: 'pi pi-question-circle',
        label: 'Help',
        translocoKey: 'menu.help.title',
        items: [...this.helpItems],
      },
    ]),
  );

  constructor() {
    effect(() => {
      const curItems: MenuItem[] = untracked(this.menuItems);

      const moduleIndex: number = curItems.findIndex(
        (item) => (item as MenuItem & { translocoKey: string }).translocoKey === 'menu.modules.title',
      );
      if (moduleIndex === -1) return;

      const terminalIndex: number =
        curItems[moduleIndex].items?.findIndex(
          (item) => (item as MenuItem & { translocoKey: string }).translocoKey === 'menu.terminal',
        ) ?? -1;
      const index = terminalIndex;
      if (index === -1) return;

      const items: MenuItem[] = [...curItems];
      const moduleItems = [...(items[moduleIndex].items || [])];

      if (this.taskManager.running()) {
        moduleItems[index].icon = 'pi pi-spin pi-spinner';
        moduleItems[index].label = this.translocoService.translate('menu.terminalRunning');
        moduleItems[index].styleClass = 'garuda-button-shine';
        moduleItems[index].badge = undefined;
      } else if (this.taskManager.count() > 0) {
        moduleItems[index].icon = 'pi pi-hourglass';
        moduleItems[index].label = this.translocoService.translate('menu.terminalTasks');
        moduleItems[index].badge = this.taskManager.count().toString();
        moduleItems[index].styleClass = 'garuda-button-shine';
      } else {
        moduleItems[index].icon = 'pi pi-spinner';
        moduleItems[index].label = this.translocoService.translate('menu.terminal');
        moduleItems[index].styleClass = undefined;
        moduleItems[index].badge = undefined;
      }

      items[moduleIndex].items = moduleItems;
      this.menuItems.set(items);

      // Update the application menu when menuItems change
      this.updateApplicationMenu(items);
    });

    // Set up app menu item click handlers
    this.setupAppMenuHandlers();
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

    // Initialize the application menu
    this.setupAppMenuHandlers();
    this.updateApplicationMenu(this.menuItems());
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
   * Handle right click events on the app window to show native context menu
   * @param event The mouse event
   */
  @HostListener('contextmenu', ['$event'])
  async handleRightClick(event: MouseEvent): Promise<void> {
    event.preventDefault();

    const menu = this.rightClickMenu();
    await this.contextMenuService.showContextMenu(menu, event.clientX, event.clientY);
  }

  /**
   * Updates the application menu with current menu items
   * @param items The current menu items
   */
  private async updateApplicationMenu(items: MenuItem[]): Promise<void> {
    const menubar = this.setupLabels(this.translocoService.getActiveLang(), [
      {
        id: 'file',
        icon: 'pi pi-file',
        label: 'File',
        translocoKey: 'menu.file.title',
        items: [...this.fileItems],
      },
      {
        id: 'modules',
        icon: 'pi pi-cog',
        label: 'Modules',
        translocoKey: 'menu.modules.title',
        items: [...this.moduleItems],
      },
      {
        id: 'help',
        icon: 'pi pi-question-circle',
        label: 'Help',
        translocoKey: 'menu.help.title',
        items: [...this.helpItems],
      },
    ]);

    try {
      const appMenuItems: AppMenuItem[] = this.convertToAppMenuItems(menubar);
      await this.appMenuService.updateAppMenu(appMenuItems);
    } catch (error) {
      this.logger.error('Failed to update application menu:', error);
    }
  }

  /**
   * Converts PrimeNG MenuItem[] to AppMenuItem[] for the app menu
   * @param items PrimeNG menu items
   * @returns Converted app menu items
   */
  private convertToAppMenuItems(items: MenuItem[]): AppMenuItem[] {
    const dontShow = ['terminal'];

    return items
      .filter((item) => item.visible !== false && !dontShow.includes(item.id ?? ''))
      .map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        enabled: !item.disabled,
        visible: item.visible !== false,
        routerLink: item.routerLink as string,
        command: item.command ? item.id : undefined,
        submenu: item.items ? this.convertToAppMenuItems(item.items) : undefined,
        accelerator: (item as any).shortcut as string,
      }));
  }

  /**
   * Sets up handlers for app menu item clicks
   */
  private setupAppMenuHandlers(): void {
    if (!window.electronAPI?.events) {
      this.logger.error('electronAPI.events not available!');
      return;
    }

    try {
      window.electronAPI.events.on('appMenu:itemClicked', (data: any) => {
        this.logger.trace('App menu item clicked event received:', data);

        const menuData = data;

        // Handle router navigation
        if (menuData.routerLink) {
          try {
            this.router.navigate([menuData.routerLink]);
          } catch (error) {
            this.logger.error('Failed to navigate to route:', error);
          }
        }

        // Handle command execution
        if (menuData.command && menuData.id) {
          const menuItem = this.findMenuItemById(this.menuItems(), menuData.id);
          this.logger.debug('Found menu item:', menuItem);

          if (menuItem?.command) {
            try {
              // @ts-expect-error - PrimeNG MenuItem command property
              menuItem.command();
            } catch (error) {
              this.logger.error('Error executing menu command:', error);
            }
          } else {
            this.logger.warn('No command found for menu item:', menuData.id);
          }
        } else {
          this.logger.debug('No command to execute for menu item');
        }
      });

      this.logger.debug('App menu handlers setup complete');
    } catch (error) {
      this.logger.error('Error setting up app menu event handler:', error);
    }
  }

  /**
   * Finds a menu item by ID recursively
   * @param items Menu items to search
   * @param id ID to find
   * @returns Found menu item or undefined
   */
  private findMenuItemById(items: MenuItem[], id: string): MenuItem | undefined {
    for (const item of items) {
      if (item.id === id) {
        return item;
      }
      if (item.items) {
        const found = this.findMenuItemById(item.items, id);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }

  /**
   * Sets up the labels for the menu items, based on the current language
   * @param lang The language to set the labels to
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
              label: this.translocoService.translate(
                (subItem as MenuItem & { translocoKey: string }).translocoKey,
                {},
                lang,
              ),
            }),
          );
        }
      }
      newItems.push(
        Object.assign({}, item, {
          label: this.translocoService.translate((item as MenuItem & { translocoKey: string }).translocoKey, {}, lang),
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
    this.logger.debug(`Close requested, ${this.taskManager.currentTask() ? 'one' : 'no'} action is running`);

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
