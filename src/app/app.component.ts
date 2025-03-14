import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { ScrollTop } from 'primeng/scrolltop';
import { LanguageSwitcherComponent } from './language-switcher/language-switcher.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AppService } from './app.service';
import { DialogModule } from 'primeng/dialog';
import { Command, open } from '@tauri-apps/plugin-shell';
import { DrawerModule } from 'primeng/drawer';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ContextMenu } from 'primeng/contextmenu';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { globalKeyHandler } from './key-handler';
import { ShellBarEndDirective, ShellBarStartDirective, ShellComponent } from '@garudalinux/core';
import { ProgressSpinner } from 'primeng/progressspinner';
import { LoadingService } from './loading-indicator/loading-indicator.service';
import { TerminalComponent } from './terminal/terminal.component';
import { PrivilegeManagerComponent } from './privilege-manager/privilege-manager.component';
import { OperationManagerComponent } from './operation-manager/operation-manager.component';
import { OperationManagerService } from './operation-manager/operation-manager.service';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfigService } from './config/config.service';
import { Logger } from './logging/logging';
import { AppSettings } from './config/interfaces';
import { settingsMenuMappings } from './constants';
import { MenuToggleMapping } from './interfaces';
import { BaseDirectory, exists } from '@tauri-apps/plugin-fs';
import { LogLevel } from './logging/interfaces';

