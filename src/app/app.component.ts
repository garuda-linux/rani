import { NgClass, NgOptimizedImage } from '@angular/common';
import { ChangeDetectorRef, Component, effect, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ScrollTop } from 'primeng/scrolltop';
import { LanguageSwitcherComponent } from './language-switcher/language-switcher.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { lastValueFrom } from 'rxjs';
import { Button } from 'primeng/button';
import { AppService } from './app.service';
import { MessageToastService, ShellComponent } from '@garudalinux/core';
import { Dialog, DialogModule } from 'primeng/dialog';
import { TerminalComponent } from './terminal/terminal.component';
import { DrawerModule } from 'primeng/drawer';
import { TableModule } from 'primeng/table';
import { ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { debug } from '@tauri-apps/plugin-log';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { FormsModule } from '@angular/forms';
import { Password } from 'primeng/password';
import { Nullable } from 'primeng/ts-helpers';
import { Operation } from './interfaces';
import { ProgressBar } from 'primeng/progressbar';

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
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [ConfirmationService, MessageToastService],
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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageToastService = inject(MessageToastService);
  private readonly translocoService = inject(TranslocoService);

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
    void this.setupLabels(this.translocoService.getActiveLang());

    this.translocoService.langChanges$.subscribe((lang) => {
      void this.setupLabels(lang);
    });
  }

  async setupLabels(lang: string): Promise<void> {
    const newItemPromises = [];
    for (const item of this.items()) {
      newItemPromises.push(lastValueFrom(this.translocoService.selectTranslate(item['translocoKey'], {}, lang)));
    }

    const results: string[] = await Promise.all(newItemPromises);
    const newItems = [];

    for (const [index, item] of this.items().entries()) {
      newItems.push({ ...item, label: results[index] });
    }

    this.items.set(newItems);
    this.cdr.detectChanges();
  }

  applyOperations(event: Event) {
    void debug('Firing apply operations');
    const operations = this.appService.pendingOperations().length === 1 ? 'operation' : 'operations';
    this.confirmationService.confirm({
      target: event.target as EventTarget,
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
        this.messageToastService.error('Rejected', 'You have rejected');
      },
    });
  }

  clearOperations(event: Event) {
    void debug('Firing clear operations');
    const operations = this.appService.pendingOperations().length === 1 ? 'operation' : 'operations';
    this.confirmationService.confirm({
      target: event.target as EventTarget,
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
        this.messageToastService.info('Confirmed', 'Pending operations cleared');
        void debug('Cleared pending operations');
      },
      reject: () => {
        this.messageToastService.error('Rejected', 'You have rejected');
        void debug('Rejected clearing pending operations');
      },
    });
  }

  setSudoPass(value: Nullable<string>, persist = false): void {
    if (!value) {
      this.messageToastService.error('Error', 'Password cannot be empty');
      return;
    }
    this.appService.sudoPassword.set(value);

    // I guess this can be done better? 10 Seconds should be enough for using the password and discarding it
    if (!persist) setTimeout(() => this.appService.sudoPassword.set(null), 10000);

    this.appService.sudoDialogVisible.set(false);
  }

  showOperationLogs(operation: Operation): void {
    if (this.appService.termOutput) {
      this.messageToastService.warn('Warning', 'It looks like you have pending operations');
      return;
    } else if (!operation.hasOutput || !operation.output) {
      this.messageToastService.warn('Warning', 'No output available');
      return;
    }

    this.appService.currentAction.set(operation.prettyName);
    this.appService.termOutput = operation.output;
    this.appService.terminalVisible.set(true);
  }

  removeOperation(operation: Operation) {
    this.appService.pendingOperations.set(
      this.appService.pendingOperations().filter((op) => op.name !== operation.name),
    );
  }
}
