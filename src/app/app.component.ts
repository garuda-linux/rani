import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectorRef, Component, effect, HostListener, inject, OnInit, signal, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ScrollTop } from 'primeng/scrolltop';
import { LanguageSwitcherComponent } from './language-switcher/language-switcher.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { lastValueFrom } from 'rxjs';
import { AppService } from './app.service';
import { DialogModule } from 'primeng/dialog';
import { open } from '@tauri-apps/plugin-shell';
import { DrawerModule } from 'primeng/drawer';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ContextMenu } from 'primeng/contextmenu';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { globalKeyHandler } from './key-handler';
import { ShellBarEndDirective, ShellBarStartDirective, ShellComponent } from './shell';
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
  private readonly logger = Logger.getInstance();
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly operationManager = inject(OperationManagerService);
  private readonly translocoService = inject(TranslocoService);

  menuItems = signal<MenuItem[]>([
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
          command: () => (this.configService.settings().leftButtons = !this.configService.settings().leftButtons),
        },
        {
          icon: 'pi pi-clipboard',
          id: 'copyDiagnostics',
          label: 'Copy diagnostics to clipboard',
          translocoKey: 'menu.settings.copyDiagnostics',
          command: () =>
            (this.configService.settings().copyDiagnostics = !this.configService.settings().copyDiagnostics),
        },
        {
          icon: 'pi pi-moon',
          id: 'darkMode',
          label: 'Dark mode',
          translocoKey: 'menu.settings.darkMode',
          command: () => this.appService.themeHandler.toggleDarkMode(),
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
              title: this.translocoService.translate('menu.help.callExorcist'),
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
  ]);

  constructor() {
    effect(() => {
      const badge: string | undefined = this.operationManager.pending()?.length
        ? this.operationManager.pending()?.length.toString()
        : undefined;
      this.menuItems.update((items) => {
        const index: number = items.findIndex((item) => item.label === 'Terminal');
        if (index !== -1) {
          items[index].badge = badge;
        }
        if (this.operationManager.currentAction()) {
          items[index].icon = 'pi pi-spin pi-spinner';
        } else {
          items[index].icon = 'pi pi-spinner';
        }
        return items;
      });
      this.cdr.detectChanges();
    });

    effect(() => {
      const settings = this.configService.settings();
      this.setSettingsLabels(settings);
    });
  }

  ngOnInit(): void {
    void this.setupLabels(this.translocoService.getActiveLang());

    this.translocoService.langChanges$.subscribe((lang) => {
      void this.setupLabels(lang);
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
      'a, button, input, img, span, h1, h2, h3, h4, h5, h6, p-tab, p-card, p-select, p-table, p-dialog';
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
  async setupLabels(lang: string): Promise<void> {
    const newItemPromises: Promise<any>[] = [];

    for (const item of this.menuItems()) {
      newItemPromises.push(lastValueFrom(this.translocoService.selectTranslate(item['translocoKey'], {}, lang)));
    }

    const results: string[] = await Promise.all(newItemPromises);
    const newItems = [];

    for (const [index, item] of this.menuItems().entries()) {
      newItems.push({ ...item, label: results[index] });
    }

    this.menuItems.set(newItems);

    const newSubItems = [...newItems];
    for (const item of newSubItems) {
      if (item.items) {
        for (const subitem of item.items) {
          subitem.label = await lastValueFrom(this.translocoService.selectTranslate(subitem['translocoKey'], {}, lang));
        }
      }
    }

    this.menuItems.set(newSubItems);
    this.cdr.detectChanges();
  }

  /**
   * Shutdown the app, saving the settings and closing the window.
   * @private
   */
  private async shutdown(): Promise<void> {
    this.logger.info('Shutting down');

    if (this.operationManager.pending().length > 0) {
      await this.configService.store.set('pendingOperations', this.operationManager.pending());
    }

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
      this.logger.info('Close requested');
      this.confirmationService.confirm({
        message: this.translocoService.translate('confirmation.exitApp'),
        header: this.translocoService.translate('confirmation.exitAppHeader'),
        icon: 'pi pi-exclamation-triangle',
        acceptIcon: 'pi pi-check',
        rejectIcon: 'pi pi-times',
        acceptButtonProps: {
          severity: 'danger',
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

  private setSettingsLabels(settings: AppSettings) {
    for (const [key, value] of Object.entries(settings)) {
      const settingsMenu = this.menuItems().find((item) => item['translocoKey'] === 'menu.settings.title');
      if (settingsMenu) {
        const setting = settingsMenu.items!.find((item) => item['id'] === key);
        if (setting) {
          setting.label = value ? 'On' : 'Off';
        }
      }
    }
  }
}
