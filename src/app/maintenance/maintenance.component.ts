import { Component, inject } from '@angular/core';
import { debug, info, warn } from '@tauri-apps/plugin-log';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { MaintenanceAction } from '../interfaces';
import { AppService } from '../app.service';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-maintenance',
  imports: [Card, Button, TranslocoDirective],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.css',
})
export class MaintenanceComponent {
  actions: MaintenanceAction[] = [
    {
      name: 'updateSystem',
      label: 'System update',
      description: 'Update the system to the latest version',
      icon: 'pi pi-refresh',
      sudo: true,
      hasOutput: true,
      order: 5,
      command: (): string => {
        void info('Updating system');
        return 'pacman -Syu --noconfirm';
      },
    },
    {
      name: 'cleanCache',
      label: 'Clean cache',
      description: 'Clean the package cache',
      icon: 'pi pi-trash',
      sudo: true,
      hasOutput: true,
      order: 99,
      command: (): string => {
        void info('Cleaning cache');
        return 'paccache -rk0';
      },
    },
    {
      name: 'cleanOrphans',
      label: 'Remove orphans',
      description: 'Remove orphaned packages',
      icon: 'pi pi-trash',
      sudo: true,
      hasOutput: true,
      order: 98,
      command: (): string => {
        void info('Cleaning orphans');
        return 'pacman --noconfirm -Rns $(pacman -Qtdq) || true';
      },
    },
    {
      name: 'refreshMirrors',
      label: 'Refresh mirrorlists',
      description: 'Refresh the mirrorlists',
      icon: 'pi pi-refresh',
      sudo: true,
      hasOutput: true,
      order: 1,
      command: (): string => {
        void info('Refreshing mirrors');
        return 'rankmirrors -n 6 /etc/pacman.d/mirrorlist';
      },
    },
    {
      name: 'reinstallPackages',
      label: 'Reinstall packages',
      description: 'Reinstall all packages',
      icon: 'pi pi-refresh',
      sudo: true,
      hasOutput: true,
      order: 5,
      command: (): string => {
        void info('Reinstalling packages');
        return 'pacman -Qnq | pacman --noconfirm -S -';
      },
    },
    {
      name: 'removeLock',
      label: 'Remove database lock',
      description: 'Remove database lock',
      icon: 'pi pi-trash',
      hasOutput: false,
      sudo: true,
      order: 1,
      command: (): string => {
        void info('Removing database lock');
        return 'rm /var/lib/pacman/db.lck || true';
      },
    },
  ];

  readonly appService = inject(AppService);

  addToPending(action: MaintenanceAction) {
    void debug('Adding to pending');
    if (!this.appService.pendingOperations().find((operation) => operation.name === action.name)) {
      this.appService.pendingOperations().push({
        name: action.name,
        prettyName: action.label,
        order: action.order,
        command: action.command,
        commandArgs: [],
        sudo: action.sudo,
        status: 'pending',
        hasOutput: action.hasOutput,
      });
    } else {
      void warn('Operation already exists');
    }
  }

  runNow(action: MaintenanceAction) {
    void debug('Running maintenance action now');
    this.appService.pendingOperations.set([]);
    this.addToPending(action);
    void this.appService.executeOperations();
    // this.appService.terminalVisible.set(true);
  }
}
