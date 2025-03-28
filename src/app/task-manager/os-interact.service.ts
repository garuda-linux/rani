import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { type Task, TaskManagerService } from './task-manager.service';
import { ConfigService } from '../config/config.service';
import {
  defaultDnsProvider,
  type DnsProvider,
  type DnsProviderEntry,
  dnsProviders,
  type ShellEntry,
  shells,
} from '../system-settings/types';
import type { ChildProcess } from '@tauri-apps/plugin-shell';
import { Logger } from '../logging/logging';

@Injectable({
  providedIn: 'root',
})
export class OsInteractService {
  private readonly configService = inject(ConfigService);
  private readonly logger = Logger.getInstance();
  private readonly taskManagerService = inject(TaskManagerService);

  // A list of all currently installed packages
  private readonly installedPackages = signal<Map<string, boolean>>(new Map());
  private readonly currentLocales = signal<Map<string, boolean>>(new Map());
  private readonly currentServices = signal<Map<string, boolean>>(new Map());
  private readonly currentServicesUser = signal<Map<string, boolean>>(new Map());
  private readonly currentGroups = signal<Map<string, boolean>>(new Map());

  private readonly currentDNS = signal<DnsProvider>(defaultDnsProvider);
  private readonly currentShell = signal<ShellEntry | null>(null);
  private readonly currentHblock = signal<boolean>(false);

  private readonly wantedPackages = signal<Map<string, boolean>>(new Map());
  private readonly wantedLocales = signal<Map<string, boolean>>(new Map());
  private readonly wantedPackagesAur = signal<Map<string, boolean>>(new Map());
  private readonly wantedServices = signal<Map<string, boolean>>(new Map());
  private readonly wantedServicesUser = signal<Map<string, boolean>>(new Map());
  private readonly wantedGroups = signal<Map<string, boolean>>(new Map());

  readonly wantedDns = signal<DnsProvider | null>(null);
  readonly wantedShell = signal<ShellEntry | null>(null);
  readonly wantedHblock = signal<boolean | null>(null);

  readonly packages = computed(() => {
    return new Map([...this.installedPackages(), ...this.wantedPackages(), ...this.wantedPackagesAur()]);
  });
  readonly locales = computed(() => {
    return new Map([...this.currentLocales(), ...this.wantedLocales()]);
  });
  readonly services = computed(() => {
    return new Map([...this.currentServices(), ...this.wantedServices()]);
  });
  readonly servicesUser = computed(() => {
    return new Map([...this.currentServicesUser(), ...this.wantedServicesUser()]);
  });
  readonly groups = computed(() => {
    return new Map([...this.currentGroups(), ...this.wantedGroups()]);
  });

  readonly dns = computed(() => {
    return this.wantedDns() ?? this.currentDNS();
  });
  readonly shell = computed(() => {
    return this.wantedShell() ?? this.currentShell();
  });
  readonly hblock = computed(() => {
    return this.wantedHblock() ?? this.currentHblock();
  });

  constructor() {
    effect(() => {
      if (!this.taskManagerService.running()) {
        void untracked(async () => await this.update());
      }
    });
    effect(() => {
      this.wantedPackages.set(this.wantedPrune(untracked(this.wantedPackages), this.installedPackages()));
      this.wantedPackagesAur.set(this.wantedPrune(untracked(this.wantedPackagesAur), this.installedPackages()));
      this.wantedServices.set(this.wantedPrune(untracked(this.wantedServices), this.currentServices()));
      this.wantedServicesUser.set(this.wantedPrune(untracked(this.wantedServicesUser), this.currentServicesUser()));
      this.wantedGroups.set(this.wantedPrune(untracked(this.wantedGroups), this.currentGroups()));
      this.wantedLocales.set(this.wantedPrune(untracked(this.wantedLocales), this.currentLocales()));
    });
    effect(() => this.generateTasks());
  }

