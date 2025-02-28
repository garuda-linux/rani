import { Component, inject, OnInit, signal } from '@angular/core';
import { hostname } from '@tauri-apps/plugin-os';
import { TranslocoDirective } from '@jsverse/transloco';
import { Card } from 'primeng/card';
import { RouterLink } from '@angular/router';
import { PrivilegeManagerService } from '../privilege-manager/privilege-manager.service';
import { Command, open } from '@tauri-apps/plugin-shell';
import { OperationManagerService } from '../operation-manager/operation-manager.service';
import { ExternalLink, HomepageLink } from '../interfaces';
import { Nullable } from 'primeng/ts-helpers';
import { ConfigService } from '../config/config.service';
import { Logger } from '../logging/logging';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBluesky,
  faDiscord,
  faDiscourse,
  faGitlab,
  faMastodon,
  faTelegram,
} from '@fortawesome/free-brands-svg-icons';
import { faComments, faDonate, faVault } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-home',
  imports: [TranslocoDirective, Card, RouterLink, FaIconComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  codeName = signal<Nullable<string>>(null);
  hostname = signal<Nullable<string>>(null);
  isLiveSystem = signal<boolean>(false);

  webLinks: ExternalLink[] = [
    // {
    //   title: 'Garuda Wiki',
    //   subTitle: 'Inform yourself about various Garuda Linux related things',
    //   externalLink: 'https://wiki.garudalinux.org',
    //   icon: 'pi pi-book',
    // },
    {
      title: 'GitLab',
      subTitle: 'Have a look at our source code',
      externalLink: 'https://gitlab.com/garuda-linux',
      icon: faGitlab,
    },
    {
      title: 'Chaotic-AUR',
      subTitle: 'Take a look at package updates and more',
      externalLink: 'https://aur.chaotic.cx',
      icon: 'chaotic-aur.png',
    },
    {
      title: 'SearxNG',
      subTitle: 'Privacy respecting search engine',
      externalLink: 'https://searx.garudalinux.org',
      icon: 'searxng.svg',
    },
    {
      title: 'Whoogle',
      subTitle: 'Google search engine proxy',
      externalLink: 'https://search.garudalinux.org',
      icon: 'whoogle.webp',
    },
    {
      title: 'Vaultwarden',
      subTitle: 'Bitwarden compatible, secure password manager',
      externalLink: 'https://bitwarden.garudalinux.org',
      icon: faVault,
    },
    {
      title: 'Donate',
      subTitle: 'Support the Garuda Linux project',
      externalLink: 'https://garudalinux.org/donate',
      icon: faDonate,
    },
  ];
  contactLinks: ExternalLink[] = [
    {
      title: 'Forum',
      subTitle: 'Visit the Garuda Linux Forum',
      externalLink: 'https://forum.garudalinux.org',
      icon: faDiscourse,
    },
    {
      title: 'Telegram',
      subTitle: 'Visit the Telegram channel',
      externalLink: 'https://garudalinux.org/telegram',
      icon: faTelegram,
    },
    {
      title: 'Discord',
      subTitle: 'Visit the Telegram channel',
      externalLink: 'https://garudalinux.org/discord',
      icon: faDiscord,
    },
    {
      title: 'Mastodon',
      subTitle: 'Visit the Telegram channel',
      externalLink: 'https://social.garudalinux.org',
      icon: faMastodon,
    },
    {
      title: 'BlueSky',
      subTitle: 'Visit the Telegram channel',
      externalLink: 'https://bsky.app/profile/garudalinux.org',
      icon: faBluesky,
    },
    {
      title: 'IRC',
      subTitle: 'Join the interconnected IRC channel',
      externalLink: 'https://irc.garudalinux.org',
      icon: faComments,
    },
  ];

  protected readonly configService = inject(ConfigService);
  private readonly logger = Logger.getInstance();
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
    void this.checkLive();
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

  /**
   * Check if the system is a live system.
   * @private
   */
  private async checkLive(): Promise<void> {
    const cmd = "df -T / |tail -n1 |awk '{print $2}'";
    const result: string | null = await this.operationManager.getCommandOutput<string>(cmd, (output: string) =>
      output.trim(),
    );
    this.logger.debug(
      `Filesystem type: ${result}, is ${result === 'aufs' || result === 'overlay' ? 'live' : 'installed'}`,
    );

    if (result && (result === 'aufs' || result === 'overlay')) {
      this.isLiveSystem.set(true);

      // On live we have polkit rules for Calamares set up, so no need to authenticate with a password first
      this.mainLinks.push(
        {
          title: 'welcome.install',
          subTitle: 'welcome.installSub',
          command: () => void Command.create('exec-bash', ['-c', 'sudo calamares']),
          icon: 'pi pi-download',
        },
        {
          title: 'welcome.chroot',
          subTitle: 'welcome.chrootSub',
          routerLink: '/update',
          command: () => this.privilegeManager.executeCommandAsSudo('garuda-chroot -a', true),
          icon: 'pi pi-refresh',
        },
      );
    } else {
      this.mainLinks.push(
        {
          title: 'welcome.setupAssistant',
          subTitle: 'welcome.setupAssistantSub',
          command: () => this.privilegeManager.ensurePackageAndRun('garuda-setup-assistant', 'setup-assistant'),
          icon: 'pi pi-download',
        },
        {
          title: 'welcome.startpage',
          subTitle: 'welcome.startpageSub',
          routerLink: '/update',
          command: () => void open('https://start.garudalinux.org'),
          icon: 'pi pi-refresh',
        },
      );
    }
  }
}