@Component({
  imports: [
    RouterModule,
    NgOptimizedImage,
    DialogModule,
    ScrollTop,
    LanguageSwitcherComponent,
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
    AsyncPipe,
    ShellBarEndDirective,
    TerminalComponent,
    PrivilegeManagerComponent,
    OperationManagerComponent,
    ConfirmDialog,
  ],
  selector: 'rani-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  @ViewChild('languageSwitcherComponent') langSwitcher!: LanguageSwitcherComponent;
  @ViewChild('privilegeManagerComponent') privilegeManager!: PrivilegeManagerComponent;
  @ViewChild('terminalComponent') terminalComponent!: TerminalComponent;
  @ViewChild('operationManagerComponent') operationManagerComponent!: OperationManagerComponent;

  readonly appService = inject(AppService);
  readonly appWindow = getCurrentWindow();
  readonly confirmationService = inject(ConfirmationService);
  readonly loadingService = inject(LoadingService);

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
        void this.appWindow.close();
      },
    },
  ]);

  protected readonly configService = inject(ConfigService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = Logger.getInstance();
  private readonly operationManager = inject(OperationManagerService);
  private readonly translocoService = inject(TranslocoService);

  menuItems = signal<MenuItem[]>(this.setupLabels(this.translocoService.getActiveLang(), [
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
      label: 'Settings',
      translocoKey: 'menu.settings.title',
      items: [
        {
          icon: 'pi pi-circle-fill',
          id: 'leftButtons',
          label: 'Show window buttons left',
          translocoKey: 'menu.settings.windowButtonsLeft',
          command: () => this.configService.updateConfig('leftButtons', !this.configService.settings().leftButtons),
        },
        {
          icon: 'pi pi-clipboard',
          id: 'copyDiagnostics',
          label: 'Copy diagnostics to clipboard',
          translocoKey: 'menu.settings.copyDiagnostics',
          command: () =>
            this.configService.updateConfig('copyDiagnostics', !this.configService.settings().copyDiagnostics),
        },
        {
          icon: 'pi pi-moon',
          id: 'darkMode',
          label: 'Dark mode',
          translocoKey: 'menu.settings.enableDarkMode',
          command: () => this.configService.updateConfig('darkMode', !this.configService.settings().darkMode),
        },
        {
          icon: 'pi pi-user',
          id: 'systemdUserContext',
          label: 'Use systemd user context',
          translocoKey: 'menu.settings.useSystemdUserContext',
          command: () =>
            this.configService.updateConfig('systemdUserContext', !this.configService.settings().systemdUserContext),
        },
        {
          icon: 'pi pi-refresh',
          id: 'autoRefresh',
          label: 'Auto-refresh systemd services',
          translocoKey: 'menu.settings.autoRefresh',
          command: () =>
            this.configService.updateConfig('autoRefresh', !this.configService.settings().autoRefresh),
        },
        {
          icon: 'pi pi-refresh',
          id: 'autoStart',
          label: 'Auto-start Garuda Rani',
          translocoKey: 'menu.settings.autoStart',
          command: () => this.toggleAutoStart(),
        },
        {
          icon: 'pi pi-info',
          id: 'logLevel',
          label: 'Set the log level used',
          translocoKey: 'menu.settings.logLevel',
          command: () => this.toggleLoglevel(),
        },
        {
          icon: 'pi pi-language',
          id: 'language',
          label: 'Language',
          translocoKey: 'menu.settings.language',
          command: () => this.langSwitcher.show(),
        },
      ],
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
          command: () => open('https://forum.garudalinux.org/'),
        },
        {
          icon: 'pi pi-info-circle',
          label: 'Search the wiki',
          translocoKey: 'menu.help.getHelpWiki',
          command: () => open('https://wiki.garudalinux.org/'),
        },
        {
          icon: 'pi pi-info-circle',
          label: 'Search the Arch wiki',
          translocoKey: 'menu.help.getHelpArchWiki',
          command: () => open('https://wiki.archlinux.org/'),
        },
        {
          icon: 'pi pi-info-circle',
          label: 'Garuda Linux infra status',
          translocoKey: 'menu.help.garudaStatus',
          command: () => open('https://status.garudalinux.org'),
        },
        {
          icon: 'pi pi-info-circle',
          label: 'About',
          translocoKey: 'menu.help.callExorcist',
          command: () =>
            this.appService.sendNotification({
              title: this.translocoService.translate('menu.help.callExorcistTitle'),
              body: `${this.translocoService.translate('menu.help.callExorcistBody')} 🐛`,
            }),
        },
        {
          icon: 'pi pi-info-circle',
          label: 'About',
          translocoKey: 'menu.help.about',
          command: () =>
            this.appService.sendNotification({
              title: this.translocoService.translate('menu.help.about'),
              body: this.translocoService.translate('menu.help.aboutBody'),
            }),
        },
      ],
    },
  ]));

  constructor() {
    effect(() => {
      const pending: boolean =
        this.operationManager.pending().length > 0 &&
        this.operationManager.pending().find((op) => op.status !== 'complete') !== undefined;
      const allDone: boolean = this.operationManager.pending().length > 0 && !pending;
      this.menuItems.update((items: MenuItem[]) => {
        const index: number = items.findIndex((item) => item['translocoKey'] === 'menu.terminal');
        if (index !== -1 && !this.operationManager.currentAction() && !allDone) {
          pending ? (items[index].icon = 'pi pi-hourglass') : (items[index].icon = 'pi pi-expand');
        } else if (index !== -1 && !this.operationManager.currentAction() && allDone) {
          items[index].icon = 'pi pi-check';
        } else if (this.operationManager.currentAction()) {
          items[index].icon = 'pi pi-spin pi-spinner';
        } else {
          items[index].icon = 'pi pi-expand';
        }
        return items;
      });
      this.cdr.markForCheck();
    });

    effect(() => {
      const settings: AppSettings = this.configService.settings();
      this.logger.trace('Updating settings labels via effect');
      this.setSettingsLabels(settings);
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.translocoService.events$.subscribe((event) => {
      if (event.type === 'langChanged') {
        this.logger.trace('Updating menu labels via event');
        this.menuItems.update((items: MenuItem[]) => {
          return this.setupLabels(this.translocoService.getActiveLang(), items);
        });
      }
    });

    this.attachTauriListeners();
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
      'a, button, input, img, span, h1, h2, h3, h4, h5, h6, p-tab, p-card, p-select, p-table, p-dialog, rani-system-status';
    const target = event.target as HTMLElement;
    if (target.closest(noDragSelector)) return;

    // Left click only
    if (event.buttons === 1) {
      event.detail === 2
        ? await this.appWindow.toggleMaximize() // Maximize on double click
        : await this.appWindow.startDragging(); // Else start dragging
    }
  }

  /**
   * Set up the labels for the menu items with the given language.
   * @param lang The language to set the labels in
   */
  setupLabels(lang: string, entries: MenuItem[]): MenuItem[] {
    const newItems: MenuItem[] = [ ];

    for (const item of entries) {
      const newSubItems: MenuItem[] = [ ];
      if (item.items) {
        for (const subItem of item.items) {
          newSubItems.push(Object.assign({ }, subItem, { label: this.translocoService.translate(subItem['translocoKey'], { }, lang) }));
        }
      }
      newItems.push(Object.assign({ }, item, { label: this.translocoService.translate(item['translocoKey'], { }, lang), items: newSubItems }));
    }

    return newItems;
  }

  /**
   * Shutdown the app, saving the settings and closing the window.
   * @private
   */
  private async shutdown(): Promise<void> {
    this.logger.info('Shutting down');

    void this.appWindow.destroy();
  }

  /**
   * Attach the Tauri listeners for the app window.
   * @private
   */
  private attachTauriListeners() {
    void this.appWindow.listen('tauri://resize', async () => {
      this.logger.trace('Resizing window');
      this.configService.updateState('isMaximized', await this.appWindow.isMaximized());
    });

    void this.appWindow.listen('tauri://close-requested', async () => {
      this.logger.info(`Close requested, ${this.operationManager.currentAction() ? 'one' : 'no'} action is running`);

      if (!this.operationManager.currentAction() && !this.operationManager.pending().length) {
        void this.shutdown();
        return;
      }

      this.confirmationService.confirm({
        message: this.operationManager.currentAction()
          ? this.translocoService.translate('confirmation.exitAppRunningAction')
          : this.translocoService.translate('confirmation.exitApp'),
        header: this.translocoService.translate('confirmation.exitAppHeader'),
        icon: 'pi pi-exclamation-triangle',
        acceptIcon: 'pi pi-check',
        rejectIcon: 'pi pi-times',
        acceptButtonProps: {
          severity: this.operationManager.currentAction() ? 'danger' : 'success',
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
    });
  }

  /**
   * Set the labels for the settings menu items to have the correct values.
   * @param settings The settings to set the labels for
   * @private
   */
  private setSettingsLabels(settings: AppSettings): void {
    const settingsMenu: MenuItem | undefined = this.menuItems().find(
      (item) => item['translocoKey'] === 'menu.settings.title',
    );
    if (settingsMenu) {
      for (const [key, value] of Object.entries(settings)) {
        const setting: MenuItem | undefined = settingsMenu.items!.find((item) => item['id'] === key);
        this.logger.trace(`${setting ? 'Found' : 'Did not find'} setting for ${key}`);

        if (setting && key === 'logLevel') {
          setting.label = `${this.translocoService.translate('menu.settings.logLevel')}`;
        } else if (setting && key === 'language') {
          setting.label = `${this.translocoService.translate('menu.settings.language')} (${this.translocoService.getActiveLang()})`;
          this.logger.trace(`Updated ${key} to ${setting.label}`);
        } else if (setting) {
          // @ts-ignore - no idea why the Angular compiler is acting up here
          const mapping: MenuToggleMapping = settingsMenuMappings[key];
          const toTranslate: string = value ? mapping.off : mapping.on;

          setting.label = this.translocoService.translate(toTranslate);
          setting.icon = value ? mapping.offIcon : mapping.onIcon;

          this.logger.trace(`Updated ${key} to ${setting.label}`);
        }
      }
    }

    this.cdr.markForCheck();
  }

  /**
   * Toggle the auto-start for Garuda's Rani, copying the desktop file to the autostart directory
   * or removing it if it already exists.
   * @private
   */
  private async toggleAutoStart() {
    if (!(await exists('.config/autostart/org.garudalinux.rani.desktop', { baseDir: BaseDirectory.Home }))) {
      await Command.create('exec-bash', [
        '-c',
        'cp /usr/share/applications/org.garudalinux.rani.desktop ~/.config/autostart/',
      ]).execute();

      await this.configService.updateConfig('autoStart', true);
      this.logger.info('Enabled auto-start');
    } else {
      await Command.create('exec-bash', ['-c', 'rm ~/.config/autostart/org.garudalinux.rani.desktop']).execute();

      await this.configService.updateConfig('autoStart', false);
      this.logger.info('Disabled auto-start');
    }
  }

  /**
   * Toggle the log level used by the logger.
   * @private
   */
  private toggleLoglevel() {
    this.logger.trace('Toggling log level');

    if (Logger.logLevel === LogLevel.ERROR) {
      Logger.logLevel = LogLevel.TRACE;
    } else {
      Logger.logLevel += 1;
    }

    this.logger.info(`Set log level to ${LogLevel[Logger.logLevel]}`);
    void this.configService.updateConfig('logLevel', Logger.logLevel);
  }
}
