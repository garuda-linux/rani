import { Component, OnInit, signal } from '@angular/core';
import { hostname, locale } from '@tauri-apps/plugin-os';
import { TranslocoDirective } from '@jsverse/transloco';
import { Card } from 'primeng/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [TranslocoDirective, Card, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  locale = signal<string | null>(null);
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

  async ngOnInit() {
    const locales = await locale();
    const hostnames = await hostname();
    this.locale.set(locales);
    this.hostname.set(hostnames);
  }
}