  /**
   * Generate the tasks to be executed based on the wanted state and the current state.
   * @private
   */
  private generateTasks(): void {
    let install: string[] = [];
    let uninstall: string[] = [];
    let installAur: string[] = [];
    let enable: string[] = [];
    let disable: string[] = [];
    let enableUser: string[] = [];
    let disableUser: string[] = [];
    let groupAdd: string[] = [];
    let groupRemove: string[] = [];
    let localeAdd: string[] = [];
    let localeRemove: string[] = [];

    for (const [pkg, wanted] of this.wantedPackages()) {
      if (wanted) {
        install.push(pkg);
      } else {
        uninstall.push(pkg);
      }
    }

    for (const [pkg, wanted] of this.wantedPackagesAur()) {
      if (wanted) {
        installAur.push(pkg);
      } else {
        uninstall.push(pkg);
      }
    }

    for (const [service, wanted] of this.wantedServices()) {
      if (wanted) {
        enable.push(service);
      } else {
        disable.push(service);
      }
    }

    for (const [service, wanted] of this.wantedServicesUser()) {
      if (wanted) {
        enableUser.push(service);
      } else {
        disableUser.push(service);
      }
    }

    for (const [group, wanted] of this.wantedGroups()) {
      if (wanted) {
        groupAdd.push(group);
      } else {
        groupRemove.push(group);
      }
    }

    for (const [locale, wanted] of this.wantedLocales()) {
      this.logger.trace(`Locale ${locale} wanted: ${wanted}`);
      if (wanted) {
        localeAdd.push(locale);
      } else {
        localeRemove.push(locale);
      }
    }

    let script_packages = '';
    if (uninstall.length > 0) {
      script_packages += `pacman --noconfirm -R ${uninstall.join(' ')}\n`;
    }
    if (install.length > 0) {
      script_packages += `pacman --noconfirm -S ${install.join(' ')}\n`;
    }

    let script_packages_aur = '';
    if (installAur.length > 0) {
      script_packages_aur += `paru --noconfirm -S ${install.join(' ')}`;
    }

    let script_services = '';
    if (enable.length > 0) {
      script_services += `systemctl enable --now ${enable.join(' ')}\n`;
    }
    if (disable.length > 0) {
      script_services += `systemctl disable --now ${disable.join(' ')}\n`;
    }

    if (this.dns() !== this.currentDNS()) {
      const file = '/etc/NetworkManager/conf.d/10-garuda-assistant-dns.conf';
      if (this.dns().ips[0] === '0.0.0.0') {
        script_services += `
            set -e
            rm -f "${file}"
            nmcli general reload
            echo "DNS settings changed."
            `;
      } else {
        script_services += `
            set -e
            echo -e "[global-dns-domain-*]\\nservers=${this.dns().ips[0]}" > "${file}"
            nmcli general reload
            echo "DNS settings changed."
            `;
      }
    }

    const shell = this.shell();
    if (shell !== null && shell !== this.currentShell()) {
      script_services += `
            set -e
            chsh -s $(which ${shell.name}) ${this.configService.state().user}
            echo "Shell changed."
            `;
    }

    if (this.hblock() !== this.currentHblock()) {
      if (this.hblock()) {
        script_services += `systemctl enable --now hblock.timer && hblock\n`;
      } else {
        script_services += `systemctl disable --now hblock.timer && hblock -S none -D none\n`;
      }
    }

    let script_services_user = '';
    if (enableUser.length > 0) {
      script_services_user += `systemctl --user enable --now ${enableUser.join(' ')}\n`;
    }
    if (disableUser.length > 0) {
      script_services_user += `systemctl --user disable --now ${disableUser.join(' ')}\n`;
    }

    let script_groups = '';
    if (groupAdd.length > 0) {
      for (let group of groupAdd) {
        script_groups += `gpasswd -a ${this.configService.state().user} ${group}\n`;
      }
    }
    if (groupRemove.length > 0) {
      for (let group of groupRemove) {
        script_groups += `gpasswd -d ${this.configService.state().user} ${group}\n`;
      }
    }

    let sedExpressions: string[] = [];
    let script_locales = '';
    if (localeAdd.length > 0) {
      for (const locale of localeAdd) {
        sedExpressions.push(`-e 's/\#${locale}/${locale}/'`);
      }
    }
    if (localeRemove.length > 0) {
      for (const locale of localeRemove) {
        sedExpressions.push(`-e 's/${locale}/\#${locale}/'`);
      }
    }
    if (sedExpressions.length > 0) script_locales = `sed -i ${sedExpressions.join(' ')} /etc/locale.gen\nlocale-gen\n`;

    untracked(() => {
      [
        this.taskManagerService.findTaskById('os-interact-packages'),
        this.taskManagerService.findTaskById('os-interact-packages-aur'),
        this.taskManagerService.findTaskById('os-interact-services'),
        this.taskManagerService.findTaskById('os-interact-services-user'),
        this.taskManagerService.findTaskById('os-interact-groups'),
        this.taskManagerService.findTaskById('os-interact-locales'),
      ].forEach((task) => {
        if (task !== null) {
          this.taskManagerService.removeTask(task!);
        }
      });
    });

    const tasks: any[] = [];

    if (script_packages !== '')
      tasks.push(
        this.taskManagerService.createTask(
          8,
          'os-interact-packages',
          true,
          'os-interact.packages',
          'pi pi-box',
          script_packages,
        ),
      );
    if (script_packages_aur !== '')
      tasks.push(
        this.taskManagerService.createTask(
          9,
          'os-interact-packages-aur',
          true,
          'os-interact.packages-aur',
          'pi pi-box',
          script_packages_aur,
        ),
      );
    if (script_groups !== '')
      tasks.push(
        this.taskManagerService.createTask(
          11,
          'os-interact-groups',
          true,
          'os-interact.groups',
          'pi pi-users',
          script_groups,
        ),
      );
    if (script_services !== '')
      tasks.push(
        this.taskManagerService.createTask(
          12,
          'os-interact-services',
          true,
          'os-interact.services',
          'pi pi-receipt',
          script_services,
        ),
      );
    if (script_services_user !== '')
      tasks.push(
        this.taskManagerService.createTask(
          12,
          'os-interact-services-user',
          false,
          'os-interact.services-user',
          'pi pi-receipt',
          script_services_user,
        ),
      );
    if (script_locales !== '')
      tasks.push(
        this.taskManagerService.createTask(
          13,
          'os-interact-locales',
          true,
          'os-interact.locales',
          'pi pi-languages',
          script_locales,
        ),
      );

    tasks.forEach((task) => {
      this.taskManagerService.scheduleTask(task);
    });
  }

