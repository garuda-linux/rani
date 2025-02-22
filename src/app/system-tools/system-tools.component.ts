import { Component, inject, OnInit, signal } from '@angular/core';
import { debug, trace } from '@tauri-apps/plugin-log';
import { SystemdService } from '../interfaces';
import { Table, TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { NgClass } from '@angular/common';
import { AppService } from '../app.service';

@Component({
  selector: 'app-system-tools',
  imports: [TableModule, Button, IconField, InputIcon, InputText, NgClass],
  templateUrl: './system-tools.component.html',
  styleUrl: './system-tools.component.css',
})
export class SystemToolsComponent implements OnInit {
  systemdServices = signal<SystemdService[]>([]);
  installedPackages = signal<string[]>([]);
  loading = signal<boolean>(true);
  serviceSearch = signal<string>('');

  sections = [
    {
      name: 'audio',
      icon: 'pi pi-volume-up',
      entries: [
        {
          name: 'alsa-support',
          fancyTitle: 'systemTools.audio.alsa.title',
          description: 'systemTools.audio.alsa.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'alsa-support' },
        },
        {
          name: 'jack-support',
          fancyTitle: 'systemTools.audio.jack.title',
          description: 'systemTools.alsa.jack.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'jack-support' },
        },
        {
          name: 'pulseaudio-support',
          fancyTitle: 'systemTools.audio.pulseaudio.title',
          description: 'systemTools.audio.pulseaudio.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'pulseaudio-support' },
        },
        {
          name: 'pipewire-support',
          fancyTitle: 'systemTools.audio.pipewire.title',
          description: 'systemTools.audio.pipewire.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'pkg', name: 'pipewire-support' },
        },
        {
          name: 'group-realtime',
          fancyTitle: 'systemTools.audio.userRealtime.title',
          description: 'systemTools.audio.userRealtime.description',
          checked: false,
          handler: () => {},
          initialState: false,
          check: { type: 'group', name: 'realtime' },
        },
      ],
    },
  ];

  private readonly appService = inject(AppService);

  async ngOnInit() {
    void debug('Initializing system tools');
    const checkPromises: Promise<any[]>[] = [this.getActiveServices(), this.getInstalledPkgs()];
    const [services, pkgs] = await Promise.all(checkPromises);

    this.loading.set(false);
    this.systemdServices.set(services);
    this.installedPackages.set(pkgs);

    for (const service of this.sections) {
      void trace(`Checking ${service.name}`);
      for (const entry of service.entries) {
        if (entry.check.type === 'pkg') {
          void trace(`Checking package ${entry.check.name} as pkg`);

          entry.checked = this.installedPackages().includes(entry.check.name);
          entry.initialState = this.installedPackages().includes(entry.check.name);
        } else if (entry.check.type === 'service') {
          void trace(`Checking service ${entry.check.name} as service`);

          entry.checked = this.systemdServices().find((s) => s.unit === entry.check.name) !== undefined;
          entry.initialState = this.systemdServices().find((s) => s.unit === entry.check.name) !== undefined;
        }
      }
    }

    void debug(JSON.stringify(this.sections));
    void debug('System tools initialized');
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

  async getInstalledPkgs(): Promise<string[]> {
    const cmd = `pacman -Qq`;
    const result: string[] | null = await this.appService.getCommandOutput<string[]>(cmd, (stdout: string) =>
      stdout.split('\n'),
    );

    if (result) return result;
    return [];
  }

  clear(table: Table) {
    table.clear();
    this.serviceSearch.set('');
  }
}
