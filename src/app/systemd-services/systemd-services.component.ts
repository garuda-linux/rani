import { Component, inject, OnInit, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { AppService } from '../app.service';
import { debug, error, trace } from '@tauri-apps/plugin-log';
import { SystemdService, SystemdServiceAction } from '../interfaces';
import { NgClass } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { Popover, PopoverModule } from 'primeng/popover';
import { ChildProcess, Command } from '@tauri-apps/plugin-shell';
import { MessageToastService } from '@garudalinux/core';
import { Nullable } from 'primeng/ts-helpers';

@Component({
  selector: 'app-systemd-services',
  imports: [Button, IconField, InputIcon, PopoverModule, InputText, TableModule, NgClass, TranslocoDirective],
  templateUrl: './systemd-services.component.html',
  styleUrl: './systemd-services.component.css',
})
export class SystemdServicesComponent implements OnInit {
  activeService = signal<SystemdService | null>(null);
  loading = signal<boolean>(true);
  serviceSearch = signal<string>('');
  systemdServices = signal<SystemdService[]>([]);

  intervalRef: Nullable<number> = null;

  protected readonly appService = inject(AppService);
  private readonly messageToastService = inject(MessageToastService);

  async ngOnInit() {
    void debug('Initializing system tools');
    this.loading.set(false);
    this.systemdServices.set(await this.getActiveServices());

    if (this.appService.settings.autoRefresh) {
      this.intervalRef = setInterval(async () => {
        this.systemdServices.set(await this.getActiveServices());
      }, 5000);
      void debug('Started auto-refresh');
    }
  }

  async getActiveServices(): Promise<SystemdService[]> {
    const cmd = 'systemctl list-units --type service --full --all --output json --no-pager';
    const result: SystemdService[] | null = await this.appService.getCommandOutput<SystemdService[]>(
      cmd,
      (stdout: string) => JSON.parse(stdout),
    );

    if (result) return result;
    return [];
  }

  clear(table: Table) {
    table.clear();
    this.serviceSearch.set('');
  }

  async executeAction(event: SystemdServiceAction) {
    if (!this.activeService()) {
      void error('No active service selected, something went wrong here');
      return;
    }

    let action: string;
    switch (event) {
      case 'start':
        action = 'systemctl start';
        break;
      case 'stop':
        action = 'systemctl stop';
        break;
      case 'restart':
        action = 'systemctl restart';
        break;
      case 'reload':
        action = 'systemctl reload';
        break;
      case 'enable':
        action = 'systemctl enable --now';
        break;
      case 'disable':
        action = 'systemctl disable --now';
        break;
      case 'mask':
        action = 'systemctl mask';
        break;
      case 'unmask':
        action = 'systemctl unmask';
        break;
      case 'logs':
        action = 'journalctl --no-pager -eu';
        break;
    }

    await this.appService.getSudoPassword();
    action = `echo ${this.appService.sudoPassword()} | sudo -p "" -S bash -c '${action} ${this.activeService()!.unit}'`;
    const cmd: ChildProcess<string> = await Command.create('exec-bash', ['-c', action]).execute();

    if (cmd.code !== 0) {
      this.messageToastService.error(
        'Error running action',
        `Command ${action} failed with code ${cmd.code} and output ${cmd.stderr}`,
      );
      void error(`Command ${action} failed with code ${cmd.code} and output ${cmd.stderr}`);
      return;
    }

    void trace(`Command ${action} executed successfully`);
    if (event === 'logs') {
      this.appService.termOutput = '';
      this.appService.addTermOutput(cmd.stdout);
      this.appService.currentAction.set(`${this.activeService()!.unit} logs`);
      this.appService.terminalVisible.set(true);
    } else {
      this.systemdServices.set(await this.getActiveServices());
    }
  }

  openPopover($event: MouseEvent, op: Popover, service: SystemdService) {
    this.activeService.set(service);
    op.toggle($event);
  }

  toggleRefresh() {
    this.appService.settings.autoRefresh = !this.appService.settings.autoRefresh;
    void this.appService.store.set('settings', this.appService.settings);

    if (this.appService.settings.autoRefresh) {
      this.intervalRef = setInterval(async () => {
        this.systemdServices.set(await this.getActiveServices());
      }, 5000);
      void debug('Started auto-refresh');
    } else if (this.intervalRef) {
      clearInterval(this.intervalRef);
      void debug('Stopped auto-refresh');
    }
  }
}