  /**
   * Prune the wanted map based on the current state.
   * @param wanted The wanted map.
   * @param current The current map.
   * @private
   */
  private wantedPrune(wanted: Map<string, boolean>, current: Map<string, boolean>): Map<string, boolean> {
    return new Map(
      [...wanted].filter(([key, value]) => {
        if (!current.has(key)) {
          return value;
        } else {
          return current.get(key) !== value;
        }
      }),
    );
  }

  /**
   * Update the current state of the system asynchronously.
   */
  async update(): Promise<void> {
    const [services, servicesUser, installedPackages, groups, dns, shell, hblock, locales] = await Promise.all([
      this.getServices(),
      this.getUserServices(),
      this.getInstalledPackages(),
      this.getGroups(),
      this.getDNS(),
      this.getShell(),
      this.getHblock(),
      this.getLocales(),
    ]);
    this.installedPackages.set(installedPackages);
    this.currentServices.set(services);
    this.currentServicesUser.set(servicesUser);
    this.currentGroups.set(groups);
    this.currentDNS.set(dns);
    this.currentShell.set(shell);
    this.currentHblock.set(hblock);
    this.currentLocales.set(locales);
  }

  /**
   * Get the currently installed packages.
   * @returns A map of the installed packages.
   * @private
   */
  private async getInstalledPackages(): Promise<Map<string, boolean>> {
    const cmd = 'pacman -Qq';
    const result: ChildProcess<string> = await this.taskManagerService.executeAndWaitBash(cmd);
    if (result.code !== 0) {
      return new Map<string, boolean>();
    }

    return result.stdout
      .trim()
      .split('\n')
      .reduce((map, pkg) => {
        map.set(pkg, true);
        return map;
      }, new Map<string, boolean>());
  }

  /**
   * Get the current services.
   * @returns A map of the services.
   * @private
   */
  private async getServices(): Promise<Map<string, boolean>> {
    const cmd = 'systemctl list-units --type service,socket --full --output json --no-pager';
    const commandoutput: ChildProcess<string> = await this.taskManagerService.executeAndWaitBash(cmd);
    const result = JSON.parse(commandoutput.stdout.trim()) as any[];

    const services = new Map<string, boolean>();
    for (const service of result) {
      services.set(service['unit'], service['active'] === 'active');
    }

    return services;
  }

  /**
   * Get the current groups of the user.
   * @returns A map of the groups.
   * @private
   */
  private async getUserServices(): Promise<Map<string, boolean>> {
    const cmd = 'systemctl --user list-units --type service,socket --full --output json --no-pager';
    const commandoutput: ChildProcess<string> = await this.taskManagerService.executeAndWaitBash(cmd);
    const result = JSON.parse(commandoutput.stdout.trim()) as any[];

    const services = new Map<string, boolean>();
    for (const service of result) {
      services.set(service['unit'], service['active'] === 'active');
    }

    return services;
  }

