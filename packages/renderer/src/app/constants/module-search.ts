export const MODULE_SEARCH: ModuleSearchEntry[] = [
  {
    moduleName: 'menu.modules.appSettings',
    keywords: ['settings', 'configuration', 'preferences', 'options', 'app settings', 'application settings', 'theme'],
    routerLink: 'settings',
  },
  {
    moduleName: 'menu.modules.locales',
    keywords: [
      'locales',
      'languages',
      'translations',
      'i18n',
      'internationalization',
      'localization',
      'language packs',
    ],
    routerLink: 'system-tools',
    hash: 'locales',
  },
  {
    moduleName: 'menu.modules.kernels',
    keywords: [
      'kernels',
      'linux kernels',
      'kernel management',
      'kernel settings',
      'kernel updates',
      'lqx',
      'zen',
      'cachyos',
    ],
    routerLink: 'system-tools',
    hash: 'kernels',
  },
  {
    moduleName: 'menu.modules.diagnostics',
    keywords: [
      'diagnostics',
      'logs',
      'debugging',
      'troubleshooting',
      'error logs',
      'system logs',
      'performance',
      'monitoring',
      'journalctl',
      'journal',
      'systemd',
      'systemd-journal',
    ],
    routerLink: 'diagnostics',
  },
  {
    moduleName: 'menu.modules.systemSettings',
    keywords: [
      'systemSettings',
      'common',
      'performance',
      'powersave',
      'rightclickEmulation',
      'profile-sync-daemon',
      'psd',
      'systemd-oomd',
      'oomd',
      'guest-user',
      'systemd-guest-user',
      'performance-tweaks',
      'ananicy-cpp',
      'bpftune',
      'bpftune-git',
      'preload',
      'irqbalance',
      'powersave-tweaks',
      'thermald',
      'power-profiles-daemon',
      'intel-undervolt',
      'intel-untervolt',
      'rightclick-emulation',
      'evdev-rce',
      'evdev',
      'longpress',
      'mouse',
      'battery',
      'chart-line',
      'volume-up',
      'psd.service',
      'systemd-oomd.service',
      'ananicy-cpp.service',
      'bpftune.service',
      'preload.service',
      'irqbalance.service',
      'thermald.service',
      'power-profiles-daemon.service',
      'intel-undervolt.service',
      'serviceUser',
      'pkg',
      'service',
      'enabled',
      'tweaks',
      'daemon',
      'profiles',
      'thermal',
      'undervolt',
      'emulation',
      'click',
      'right',
      'sync',
      'title',
      'description',
      'fancyTitle',
      'checked',
      'disabler',
      'icon',
      'name',
      'dns',
      'shell',
      'shellConfigs',
      'hblock',
      'iwd',
      'toggle',
      'packages',
      'wanted',
      'selected',
      'boxes',
      'current',
      'handleToggle',
      'osInteractService',
    ],
    routerLink: 'system-tools',
    hash: 'settings',
  },
  {
    moduleName: 'menu.modules.gaming',
    keywords: [
      'gaming',
      'games',
      'game library',
      'game management',
      'game settings',
      'game launcher',
      'gamepad',
      'controller',
      'joystick',
      'launcher',
      'steam',
      'lutris',
      'heroic',
      'proton',
      'wine',
      'dxvk',
      'vulkan',
      'gamemode',
    ],
    routerLink: 'gaming',
  },
  {
    moduleName: 'menu.modules.components',
    keywords: [
      'audio',
      'virtualization',
      'containers',
      'network',
      'bluetooth',
      'printing',
      'firewall',
      'misc',
      'pipewire',
      'alsa',
      'jack',
      'pulseaudio',
      'realtime',
      'jamesdsp',
      'volume',
      'virt-manager',
      'libvirtd',
      'libvirt',
      'kvm',
      'qemu',
      'virtualbox',
      'vboxusers',
      'desktop',
      'meta',
      'docker',
      'podman',
      'distrobox',
      'boxbuddy',
      'compose',
      'container',
      'networkmanager',
      'modemmanager',
      'manager',
      'globe',
      'autoconnect',
      'lp',
      'printing',
      'scanning',
      'cups',
      'saned',
      'scanner',
      'printer',
      'print',
      'ufw',
      'firewalld',
      'opensnitch',
      'opensnitchd',
      'shield',
      'pkg',
      'service',
      'group',
      'pipewire-support',
      'alsa-support',
      'jack-support',
      'pulseaudio-support',
      'virt-manager-meta',
      'qemu-desktop',
      'virtualbox-meta',
      'docker-compose',
      'podman-desktop',
      'podman-docker',
      'bluetooth-support',
      'bluetooth-autoconnect',
      'printer-support',
      'scanner-support',
      'garuda-nix-subsystem',
      'libvirtd.service',
      'docker.service',
      'NetworkManager.service',
      'ModemManager.service',
      'bluetooth.service',
      'bluetooth-autoconnect.service',
      'cups.socket',
      'saned.socket',
      'ufw.service',
      'firewalld.service',
      'opensnitchd.service',
      'support',
      'enabled',
      'user',
      'checked',
      'disabler',
      'icon',
      'title',
      'description',
      'fancyTitle',
      'socket',
      'system',
      'tools',
    ],
    routerLink: 'system-tools',
    hash: 'components',
  },
  {
    moduleName: 'menu.modules.maintenance',
    keywords: [
      'skel',
      'config',
      'reset',
      'btrfs',
      'default',
      'lock',
      'repository',
      'garuda-update',
      'reinstall',
      'pacman',
      'reflector-simple',
      'btrfs-assistant',
      'mirrors',
      'orphans',
      'cache',
      'system',
      'update',
      'clean',
      'refresh',
      'merge',
      'pacdiff',
    ],
    routerLink: 'maintenance',
  },
  {
    moduleName: 'menu.modules.welcome',
    keywords: [
      'help',
      'support',
      'documentation',
      'guides',
      'assistance',
      'contact',
      'forum',
      'community',
      'tutorials',
    ],
    routerLink: '',
  },
  {
    moduleName: 'menu.modules.packages',
    keywords: ['packages', 'software', 'applications', 'installed packages', 'package manager'],
    routerLink: 'system-tools',
    hash: 'packages',
  },
  {
    moduleName: 'menu.modules.systemdServices',
    keywords: [
      'systemd services',
      'services',
      'daemons',
      'system services',
      'service management',
      'systemctl',
      'restart',
      'enable',
      'disable',
    ],
    routerLink: 'system-tools',
    hash: 'services',
  },
];

export interface ModuleSearchEntry {
  moduleName: string;
  keywords: string[];
  routerLink: string;
  hash?: string;
}
