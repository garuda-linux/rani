import { Component, inject, OnInit, signal } from '@angular/core';
import { hostname } from '@tauri-apps/plugin-os';
import { TranslocoDirective } from '@jsverse/transloco';
import { Card } from 'primeng/card';
import { RouterLink } from '@angular/router';
import { AppService } from '../app.service';

@Component({
  selector: 'app-home',
  imports: [TranslocoDirective, Card, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  codeName = signal<string | null>(null);
  hostname = signal<string | null>(null);

  mainLinks = [
    {
      title: 'welcome.maintenance',
      subTitle: 'welcome.maintenanceSub',
      routerLink: '/maintenance',
      icon: 'pi pi-desktop',
    },
    {
      title: 'welcome.systemTools',
      subTitle: 'welcome.systemToolsSub',
      routerLink: '/system-tools',
      icon: 'pi pi-microchip',
    },
    {
      title: 'welcome.gaming',
      subTitle: 'welcome.gamingSub',
      routerLink: '/gaming',
      icon: 'pi pi-play-circle',
    },
    {
      title: 'welcome.bootTools',
      subTitle: 'welcome.bootToolsSub',
      routerLink: '/boot-tools',
      icon: 'pi pi-hammer',
    },
    {
      title: 'welcome.diagnostics',
      subTitle: 'welcome.diagnosticsSub',
      routerLink: '/diagnostics',
      icon: 'pi pi-info-circle',
    },
    {
      title: 'welcome.network',
      subTitle: 'welcome.networkSub',
      routerLink: '/network',
      icon: 'pi pi-globe',
    },
  ];

  private readonly appService = inject(AppService);

  async ngOnInit(): Promise<void> {
    const host: string | null = await hostname();
    this.codeName.set(await this.getCodeName());
    this.hostname.set(host);
  }

  async getCodeName(): Promise<string> {
    const cmd = 'lsb_release -c';
    const result = await this.appService.getCommandOutput<string>(cmd, (output: string) => output.split(':')[1].trim());

    if (result) {
      return result.match(/[A-Z][a-z]+/g)?.join(' ') ?? 'Unknown';
    }
    return 'Unknown';
  }
}
