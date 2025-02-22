import { Component, inject, OnInit } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { TableModule } from 'primeng/table';
import { NgClass, NgForOf } from '@angular/common';
import { AppService } from '../app.service';
import { DataViewModule } from 'primeng/dataview';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Operation, Package } from '../interfaces';
import { debug, error, info } from '@tauri-apps/plugin-log';
import { INSTALL_ACTION_NAME } from '../constants';
import { ChildProcess, Command } from '@tauri-apps/plugin-shell';

@Component({
  selector: 'app-gaming',
  imports: [TranslocoDirective, TableModule, NgClass, DataViewModule, Select, FormsModule, NgForOf, Button],
  templateUrl: './gaming.component.html',
  styleUrl: './gaming.component.css',
})
export class GamingComponent implements OnInit {
  launchers: Package[] = [
    { name: 'Steam (runtime)', pkgname: ['steam'], icon: 'steam' },
    { name: 'Steam (native)', pkgname: ['steam-native-runtime'], icon: 'steam' },
    { name: 'Lutris', pkgname: ['lutris'], icon: 'lutris' },
    { name: 'Bottles', pkgname: ['bottles'], icon: 'bottles' },
    { name: 'Heroic Games Launcher', pkgname: ['heroic-games-launcher'], icon: 'heroic-games-launcher' },
    { name: 'Minigalaxy', pkgname: ['minigalaxy'], icon: 'minigalaxy' },
    { name: 'GameHub', pkgname: ['gamehub'], icon: 'gamehub' },
    { name: 'Itch', pkgname: ['itch'], icon: 'itch' },
  ];
  wine: Package[] = [
    { name: 'WINE', pkgname: ['wine-meta'], icon: 'wine' },
    { name: 'Winetricks', pkgname: ['winetricks'], icon: 'winetricks' },
    { name: 'ProtonGE-Custom', pkgname: ['proton-ge-custom-bin'], icon: 'proton-ge-custom' },
    { name: 'Protontricks', pkgname: ['protontricks'], icon: 'protontricks' },
    { name: 'Luxtorpeda', pkgname: ['luxtorpeda'], icon: 'luxtorpeda' },
    { name: 'Boxtron', pkgname: ['boxtron'], icon: 'boxtron' },
  ];
  private readonly appService = inject(AppService);

  ngOnInit() {
    this.checkInstalled();
  }

  addToPending(pkg: Package) {
    const existingOperation = this.appService
      .pendingOperations()
      .find((operation) => operation.name === INSTALL_ACTION_NAME);
    pkg.selected = !pkg.selected;

    if (existingOperation && pkg.selected) {
      void debug(`Adding ${pkg.pkgname} to existing operation`);
      existingOperation.commandArgs.push(pkg.pkgname);
    } else if (existingOperation && !pkg.selected) {
      for (const pkgname of pkg.pkgname) {
        const index = existingOperation.commandArgs.indexOf(pkgname);
        existingOperation.commandArgs.splice(index, 1);
        void debug(`Removed ${pkgname} from args`);
      }

      if (existingOperation.commandArgs.length === 0) {
        void debug(`Removing ${existingOperation.name} operation`);
        const index = this.appService.pendingOperations().indexOf(existingOperation);
        this.appService.pendingOperations().splice(index, 1);
      }
    } else {
      const operation: Operation = {
        name: INSTALL_ACTION_NAME,
        prettyName: 'Install apps',
        sudo: true,
        status: 'pending',
        commandArgs: [...pkg.pkgname],
        command: (args?: string[]): string => {
          void info('Installing packages');
          return `pacman --noconfirm -S ${args?.join(' ')}`;
        },
      };
      this.appService.pendingOperations().push(operation);
    }
  }

  async checkInstalled() {
    void info('Checking installed packages');
    const cmd = 'pacman -Qq';
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

    if (result.code !== 0) {
      void error(`Error checking installed packages: ${result.stderr}`);
      return;
    }

    const installedPackages: string[] = result.stdout.split('\n');
    for (const pkg of this.launchers) {
      pkg.selected = installedPackages.includes(pkg.pkgname[0]);
      pkg.initialState = pkg.selected;
    }
    for (const pkg of this.wine) {
      pkg.selected = installedPackages.includes(pkg.pkgname[0]);
      pkg.initialState = pkg.selected;
    }
  }
}
