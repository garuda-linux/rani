import { computed, effect, inject, Injectable, Signal, signal } from "@angular/core";
import { TaskManagerService } from "./task-manager.service";
import { ConfigService } from "../config/config.service";
import { SystemToolsSubEntry } from "../interfaces";

@Injectable({
    providedIn: 'root'
})
export class OsInteractService {
    private readonly taskManagerService = inject(TaskManagerService);
    private readonly configService = inject(ConfigService);

    // A list of all currently installed packages
    private readonly installedPackages = signal<Map<string, boolean>>(new Map());
    private readonly currentServices = signal<Map<string, boolean>>(new Map());
    private readonly currentServicesUser = signal<Map<string, boolean>>(new Map());
    private readonly currentGroups = signal<Map<string, boolean>>(new Map());

    private readonly wantedPackages = signal<Map<string, boolean>>(new Map());
    private readonly wantedPackagesAur = signal<Map<string, boolean>>(new Map());
    private readonly wantedServices = signal<Map<string, boolean>>(new Map());
    private readonly wantedServicesUser = signal<Map<string, boolean>>(new Map());
    private readonly wantedGroups = signal<Map<string, boolean>>(new Map());

    readonly packages = computed(() => { return new Map([...this.installedPackages(), ...this.wantedPackages(), ...this.wantedPackagesAur()]); });
    readonly services = computed(() => { return new Map([...this.currentServices(), ...this.wantedServices()]); });
    readonly servicesUser = computed(() => { return new Map([...this.currentServicesUser(), ...this.wantedServicesUser()]); });
    readonly groups = computed(() => { return new Map([...this.currentGroups(), ...this.wantedGroups()]); });

    constructor() {
        effect(() => {
            if (this.taskManagerService.running() === false) {
                (async () => {
                    await this.update();
                })();
            }
        });
        effect(() => {
            this.wantedPackages.update((wanted) => this.wantedPrune(wanted, this.installedPackages()));
            this.wantedPackagesAur.update((wanted) => this.wantedPrune(wanted, this.installedPackages()));
            this.wantedServices.update((wanted) => this.wantedPrune(wanted, this.currentServices()));
            this.wantedServicesUser.update((wanted) => this.wantedPrune(wanted, this.currentServicesUser()));
        });
        effect(() => {
            this.generateTasks();
        });
    }

