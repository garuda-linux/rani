import { AfterViewInit, Component, inject, signal, ViewChild } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { PrivilegeManagerService } from './privilege-manager.service';
import { MessageToastService } from '@garudalinux/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { NgClass } from '@angular/common';
import { Logger } from '../logging/logging';
import { Nullable } from 'primeng/ts-helpers';

@Component({
  selector: 'rani-privilege-manager',
  imports: [Dialog, Password, Button, TranslocoDirective, NgClass],
  templateUrl: './privilege-manager.component.html',
  styleUrl: './privilege-manager.component.css',
})
export class PrivilegeManagerComponent implements AfterViewInit {
  passwordInvalid = signal<boolean>(false);

  @ViewChild('dialog') dialog: Nullable<Dialog>;
  @ViewChild('sudoInput') sudoInput: Nullable<Password>;

  protected privilegeManager = inject(PrivilegeManagerService);
  private readonly logger = Logger.getInstance();
  private readonly messageToastService = inject(MessageToastService);
  private readonly translocoService = inject(TranslocoService);

  ngAfterViewInit() {
    this.dialog?.onHide.subscribe(() => {
      // We abort the mission here
      if (this.sudoInput) this.sudoInput.value = null;
      this.passwordInvalid.set(false);
      this.privilegeManager.sudoDialogVisible.set(false);

      this.logger.trace('Dialog hidden, cleared password and set invalid to false');
    });
  }

  /**
   * Write the sudo password to the system.
   * @param cache Whether to cache the password in-memory for later use
   */
  async writeSudoPass(cache = false): Promise<void> {
    if (!this.sudoInput?.value) {
      this.logger.trace('Password is empty');
      this.passwordInvalid.set(true);
      return;
    }

    try {
      await this.privilegeManager.writeSudoPass(this.sudoInput.value, cache);
      this.passwordInvalid.set(false);
    } catch (err: any) {
      this.logger.error(err);
      this.passwordInvalid.set(true);
      this.sudoInput.value = null;
      this.messageToastService.error('Error', this.translocoService.translate('error.sudoPassword'));
    }
  }
}
