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
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Popover, PopoverModule } from 'primeng/popover';
import { MessageToastService } from '@garudalinux/core';
import { Nullable } from 'primeng/ts-helpers';
import { OperationManagerService } from '../operation-manager/operation-manager.service';
import { Tooltip } from 'primeng/tooltip';
import { ConfigService } from '../config/config.service';

@Component({
  selector: 'rani-systemd-services',
  imports: [Button, IconField, InputIcon, PopoverModule, InputText, TableModule, NgClass, TranslocoDirective, Tooltip],
  templateUrl: './systemd-services.component.html',
  styleUrl: './systemd-services.component.css',
})
export class SystemdServicesComponent implements OnInit {
  activeService = signal<SystemdService | null>(null);
  userContext = signal<boolean>(false);
  includeDisabled = signal<boolean>(false);
  loading = signal<boolean>(true);
  serviceSearch = signal<string>('');
  systemdServices = signal<SystemdService[]>([]);

  intervalRef: Nullable<number> = null;

  protected readonly appService = inject(AppService);
  protected readonly configService = inject(ConfigService);
  private readonly messageToastService = inject(MessageToastService);
  private readonly operationManager = inject(OperationManagerService);
  private readonly translocoService = inject(TranslocoService);

  async ngOnInit() {
    void debug('Initializing system tools');

    if (this.configService.settings().systemdUserContext) {
      this.userContext.set(true);
    }
    this.systemdServices.set(await this.getServices());

    if (this.configService.settings().autoRefresh) {
      this.intervalRef = setInterval(async () => {
        this.systemdServices.set(await this.getServices());
      }, 5000);
      void debug('Started auto-refresh');
    }

    this.loading.set(false);
  }

  /**
   * Get the active systemd services, destined for the table. Searches either user or system services.
   */
  async getServices(): Promise<SystemdService[]> {
    const toDo: string[] = [
      `systemctl ${this.userContext() ? '--user' : ''} list-units --type service --full --all --output json --no-pager`,
    ];
    if (this.includeDisabled()) {
      toDo.push(
        `systemctl ${this.userContext() ? '--user' : ''} list-unit-files --type=service --state=disabled --full --all --output json --no-pager`,
      );
    }

    const servicePromises: Promise<Nullable<SystemdService[]>>[] = [];
    for (const cmd of toDo) {
      servicePromises.push(
        this.operationManager.getCommandOutput<SystemdService[]>(cmd, (stdout: string) => {
          const services = JSON.parse(stdout) as SystemdService[];
          for (const service of services) {
            if (service.unit && service.unit.length > 50) {
              service.tooltip = service.unit;
              service.unit = `${service.unit.slice(0, 50)}...`;
            } else if (service.unit_file) {
              if (service.unit_file.length > 50) {
                service.tooltip = service.unit_file;
                service.unit = `${service.unit_file.slice(0, 50)}...`;
              } else {
                service.unit = service.unit_file;
              }
              delete service.unit_file;
            }
          }
          return services;
        }),
      );
    }

    const finalResult: SystemdService[] = [];
    const results: Nullable<SystemdService[]>[] = await Promise.all(servicePromises);
    for (const result of results) {
      if (result) {
        finalResult.push(...result);
      }
    }
    return finalResult;
  }

  /**
   * Clear the systemd service table search and options.
   * @param table
   */
  clear(table: Table): void {
    table.clear();
    this.serviceSearch.set('');
  }

  /**
   * Execute a systemd service action.
   * @param event The systemd service action
   */
  async executeAction(event: SystemdServiceAction): Promise<void> {
    if (!this.activeService()) {
      void error('No active service selected, something went wrong here');
      return;
    }

    let action: string;
    switch (event) {
      case 'start':
        action = `systemctl ${this.userContext() ? '--user' : ''} start`;
        break;
      case 'stop':
        action = `systemctl ${this.userContext() ? '--user' : ''} stop`;
        break;
      case 'restart':
        action = `systemctl ${this.userContext() ? '--user' : ''} restart`;
        break;
      case 'reload':
        action = `systemctl ${this.userContext() ? '--user' : ''} reload`;
        break;
      case 'enable':
        action = `systemctl ${this.userContext() ? '--user' : ''} enable --now`;
        break;
      case 'disable':
        action = `systemctl ${this.userContext() ? '--user' : ''} disable --now`;
        break;
      case 'mask':
        action = `systemctl ${this.userContext() ? '--user' : ''} mask`;
        break;
      case 'unmask':
        action = `systemctl ${this.userContext() ? '--user' : ''} unmask`;
        break;
      case 'logs':
        action = `journalctl ${this.userContext() ? '--user' : ''} --no-pager -eu`;
        break;
    }

    let output: string | null;
    if (!this.userContext()) {
      output = await this.operationManager.getSudoCommandOutput<string>(`${action} ${this.activeService()!.unit}`);
    } else {
      output = await this.operationManager.getCommandOutput<string>(`${action} ${this.activeService()!.unit}`);
    }

    if (!output) {
      this.messageToastService.error(
        this.translocoService.translate('systemdServices.errorTitle'),
        this.translocoService.translate('systemdServices.error', { action: event }),
      );
      void error(`Could execute action ${action}`);
      return;
    }

    void trace(`Command ${action} executed successfully`);
    if (event === 'logs') {
      this.operationManager.operationOutput.set('');
      this.operationManager.addTerminalOutput(output);

      this.operationManager.currentAction.set(
        `${this.activeService()!.unit} ${this.translocoService.translate('systemdServices.logs')}`,
      );
      this.operationManager.showTerminal.set(true);
    } else {
      this.systemdServices.set(await this.getServices());
    }
  }

  /**
   * Open the popover for the systemd service actions.
   * @param $event The mouse event
   * @param op The popover
   * @param service The systemd service
   */
  openPopover($event: MouseEvent, op: Popover, service: SystemdService): void {
    this.activeService.set(service);
    op.toggle($event);
  }

  /**
   * Toggle the auto-refresh of the systemd services, if enabled start the interval.
   */
  async toggleRefresh(): Promise<void> {
    await this.configService.updateConfig('autoRefresh', !this.configService.settings().autoRefresh);

    if (this.configService.settings().autoRefresh) {
      this.intervalRef = setInterval(async () => {
        this.systemdServices.set(await this.getServices());
      }, 5000);
      void debug('Started auto-refresh');
    } else if (this.intervalRef) {
      clearInterval(this.intervalRef);
      void debug('Stopped auto-refresh');
    }
  }

  /**
   * Toggle the context of the systemd services and reload the active services.
   */
  async toggleContext(): Promise<void> {
    this.loading.set(true);
    this.userContext.set(!this.userContext());
    this.systemdServices.set(await this.getServices());
    this.loading.set(false);
  }

  async toggleDisabled(): Promise<void> {
    this.loading.set(true);
    this.includeDisabled.set(!this.includeDisabled());
    this.systemdServices.set(await this.getServices());
    this.loading.set(false);
  }
}