    private generateTasks(): void {
        let install: string[] = [];
        let uninstall: string[] = [];
        let enable: string[] = [];
        let disable: string[] = [];
        let enableUser: string[] = [];
        let disableUser: string[] = [];
        let groupAdd: string[] = [];
        let groupRemove: string[] = [];

        for (const [pkg, wanted] of this.wantedPackages()) {
            if (wanted) {
                install.push(pkg);
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

        let script_packages = '';
        if (uninstall.length > 0) {
            script_packages += `pacman --noconfirm -R ${uninstall.join(' ')}\n`;
        }
        if (install.length > 0) {
            script_packages += `pacman --noconfirm -S ${install.join(' ')}\n`;
        }

        let script_packages_aur = '';
        if (uninstall.length > 0) {
            script_packages_aur += `paru --noconfirm -R ${uninstall.join(' ')}\n`;
        }
        if (install.length > 0) {
            script_packages_aur += `paru --noconfirm -S ${install.join(' ')}\n`;
        }

        let script_services = '';
        if (enable.length > 0) {
            script_services += `systemctl enable --now ${enable.join(' ')}\n`;
        }
        if (disable.length > 0) {
            script_services += `systemctl disable --now ${disable.join(' ')}\n`;
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
            script_groups += `gpasswd -a ${this.configService.state().user} ${groupAdd.join(' ')}\n`;
        }
        if (groupRemove.length > 0) {
            script_groups += `gpasswd -d ${this.configService.state().user} ${groupRemove.join(' ')}\n`;
        }

        [
            this.taskManagerService.findTaskById('os-interact-packages'),
            this.taskManagerService.findTaskById('os-interact-packages-aur'),
            this.taskManagerService.findTaskById('os-interact-services'),
            this.taskManagerService.findTaskById('os-interact-services-user'),
            this.taskManagerService.findTaskById('os-interact-groups'),
        ].forEach(task => {
            if (task !== undefined) {
                this.taskManagerService.removeTask(task!);
            }
        });

        const tasks: any[] = [];

        if (script_packages !== '')
            tasks.push(this.taskManagerService.createTask(2, 'os-interact-packages', true, 'os-interact.packages', 'pi pi-box', script_packages));
        if (script_packages_aur !== '')
            tasks.push(this.taskManagerService.createTask(2, 'os-interact-packages-aur', true, 'os-interact.packages-aur', 'pi pi-box', script_packages_aur));
        if (script_services !== '')
            tasks.push(this.taskManagerService.createTask(5, 'os-interact-services', true, 'os-interact.services', 'pi pi-receipt', script_services));
        if (script_services_user !== '')
            tasks.push(this.taskManagerService.createTask(5, 'os-interact-services-user', true, 'os-interact.services-user', 'pi pi-receipt', script_services_user));
        if (script_groups !== '')
            tasks.push(this.taskManagerService.createTask(7, 'os-interact-groups', true, 'os-interact.groups', 'pi pi-users', script_groups));

        tasks.forEach(task => {
            this.taskManagerService.scheduleTask(task);
        });
    }

    private wantedPrune(wanted: Map<string, boolean>, current: Map<string, boolean>): Map<string, boolean> {
        return new Map([...wanted].filter(([key, value]) => !current.has(key) || current.get(key) !== value));
    }

    async update(): Promise<void> {
        const [services, servicesUser, installedPackages] = await Promise.all([
            this.getServices(),
            this.getUserServices(),
            this.getInstalledPackages(),
        ]);
        this.installedPackages.set(installedPackages);
        this.currentServices.set(services);
        this.currentServicesUser.set(servicesUser);
    }

    private async getInstalledPackages(): Promise<Map<string, boolean>> {
        const cmd = 'pacman -Qq';
        const result = await this.taskManagerService.executeAndWaitBash(cmd);
        if (result.code !== 0) {
            return new Map<string, boolean>();
        }

        return result.stdout.split('\n').reduce((map, pkg) => { map.set(pkg, true); return map; }, new Map<string, boolean>());
    }

    private async getServices(): Promise<Map<string, boolean>> {
        const commandoutput = await this.taskManagerService.executeAndWaitBash('systemctl list-units --type service --full --output json --no-pager');
        const result = JSON.parse(commandoutput.stdout) as any[];

        const services = new Map<string, boolean>();
        for (const service of result) {
            services.set(service['unit'], service['active'] === 'active');
        }

        return services;
    }

    private async getUserServices(): Promise<Map<string, boolean>> {
        const commandoutput = await this.taskManagerService.executeAndWaitBash('systemctl --user list-units --type service --full --output json --no-pager');
        const result = JSON.parse(commandoutput.stdout) as any[];

        const services = new Map<string, boolean>();
        for (const service of result) {
            services.set(service['unit'], service['active'] === 'active');
        }

        return services;
    }

    togglePackage(pkg: string, aur: boolean = false): void {
        if (aur)
            this.wantedPackagesAur.update((wanted) => wanted.set(pkg, !this.packages().get(pkg)));
        else
            this.wantedPackages.update((wanted) => wanted.set(pkg, !this.packages().get(pkg)));
    }

    toggleService(service: string): void {
        this.wantedServices.update((wanted) => wanted.set(service, !this.services().get(service)));
    }

    toggleServiceUser(service: string): void {
        this.wantedServicesUser.update((wanted) => wanted.set(service, !this.servicesUser().get(service)));
    }

    toggleGroup(group: string): void {
        this.wantedGroups.update((wanted) => wanted.set(group, !this.groups().get(group)));
    }

    toggle(entry: SystemToolsSubEntry): void {
        switch (entry.check.type) {
            case 'pkg':
                this.togglePackage(entry.check.name);
                break;
            case 'service':
                this.toggleService(entry.check.name);
                break;
            case 'serviceUser':
                this.toggleServiceUser(entry.check.name);
                break;
            case 'group':
                this.toggleGroup(entry.check.name);
                break;
        }
    }

    private async isPackageInstalledArchlinux(pkg: string): Promise<boolean> {
        const result = await this.taskManagerService.executeAndWaitBash(`pacman -Qq ${pkg}`);
        return result.code === 0;
    }

    /**
     * Ensure that a package/command is installed
     * @param pkg The name of the package that will be installed if the executable is not found.
     */
    async ensurePackageArchlinux(pkg: string): Promise<boolean> {
        if (this.packages().get(pkg) !== true) {
            const task = this.taskManagerService.createTask(0, 'install-' + pkg, true, `Install ${pkg}`, 'pi pi-box', `pacman -S --noconfirm ${pkg}`);
            await this.taskManagerService.executeTask(task);
            return await this.isPackageInstalledArchlinux(pkg);
        }
        return true;
    }
}