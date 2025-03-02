import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Card } from 'primeng/card';
import { RouterLink } from '@angular/router';
import { PrivilegeManagerService } from '../privilege-manager/privilege-manager.service';
import { ChildProcess, Command, open } from '@tauri-apps/plugin-shell';
import { ExternalLink, HomepageLink } from '../interfaces';
import { ConfigService } from '../config/config.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBluesky, faDiscord, faDiscourse, faMastodon, faTelegram } from '@fortawesome/free-brands-svg-icons';
import { faComments } from '@fortawesome/free-solid-svg-icons';
import { NgOptimizedImage } from '@angular/common';
import { SystemStatusComponent } from '../system-status/system-status.component';
import { MessageToastService } from '@garudalinux/core';

@Component({
  selector: 'app-home',
  imports: [TranslocoDirective, Card, RouterLink, FaIconComponent, NgOptimizedImage, SystemStatusComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
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
      icon: 'gitlab.png',
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
      icon: 'whoogle.svg',
    },
    {
      title: 'Vaultwarden',
      subTitle: 'Bitwarden compatible, secure password manager',
      externalLink: 'https://bitwarden.garudalinux.org',
      icon: 'vaultwarden.svg',
    },
    {
      title: 'Donate',
      subTitle: 'Support the Garuda Linux project',
      externalLink: 'https://garudalinux.org/donate',
      icon: 'garuda-orange.webp',
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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageToastService = inject(MessageToastService);
  private readonly translocoService = inject(TranslocoService);
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
      // routerLink: '/boot-tools',
      icon: 'pi pi-hammer',
      command: () => this.privilegeManager.executeCommandAsSudo('garuda-boot-options', true),
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

  ngOnInit(): void {
    this.setupDynamicLinks();
  }

  /**
   * Respond to a click on an item.
   * @param item The item that was clicked.
   */
  respondClick(item: any) {
    if (item.command) {
      void item.command();
    } else if (item.externalLink) {
      void open(item.externalLink);
    }
  }

  /**
   * Set up any dynamic links that need to be added.
   */
  setupDynamicLinks(): void {
    if (this.configService.state().isLiveSystem) {
      // On live we have polkit rules for Calamares set up, so no need to authenticate with a password first
      this.mainLinks.push(
        {
          title: 'welcome.install',
          subTitle: 'welcome.installSub',
          command: async () => {
            const result: ChildProcess<string> = await Command.create('exec-bash', [
              '-c',
              'sudo -E calamares',
            ]).execute();
            if (result.code !== 0) {
              this.messageToastService.error(this.translocoService.translate('welcome.error'), result.stderr);
            }
          },
          icon: 'pi pi-download',
        },
        {
          title: 'welcome.chroot',
          subTitle: 'welcome.chrootSub',
          routerLink: '/update',
          command: async () => {
            const result: ChildProcess<string> = await this.privilegeManager.executeCommandAsSudo(
              'garuda-chroot -a',
              true,
            );
            if (result.code !== 0) {
              this.messageToastService.error(this.translocoService.translate('welcome.error'), result.stderr);
            }
          },
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

    this.cdr.markForCheck();
  }
}
