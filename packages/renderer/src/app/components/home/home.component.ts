import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Card } from 'primeng/card';
import { RouterLink } from '@angular/router';
import { ElectronShellService } from '../electron-services';
import type { ExternalLink, HomepageLink } from '../../interfaces';
import { ConfigService } from '../config/config.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBluesky,
  faDiscord,
  faDiscourse,
  faMastodon,
  faTelegram,
} from '@fortawesome/free-brands-svg-icons';
import { faComments } from '@fortawesome/free-solid-svg-icons';
import { NgOptimizedImage } from '@angular/common';
import { SystemStatusComponent } from '../system-status/system-status.component';
import { MessageToastService } from '@garudalinux/core';
import { TaskManagerService } from '../task-manager/task-manager.service';
import { OsInteractService } from '../task-manager/os-interact.service';

@Component({
  selector: 'rani-home',
  imports: [
    TranslocoDirective,
    Card,
    RouterLink,
    FaIconComponent,
    NgOptimizedImage,
    SystemStatusComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
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
  private readonly messageToastService = inject(MessageToastService);
  private readonly translocoService = inject(TranslocoService);
  private readonly taskManagerService = inject(TaskManagerService);
  private readonly osInteractService = inject(OsInteractService);
  private readonly shellService = new ElectronShellService();

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
      command: async () =>
        this.osInteractService
          .ensurePackageArchlinux('garuda-boot-options')
          .then((installed) => {
            if (installed) {
              this.taskManagerService.executeAndWaitBash(
                '/usr/lib/garuda/pkexec-gui garuda-boot-options',
              );
            }
          }),
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
      command: async () =>
        this.osInteractService
          .ensurePackageArchlinux('garuda-network-assistant')
          .then((installed) => {
            if (installed) {
              this.taskManagerService.executeAndWaitBash(
                '/usr/lib/garuda/pkexec-gui garuda-network-assistant',
              );
            }
          }),
    },
    {
      title: 'welcome.install',
      subTitle: 'welcome.installSub',
      command: async () => {
        const result =
          await this.taskManagerService.executeAndWaitBash('sudo -E calamares');
        if ('code' in result && result.code !== 0) {
          this.messageToastService.error(
            this.translocoService.translate('welcome.error'),
            result.stderr as string,
          );
        }
      },
      icon: 'pi pi-download',
      condition: () => this.configService.state().isLiveSystem === true,
    },
    {
      title: 'welcome.chroot',
      subTitle: 'welcome.chrootSub',
      command: async () => {
        const result = await this.shellService.execute('launch-terminal', [
          "pkexec garuda-chroot -a; read -p 'Press enter to exit'",
        ]);
        if ('code' in result && result.code !== 0) {
          this.messageToastService.error(
            this.translocoService.translate('welcome.error'),
            result.stderr as string,
          );
        }
      },
      icon: 'pi pi-refresh',
      condition: () => this.configService.state().isLiveSystem === true,
    },
    {
      title: 'welcome.setupAssistant',
      subTitle: 'welcome.setupAssistantSub',
      command: async () =>
        this.osInteractService
          .ensurePackageArchlinux('garuda-setup-assistant')
          .then((installed) => {
            if (installed) {
              this.taskManagerService.executeAndWaitBash(
                'setup-assistant',
                true,
              );
            }
          }),
      icon: 'pi pi-download',
      condition: () => this.configService.state().isLiveSystem === false,
    },
    {
      title: 'welcome.startpage',
      subTitle: 'welcome.startpageSub',
      routerLink: '/update',
      command: () => void open('https://start.garudalinux.org'),
      icon: 'pi pi-refresh',
      condition: () => this.configService.state().isLiveSystem === false,
    },
  ];

  /**
   * Respond to a click on an item.
   * @param item The item that was clicked.
   */
  respondClick(item: any) {
    if (item.command) {
      void item.command();
    } else if (item.externalLink) {
      void this.shellService.open(item.externalLink);
    }
  }
}
