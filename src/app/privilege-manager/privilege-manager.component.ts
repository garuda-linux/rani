import { Component, inject, signal } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { PrivilegeManagerService } from './privilege-manager.service';
import { error, trace } from '@tauri-apps/plugin-log';
import { MessageToastService } from '@garudalinux/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { NgClass } from '@angular/common';

@Component({
  selector: 'rani-privilege-manager',
  imports: [Dialog, Password, Button, TranslocoDirective, NgClass],
  templateUrl: './privilege-manager.component.html',
  styleUrl: './privilege-manager.component.css',
})
export class PrivilegeManagerComponent {
  passwordInvalid = signal<boolean>(false);

  protected privilegeManager = inject(PrivilegeManagerService);
  private readonly messageToastService = inject(MessageToastService);
  private readonly translocoService = inject(TranslocoService);

  /**
   * Write the sudo password to the system.
   * @param pass The password as text
   * @param cache Whether to cache the password in-memory for later use
   */
  async writeSudoPass(pass: string, cache = false): Promise<void> {
    if (!pass) {
      void trace('Password is empty');
      this.passwordInvalid.set(true);
      return;
    }
    try {
      await this.privilegeManager.writeSudoPass(pass, cache);
      this.passwordInvalid.set(false);
    } catch (err: any) {
      void error(err);
      this.passwordInvalid.set(true);
      this.messageToastService.error('Error', this.translocoService.translate('error.sudoPassword'));
    }
  }
}
