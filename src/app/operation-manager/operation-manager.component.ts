import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmationService, MenuItemCommandEvent } from 'primeng/api';
import { OperationManagerService } from './operation-manager.service';
import { MessageToastService } from '@garudalinux/core';
import { TranslocoService } from '@jsverse/transloco';
import { Logger } from '../logging/logging';

@Component({
  selector: 'rani-operation-manager',
  imports: [],
  templateUrl: './operation-manager.component.html',
  styleUrl: './operation-manager.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationManagerComponent {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly logger = Logger.getInstance();
  private readonly messageToastService = inject(MessageToastService);
  private readonly operationManager = inject(OperationManagerService);
  private readonly translocoService = inject(TranslocoService);

  /**
   * Apply all pending operations, if any. Shows a confirmation dialog before applying. If the user cancels, a message is shown.
   * @param event The event that triggered to apply
   */
  applyOperations(event: Event | MenuItemCommandEvent) {
    this.logger.debug('Firing apply operations');
    this.confirmationService.confirm({
      target: 'target' in event ? (event.target as EventTarget) : (event as EventTarget),
      message: this.translocoService.translate('confirmation.applyOperationsBody'),
      header: this.translocoService.translate('confirmation.applyOperations'),
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancel',
      acceptButtonProps: {
        severity: 'success',
        label: this.translocoService.translate('confirmation.accept'),
      },
      rejectButtonProps: {
        severity: 'secondary',
        label: this.translocoService.translate('confirmation.reject'),
      },

      accept: () => {
        this.logger.debug('Firing apply operations');
        void this.operationManager.executeOperations();
      },
      reject: () => {
        this.logger.debug('Rejected applying operations');
        this.messageToastService.error('Rejected', 'You have rejected');
      },
    });
  }

  /**
   * Clear all pending operations. Shows a confirmation dialog before clearing. If the user cancels, a message is shown.
   * @param event The event that triggered the clear
   */
  clearOperations(event: Event | MenuItemCommandEvent): void {
    this.logger.debug('Firing clear operations');
    const operations = this.operationManager.pending().length === 1 ? 'operation' : 'operations';
    this.confirmationService.confirm({
      target: 'target' in event ? (event.target as EventTarget) : (event as EventTarget),
      message: `Do you want to delete ${this.operationManager.pending().length} ${operations}?`,
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
        this.operationManager.pending.set([]);
        this.messageToastService.info('Confirmed', 'Pending operations cleared');
        this.logger.debug('Cleared pending operations');
      },
      reject: () => {
        this.messageToastService.error('Rejected', 'You have rejected');
        this.logger.debug('Rejected clearing pending operations');
      },
    });
  }
}
