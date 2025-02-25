import { NgClass, NgOptimizedImage } from '@angular/common';
import { ChangeDetectorRef, Component, computed, effect, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ScrollTop } from 'primeng/scrolltop';
import { LanguageSwitcherComponent } from './language-switcher/language-switcher.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { lastValueFrom } from 'rxjs';
import { Button } from 'primeng/button';
import { AppService } from './app.service';
import { Dialog, DialogModule } from 'primeng/dialog';
import { TerminalComponent } from './terminal/terminal.component';
import { DrawerModule } from 'primeng/drawer';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { debug, info, trace } from '@tauri-apps/plugin-log';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { FormsModule } from '@angular/forms';
import { Password } from 'primeng/password';
import { Nullable } from 'primeng/ts-helpers';
import { Operation } from './interfaces';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ProgressBar } from 'primeng/progressbar';
import { ContextMenu } from 'primeng/contextmenu';
import { MenuItem, MenuItemCommandEvent } from 'primeng/api';
import { globalKeyHandler } from './key-handler';
import { ShellBarStartDirective, ShellComponent } from './shell';
import { Chip } from 'primeng/chip';

@Component({
  imports: [
    RouterModule,
    NgOptimizedImage,
    DialogModule,
    ScrollTop,
    LanguageSwitcherComponent,
    Button,
    ShellComponent,
    Dialog,
    TerminalComponent,
    DrawerModule,
    TableModule,
    TranslocoDirective,
    ToastModule,
    ConfirmDialog,
    FormsModule,
    Password,
    NgClass,
    ProgressBar,
    ContextMenu,
    ShellBarStartDirective,
    ShellBarStartDirective,
    ShellComponent,
    Chip,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  items = signal([
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
    },
    {
      icon: 'pi pi-info-circle',
      label: 'Diagnostics',
      translocoKey: 'menu.diagnostics',
      routerLink: '/diagnostics',
    },
  ]);
  progressTracker = signal<number | null>(null);

  readonly appService = inject(AppService);
  readonly appWindow = getCurrentWindow();
  readonly pendingOperations = computed<string>(() => {
    return this.appService.pendingOperations().length.toString();
  });
  rightClickMenu: MenuItem[] = [
    {
      label: 'Apply',
      icon: 'pi pi-check',
      command: (event) => this.applyOperations(event),
    },
    {
      label: 'Clear',
      icon: 'pi pi-trash',
      command: (event) => this.clearOperations(event),
    },
    {
      separator: true,
    },
    {
      label: 'Show terminal',
      icon: 'pi pi-hashtag',
      command: () => {
        void this.appService.terminalVisible.set(true);
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
  ];
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      const progress = this.appService.currentAction();
      if (progress && progress.match(/\(\d\/\d\)/)) {
        const [current, total] = progress.match(/\d+/g)!.map((x) => parseInt(x, 10));
        this.progressTracker.set((current / total) * 100);
      } else if (!progress) {
        this.progressTracker.set(null);
      }
    });
  }

  ngOnInit(): void {
    void this.setupLabels(this.appService.translocoService.getActiveLang());

    this.appService.translocoService.langChanges$.subscribe((lang) => {
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
    const noDragSelector = 'a, button, input, img, span, h1, h2, h3, h4, h5, h6, p-tab, p-card';
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
    for (const item of this.items()) {
      newItemPromises.push(
        lastValueFrom(this.appService.translocoService.selectTranslate(item['translocoKey'], {}, lang)),
      );
    }

    const results: string[] = await Promise.all(newItemPromises);
    const newItems = [];

    for (const [index, item] of this.items().entries()) {
      newItems.push({ ...item, label: results[index] });
    }

    this.items.set(newItems);
    this.cdr.detectChanges();
  }

  /**
   * Apply all pending operations, if any. Shows a confirmation dialog before applying. If the user cancels, a message is shown.
   * @param event The event that triggered to apply
   */
  applyOperations(event: Event | MenuItemCommandEvent) {
    void debug('Firing apply operations');
    const operations = this.appService.pendingOperations().length === 1 ? 'operation' : 'operations';
    this.appService.confirmationService.confirm({
      target: 'target' in event ? (event.target as EventTarget) : (event as EventTarget),
      message: `Do you want to apply ${this.appService.pendingOperations().length} ${operations}?`,
      header: 'Apply changes?',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancel',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Apply',
        severity: 'success',
      },

      accept: () => {
        void debug('Firing apply operations');
        void this.appService.executeOperations();
      },
      reject: () => {
        void debug('Rejected applying operations');
        this.appService.messageToastService.error('Rejected', 'You have rejected');
      },
    });
  }

  /**
   * Clear all pending operations. Shows a confirmation dialog before clearing. If the user cancels, a message is shown.
   * @param event The event that triggered the clear
   */
  clearOperations(event: Event | MenuItemCommandEvent): void {
    void debug('Firing clear operations');
    const operations = this.appService.pendingOperations().length === 1 ? 'operation' : 'operations';
    this.appService.confirmationService.confirm({
      target: 'target' in event ? (event.target as EventTarget) : (event as EventTarget),
      message: `Do you want to delete ${this.appService.pendingOperations().length} ${operations}?`,
      header: 'Clear pending operations?',
      icon: 'pi pi-trash',
      rejectLabel: 'Cancel',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },

      accept: () => {
        this.appService.pendingOperations.set([]);
        this.appService.messageToastService.info('Confirmed', 'Pending operations cleared');
        void debug('Cleared pending operations');
      },
      reject: () => {
        this.appService.messageToastService.error('Rejected', 'You have rejected');
        void debug('Rejected clearing pending operations');
      },
    });
  }

  /**
   * Set the sudo password in the app service.
   * @param value The password to set
   * @param persist Whether to persist the password or not
   */
  setSudoPass(value: Nullable<string>, persist = false): void {
    if (!value) {
      this.appService.messageToastService.error('Error', 'Password cannot be empty');
      return;
    }
    this.appService.sudoPassword.set(value);

    // I guess this can be done better? 10 Seconds should be enough for using the password and discarding it
    if (!persist) setTimeout(() => this.appService.sudoPassword.set(null), 10000);

    this.appService.sudoDialogVisible.set(false);
  }

  /**
   * Show the terminal with the output of the operation, if available.
   * @param operation The operation to show the output of
   */
  showOperationLogs(operation: Operation): void {
    const opIsRunning: boolean = operation.status === 'running';

    if (this.appService.termOutput && !opIsRunning) {
      this.appService.messageToastService.warn('Warning', 'It looks like you have pending operations');
      return;
    } else if (opIsRunning) {
      this.appService.terminalVisible.set(true);
    } else if (!operation.hasOutput || !operation.output) {
      this.appService.messageToastService.warn('Warning', 'No output available');
      return;
    }

    this.appService.currentAction.set(this.appService.translocoService.translate(operation.prettyName));
    this.appService.termOutput = operation.output ?? '';
    this.appService.terminalVisible.set(true);
  }

  /**
   * Remove an operation from the pending operations list.
   * @param operation The operation to remove
   */
  removeOperation(operation: Operation) {
    this.appService.pendingOperations.set(
      this.appService.pendingOperations().filter((op) => op.name !== operation.name),
    );
  }

  private shutdown(): void {
    void info('Shutting down');
    void this.appWindow.destroy();
  }

  private attachTauriListeners() {
    void this.appWindow.listen('tauri://resize', async () => {
      void trace('Resizing window');
      this.appService.state.isMaximized.set(await this.appWindow.isMaximized());
    });

    void this.appWindow.listen('tauri://close-requested', async () => {
      void info('Close requested');
      this.appService.confirmationService.confirm({
        message: 'Do you want to exit?',
        header: 'Exit confirmation',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          void this.shutdown();
        },
      });
    });
  }
}