  /**
   * Get the current groups of the user.
   * @returns A map of the groups.
   * @private
   */
  private async getGroups(): Promise<Map<string, boolean>> {
    const cmd = `groups ${this.configService.state().user} | cut -d ' ' -f 3-`;
    const result: ChildProcess<string> = await this.taskManagerService.executeAndWaitBash(cmd);
    if (result.code !== 0) {
      return new Map<string, boolean>();
    }

    return result.stdout
      .trim()
      .split(' ')
      .reduce((map, group) => {
        map.set(group, true);
        return map;
      }, new Map<string, boolean>());
  }

  /**
   * Get the current DNS provider.
   * @returns The current DNS provider.
   * @private
   */
  private async getDNS(): Promise<DnsProvider> {
    const cmd = 'cat /etc/resolv.conf | grep nameserver | head -n 1 | cut -d " " -f 2';
    const result: ChildProcess<string> = await this.taskManagerService.executeAndWaitBash(cmd);
    if (result.code !== 0) return defaultDnsProvider;

    const ip: string = result.stdout.trim();
    const provider: DnsProviderEntry | undefined = dnsProviders.find((provider) => provider.ips.includes(ip));
    if (provider) {
      return provider;
    }
    return defaultDnsProvider;
  }

  /**
   * Get the current shell of the user.
   * @returns The shell entry or null if not found.
   * @private
   */
  private async getShell(): Promise<ShellEntry | null> {
    const cmd = `basename $(/usr/bin/getent passwd $USER | awk -F':' '{print $7}')`;
    const result: ChildProcess<string> = await this.taskManagerService.executeAndWaitBash(cmd);
    if (result.code !== 0) {
      return null;
    }
    const shell: string = result.stdout.trim();
    return shells.find((entry) => entry.name === shell) ?? null;
  }

  /**
   * Get the current state of hblock.
   * @returns Whether hblock is enabled.
   * @private
   */
  private async getHblock(): Promise<boolean> {
    const cmd = 'cat /etc/hosts | grep -A1 "Blocked domains" | awk \'/Blocked domains/ { print $NF }\'';
    const result: ChildProcess<string> = await this.taskManagerService.executeAndWaitBash(cmd);
    if (result.code !== 0) {
      return false;
    }
    return parseInt(result.stdout.trim()) > 0;
  }

  /**
   * Toggle a package.
   * @param pkg The package to toggle.
   * @param remove Whether to remove the package.
   */
  togglePackage(pkg: string, remove: boolean = false): void {
    let arrow = (wanted: Map<string, boolean>) => {
      if (remove) {
        if (wanted.has(pkg)) {
          let newMap: Map<string, boolean> = new Map(wanted);
          newMap.delete(pkg);
          return newMap;
        }
        return wanted;
      }
      let newMap: Map<string, boolean> = new Map(wanted);
      newMap.set(pkg, this.packages().has(pkg) ? !this.packages().get(pkg) : true);
      return this.wantedPrune(newMap, this.installedPackages());
    };
    this.wantedPackages.update(arrow);
  }

  /**
   * Toggle a system service.
   * @param service The service to toggle.
   * @param remove Whether to remove the service.
   */
  toggleService(service: string, remove: boolean = false): void {
    this.wantedServices.update((wanted) => {
      // If already in the map, remove it
      if (wanted.has(service)) {
        let newMap: Map<string, boolean> = new Map(wanted);
        newMap.delete(service);
        return newMap;
      } else if (!remove) {
        // Otherwise, add it
        let newMap: Map<string, boolean> = new Map(wanted);
        newMap.set(service, this.services().has(service) ? !this.services().get(service) : true);
        return newMap;
      }
      return wanted;
    });
  }

  /**
   * Toggle a service for the current user.
   * @param service The service to toggle.
   * @param remove Whether to remove the service.
   */
  toggleServiceUser(service: string, remove: boolean = false): void {
    this.wantedServicesUser.update((wanted) => {
      // If already in the map, remove it
      if (wanted.has(service)) {
        let newMap: Map<string, boolean> = new Map(wanted);
        newMap.delete(service);
        return newMap;
      } else if (!remove) {
        // Otherwise, add it
        let newMap: Map<string, boolean> = new Map(wanted);
        newMap.set(service, this.servicesUser().has(service) ? !this.servicesUser().get(service) : true);
        return newMap;
      }
      return wanted;
    });
  }

