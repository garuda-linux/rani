import { Component, inject, OnInit, signal } from '@angular/core';
import { hostname } from '@tauri-apps/plugin-os';
import { TranslocoDirective } from '@jsverse/transloco';
import { Card } from 'primeng/card';
import { RouterLink } from '@angular/router';
import { PrivilegeManagerService } from '../privilege-manager/privilege-manager.service';
import { open } from '@tauri-apps/plugin-shell';
import { OperationManagerService } from '../operation-manager/operation-manager.service';
import { ExternalLink, HomepageLink } from '../interfaces';
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
  webLinks: ExternalLink[] = [
    {
      title: 'Garuda Website',
      subTitle: 'Visit the Garuda Linux website',
      externalLink: 'https://garudalinux.org',
      icon: 'pi pi-globe',
    },
    {
      title: 'Donate',
      subTitle: 'Support the Garuda Linux project',
      externalLink: 'https://garudalinux.org/donate',
      icon: 'pi pi-heart',
    },
    {
      title: 'Garuda Wiki',
      subTitle: 'Inform yourself about various Garuda Linux related things',
      externalLink: 'https://wiki.garudalinux.org',
      icon: 'pi pi-book',
    },
    {
      title: 'Garuda GitLab',
      subTitle: 'Have a look at our source code',
      externalLink: 'https://gitlab.com/garuda-linux',
      icon: 'pi pi-code',
    },
    {
      title: 'Chaotic-AUR',
      subTitle: 'Take a look at package updates and more',
      externalLink: 'https://aur.chaotic.cx',
      icon: 'pi pi-external-link',
    },
    {
      title: 'SearxNG',
      subTitle: 'Privacy respecting search engine',
      externalLink: 'https://searx.garudalinux.org',
      icon: 'pi pi-search',
    },
    {
      title: 'Whoogle',
      subTitle: 'Google search engine proxy',
      externalLink: 'https://search.garudalinux.org',
      icon: 'pi pi-search',
    },
    {
      title: 'Vaultwarden',
      subTitle: 'Bitwarden compatible, secure password manager',
      externalLink: 'https://bitwarden.garudalinux.org',
      icon: 'pi pi-key',
    },
    {
      title: 'PrivateBin',
      subTitle: 'Secure, encrypted pastebin',
      externalLink: 'https://bin.garudalinux.org',
      icon: 'pi pi-clipboard',
    },
    {
      title: 'Uptime Status',
      subTitle: 'Garuda Linux infra status',
      externalLink: 'https://status.garudalinux.org',
      icon: 'pi pi-globe',
    },
  ];
  contactLinks: ExternalLink[] = [
    {
      title: 'Garuda Forum',
      subTitle: 'Visit the Garuda Linux Forum',
      externalLink: 'https://forum.garudalinux.org',
      icon: 'pi pi-comments',
    },
    {
      title: 'Telegram',
      subTitle: 'Visit the Telegram channel',
      externalLink: 'https://garudalinux.org/telegram',
      icon: 'pi pi-telegram',
    },
    {
      title: 'Discord',
      subTitle: 'Visit the Telegram channel',
      externalLink: 'https://garudalinux.org/discord',
      icon: 'pi pi-telegram',
    },
    {
      title: 'Mastodon',
      subTitle: 'Visit the Telegram channel',
      externalLink: 'https://social.garudalinux.org',
      icon: 'pi pi-telegram',
    },
    {
      title: 'BlueSky',
      subTitle: 'Visit the Telegram channel',
      externalLink: 'https://bsky.app/profile/garudalinux.org',
      icon: 'pi pi-telegram',
    },
    {
      title: 'IRC',
      subTitle: 'Join the interconnected IRC channel',
      externalLink: 'https://irc.garudalinux.org',
      icon: 'pi pi-telegram',
    },
  ];
  protected readonly appService = inject(AppService);
  private readonly operationManager = inject(OperationManagerService);
  private readonly privilegeManager = inject(PrivilegeManagerService);
  mainLinks: HomepageLink[] = [
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
      // routerLink: '/network',
      icon: 'pi pi-globe',
      command: () => this.privilegeManager.executeCommandAsSudo('garuda-network-assistant', true),
    },
  ];

  async ngOnInit(): Promise<void> {
    const host: string | null = await hostname();
    this.codeName.set(await this.getCodeName());
    this.hostname.set(host);
  }

  async getCodeName(): Promise<string> {
    const cmd = 'lsb_release -c';
    const result = await this.operationManager.getCommandOutput<string>(cmd, (output: string) =>
      output.split(':')[1].trim(),
    );

    if (result) {
      return result.match(/[A-Z][a-z]+/g)?.join(' ') ?? 'Unknown';
    }
    return 'Unknown';
  }

  respondClick(item: any) {
    if (item.command) {
      void item.command();
    } else if (item.externalLink) {
      void open(item.externalLink);
    }
  }
}