  /**
   * Toggle a group.
   * @param group The group to toggle.
   * @param remove Whether to remove the group.
   * @private
   */
  toggleGroup(group: string, remove: boolean = false): void {
    this.wantedGroups.update((wanted) => {
      // If already in the map, remove it
      if (wanted.has(group)) {
        let newMap: Map<string, boolean> = new Map(wanted);
        newMap.delete(group);
        return newMap;
      } else if (!remove) {
        // Otherwise, add it
        let newMap: Map<string, boolean> = new Map(wanted);
        newMap.set(group, !this.groups().has(group));
        return newMap;
      }
      return wanted;
    });
  }

  /**
   * Toggle a system tool entry.
   * @param name The name of the entry to toggle.
   * @param type The type of the entry (pkg, service, serviceUser, group).
   * @param remove Whether to remove the entry.
   */
  toggle(name: string, type: string, remove: boolean = false): void {
    switch (type) {
      case 'pkg':
        this.togglePackage(name, remove);
        break;
      case 'service':
        this.toggleService(name, remove);
        break;
      case 'serviceUser':
        this.toggleServiceUser(name, remove);
        break;
      case 'group':
        this.toggleGroup(name, remove);
        break;
    }
  }

  /**
   * Check if a package is considered to be "active" for the purpose of the application.
   * This does not necessarily mean that the package is installed, but may mean that the package is meant for installation.
   * When current is set to true, it will check if the package is currently actually installed. Usage of this should be avoided.
   * Think twice, why would you want to check if a package is actually installed? If a package is active, it will be installed if it is not installed anyway.
   * @param name The name of the package/service/group to check.
   * @param type The type of the entry to check (pkg, service, serviceUser, group).
   * @param current Whether to check if the package is currently installed. (Do not use this unless you have a very good reason to do so)
   * @returns Whether the package is active/installed as a boolean.
   */
  check(name: string, type: string, current: boolean = false): boolean {
    switch (type) {
      case 'pkg':
        return current ? this.installedPackages().get(name) == true : this.packages().get(name) == true;
      case 'service':
        return current ? this.currentServices().get(name) == true : this.services().get(name) == true;
      case 'serviceUser':
        return current ? this.currentServicesUser().get(name) == true : this.servicesUser().get(name) == true;
      case 'group':
        return current ? this.currentGroups().get(name) == true : this.groups().get(name) == true;
    }
    return false;
  }

  /**
   * Check if a package is installed already.
   * @param pkg The name of the package to check.
   * @returns Whether the package is installed as a boolean.
   * @private
   */
  private async isPackageInstalledArchlinux(pkg: string): Promise<boolean> {
    const result: ChildProcess<string> = await this.taskManagerService.executeAndWaitBash(`pacman -Qq ${pkg}`);
    return result.code === 0;
  }

  /**
   * Ensure that a package/command is installed
   * @param pkg The name of the package that will be installed if the executable is not found.
   * @returns Whether the package is installed as a boolean.
   */
  async ensurePackageArchlinux(pkg: string): Promise<boolean> {
    if (this.packages().get(pkg) !== true) {
      const task: Task = this.taskManagerService.createTask(
        0,
        'install-' + pkg,
        true,
        `Install ${pkg}`,
        'pi pi-box',
        `pacman -S --noconfirm ${pkg}`,
      );
      await this.taskManagerService.executeTask(task);
      return await this.isPackageInstalledArchlinux(pkg);
    }
    return true;
  }

  /**
   * Get the available language packs from the system and process them.
   * @returns A promise that resolves when the language packs are processed
   */
  private async getLocales(): Promise<Map<string, boolean>> {
    const cmd = 'localectl list-locales';
    const result: ChildProcess<string> = await this.taskManagerService.executeAndWaitBash(cmd);
    if (result.code !== 0) {
      return new Map<string, boolean>();
    }

    return result.stdout
      .trim()
      .split('\n')
      .reduce((map, locale) => {
        map.set(locale, true);
        return map;
      }, new Map<string, boolean>());
  }

  /**
   * Toggle a locale.
   * @param locale The locale to toggle.
   * @param remove Whether to remove the locale.
   */
  toggleLocale(locale: string, remove: boolean = false): void {
    this.wantedLocales.update((wanted) => {
      if (wanted.has(locale)) {
        let newMap: Map<string, boolean> = new Map(wanted);
        newMap.delete(locale);
        return newMap;
      } else if (!remove) {
        let newMap: Map<string, boolean> = new Map(wanted);
        newMap.set(locale, this.locales().has(locale) ? !this.locales().get(locale) : true);
        return newMap;
      }
      return wanted;
    });
  }
}
