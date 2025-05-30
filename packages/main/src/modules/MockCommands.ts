/**
 * Mock command handler for development mode on macOS
 * Provides fake outputs for Arch Linux commands to enable UI testing
 */

export interface MockCommandResult {
  code: number;
  stdout: string;
  stderr: string;
  success: boolean;
}

/**
 * Mock command patterns and their responses
 */
const MOCK_COMMANDS: {
  pattern: RegExp;
  handler: (command: string, args: string[]) => MockCommandResult;
}[] = [
  // Package management - List installed packages
  {
    pattern: /^pacman -Qq$/,
    handler: () => ({
      code: 0,
      stdout: `base
bash
coreutils
firefox
git
linux
systemd
vim
wget
yay
neofetch
htop
discord
steam
vlc
libreoffice-fresh
gimp
blender
code
nodejs
npm
python
gcc
make`,
      stderr: '',
      success: true,
    }),
  },

  // Package management - Search for kernels
  {
    pattern: /^pacman -Ss linux$/,
    handler: () => ({
      code: 0,
      stdout: `core/linux 6.14.0-4
    The Linux kernel
core/linux-headers 6.14.0-4
    Headers for linux
extra/linux-lts 6.12.9-1
    The LTS kernel
extra/linux-lts-headers 6.12.9-1
    Headers for linux-lts
extra/linux-zen 6.14.0-4
    The Zen kernel
extra/linux-zen-headers 6.14.0-4
    Headers for linux-zen
extra/linux-hardened 6.13.1-1
    The Hardened kernel`,
      stderr: '',
      success: true,
    }),
  },

  // Package management - Check for updates
  {
    pattern: /^checkupdates --nocolor$/,
    handler: () => ({
      code: 0,
      stdout: `firefox 131.0.3-1 -> 132.0.1-1
git 2.47.0-1 -> 2.47.1-1
systemd 256.7-1 -> 256.8-1
linux 6.14.0-3 -> 6.14.0-4`,
      stderr: '',
      success: true,
    }),
  },

  // AUR updates check
  {
    pattern: /^paru -Qua$/,
    handler: () => ({
      code: 0,
      stdout: `visual-studio-code-bin 1.94.2-1 -> 1.95.0-1
discord-canary 0.0.519-1 -> 0.0.520-1
brave-bin 1.71.121-1 -> 1.72.104-1`,
      stderr: '',
      success: true,
    }),
  },

  // Pacdiff check
  {
    pattern: /^pacdiff -o$/,
    handler: () => ({
      code: 0,
      stdout: `/etc/pacman.conf.pacnew
/etc/makepkg.conf.pacnew`,
      stderr: '',
      success: true,
    }),
  },

  // System services
  {
    pattern:
      /^systemctl list-units --type service,socket --full --output json --no-pager$/,
    handler: () => ({
      code: 0,
      stdout: JSON.stringify([
        {
          unit: 'systemd-networkd.service',
          active: 'active',
          sub: 'running',
          description: 'Network Configuration',
        },
        {
          unit: 'NetworkManager.service',
          active: 'active',
          sub: 'running',
          description: 'Network Manager',
        },
        {
          unit: 'bluetooth.service',
          active: 'active',
          sub: 'running',
          description: 'Bluetooth service',
        },
        {
          unit: 'sshd.service',
          active: 'inactive',
          sub: 'dead',
          description: 'OpenSSH Daemon',
        },
        {
          unit: 'docker.service',
          active: 'active',
          sub: 'running',
          description: 'Docker Application Container Engine',
        },
      ]),
      stderr: '',
      success: true,
    }),
  },

  // User services
  {
    pattern:
      /^systemctl --user list-units --type service,socket --full --output json --no-pager$/,
    handler: () => ({
      code: 0,
      stdout: JSON.stringify([
        {
          unit: 'pipewire.service',
          active: 'active',
          sub: 'running',
          description: 'PipeWire Multimedia Service',
        },
        {
          unit: 'wireplumber.service',
          active: 'active',
          sub: 'running',
          description: 'Multimedia Service Session Manager',
        },
        {
          unit: 'xdg-desktop-portal.service',
          active: 'active',
          sub: 'running',
          description: 'Portal service',
        },
      ]),
      stderr: '',
      success: true,
    }),
  },

  // User groups
  {
    pattern: /^groups .+ \| cut -d ' ' -f 3-$/,
    handler: () => ({
      code: 0,
      stdout: 'wheel audio video storage optical scanner docker',
      stderr: '',
      success: true,
    }),
  },

  // DNS configuration
  {
    pattern:
      /^cat \/etc\/resolv\.conf \| grep nameserver \| head -n 1 \| cut -d " " -f 2$/,
    handler: () => ({
      code: 0,
      stdout: '1.1.1.1',
      stderr: '',
      success: true,
    }),
  },

  // User shell
  {
    pattern:
      /^basename \$\(\/usr\/bin\/getent passwd \$USER \| awk -F':' '\{print \$7\}'\)$/,
    handler: () => ({
      code: 0,
      stdout: 'zsh',
      stderr: '',
      success: true,
    }),
  },

  // NetworkManager iwd backend check
  {
    pattern:
      /^grep -q wifi\.backend=iwd \/etc\/NetworkManager\/conf\.d\/\*\.conf$/,
    handler: () => ({
      code: 0,
      stdout: '',
      stderr: '',
      success: true,
    }),
  },

  // Hblock status
  {
    pattern:
      /^cat \/etc\/hosts \| grep -A1 "Blocked domains" \| awk '\/Blocked domains\/ \{ print \$NF \}'$/,
    handler: () => ({
      code: 0,
      stdout: '50000',
      stderr: '',
      success: true,
    }),
  },

  // Available locales
  {
    pattern: /^localectl list-locales$/,
    handler: () => ({
      code: 0,
      stdout: `C.UTF-8
en_US.UTF-8
en_GB.UTF-8
de_DE.UTF-8
fr_FR.UTF-8
es_ES.UTF-8
ja_JP.UTF-8
zh_CN.UTF-8`,
      stderr: '',
      success: true,
    }),
  },

  // Last update check
  {
    pattern: /\/var\/log\/pacman\.log$/,
    handler: () => ({
      code: 0,
      stdout: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0], // 3 days ago
      stderr: '',
      success: true,
    }),
  },

  // DKMS status check
  {
    pattern: /^which dkms &>\/dev\/null && dkms status$/,
    handler: () => ({
      code: 0,
      stdout: `nvidia/560.35.03, 6.14.0-4-MANJARO: installed
virtualbox-host-modules/7.1.4, 6.14.0-4-MANJARO: installed
broadcom-wl/6.30.223.271, 6.14.0-4-MANJARO: installed`,
      stderr: '',
      success: true,
    }),
  },

  // Available DKMS modules
  {
    pattern:
      /^test -d \/var\/lib\/dkms && find \/var\/lib\/dkms -maxdepth 1 -type d \| grep \/var\/lib\/dkms\/ \| cut -d "\/" -f 5$/,
    handler: () => ({
      code: 0,
      stdout: `nvidia
virtualbox-host-modules
broadcom-wl
r8168
rtl8821ce`,
      stderr: '',
      success: true,
    }),
  },

  // Package installation
  {
    pattern: /^pacman -S --noconfirm --needed .+$/,
    handler: (command) => {
      const packages = command.split(' ').slice(4); // Get package names after flags
      return {
        code: 0,
        stdout: `resolving dependencies...
looking for conflicting packages...

Packages (${packages.length}) ${packages.join(' ')}

Total Installed Size: 42.5 MiB

:: Proceed with installation? [Y/n]
checking keyring...
checking package integrity...
loading package files...
checking for file conflicts...
checking available disk space...
:: Processing package changes...
${packages.map((pkg) => `installing ${pkg}...`).join('\n')}`,
        stderr: '',
        success: true,
      };
    },
  },

  // Package existence check
  {
    pattern: /^pacman -Qq .+$/,
    handler: (command) => {
      const pkg = command.split(' ')[2];
      // Mock that common packages exist
      const commonPackages = [
        'git',
        'wget',
        'curl',
        'htop',
        'neofetch',
        'firefox',
        'vim',
        'nano',
      ];
      return {
        code: commonPackages.includes(pkg) ? 0 : 1,
        stdout: commonPackages.includes(pkg) ? pkg : '',
        stderr: commonPackages.includes(pkg)
          ? ''
          : `error: package '${pkg}' was not found`,
        success: commonPackages.includes(pkg),
      };
    },
  },

  // Application launchers and GUI commands
  {
    pattern: /^\/usr\/lib\/garuda\/pkexec-gui .+$/,
    handler: () => ({
      code: 0,
      stdout: 'GUI application launched successfully',
      stderr: '',
      success: true,
    }),
  },

  {
    pattern: /^setup-assistant$/,
    handler: () => ({
      code: 0,
      stdout: 'Setup assistant launched',
      stderr: '',
      success: true,
    }),
  },

  {
    pattern: /^sudo -E calamares$/,
    handler: () => ({
      code: 0,
      stdout: 'Calamares installer launched',
      stderr: '',
      success: true,
    }),
  },

  // Diagnostic commands
  {
    pattern: /^garuda-inxi$/,
    handler: () => ({
      code: 0,
      stdout: `System:    Host: garuda-test Kernel: 6.14.0-4-MANJARO x86_64 bits: 64 compiler: gcc v: 13.2.1
Desktop: KDE Plasma v: 5.27.10 tk: Qt v: 5.15.12 wm: kwin_x11 vt: 2 dm: SDDM
Distro: Garuda Linux base: Arch Linux
Machine:   Type: Desktop mobo: ASUSTeK model: PRIME B450M-A v: Rev X.0x serial: <filter>
           UEFI: American Megatrends v: 4801 date: 07/14/2022
CPU:       Info: 6-Core model: AMD Ryzen 5 3600 bits: 64 type: MT MCP arch: Zen 2 family: 17 (23)
           model-id: 71 (113) stepping: 0 microcode: 8701021 cache: L1: 384 KiB L2: 3 MiB L3: 32 MiB
Memory:    RAM: total: 15.61 GiB used: 4.2 GiB (26.9%)
Graphics:  Device-1: NVIDIA GeForce GTX 1660 Ti vendor: EVGA driver: nvidia v: 560.35.03
           alternate: nouveau,nvidia_drm bus-ID: 08:00.0 chip-ID: 10de:2182 class-ID: 0300`,
      stderr: '',
      success: true,
    }),
  },

  {
    pattern:
      /^systemd-analyze blame --no-pager && systemd-analyze critical-chain --no-pager$/,
    handler: () => ({
      code: 0,
      stdout: `1.234s NetworkManager.service
987ms bluetooth.service
654ms systemd-logind.service
432ms user@1000.service
321ms polkit.service

The time when unit became active or started is printed after the "@" character.
The time the unit took to start is printed after the "+" character.

graphical.target @2.3s
└─multi-user.target @2.2s
  └─NetworkManager.service @1.8s +434ms
    └─basic.target @1.7s
      └─sockets.target @1.7s`,
      stderr: '',
      success: true,
    }),
  },

  {
    pattern: /^journalctl -xe --no-pager$/,
    handler: () => ({
      code: 0,
      stdout: `-- Boot ${new Date().toISOString().split('T')[0]}T00:00:00.000000+0000 --
Dec 01 10:30:15 garuda-test kernel: Linux version 6.14.0-4-MANJARO
Dec 01 10:30:15 garuda-test systemd[1]: Starting Load Kernel Modules...
Dec 01 10:30:15 garuda-test systemd[1]: Starting Early OOM Daemon...
Dec 01 10:30:15 garuda-test systemd[1]: Starting Apply Kernel Variables...
Dec 01 10:30:15 garuda-test systemd[1]: Starting Create Static Device Nodes in /dev...
Dec 01 10:30:15 garuda-test systemd[1]: Started Early OOM Daemon.
Dec 01 10:30:15 garuda-test systemd[1]: Started Apply Kernel Variables.
Dec 01 10:30:15 garuda-test systemd[1]: Started Create Static Device Nodes in /dev.
Dec 01 10:30:15 garuda-test systemd[1]: Starting Rule-based Manager for Device Events and Files...
Dec 01 10:30:15 garuda-test systemd[1]: Started Rule-based Manager for Device Events and Files.`,
      stderr: '',
      success: true,
    }),
  },

  {
    pattern:
      /^tac \/var\/log\/pacman\.log \| awk '!flag; \/PACMAN\.\*pacman\/\{flag = 1\};' \| tac$/,
    handler: () => ({
      code: 0,
      stdout: `[${new Date().toISOString().split('T')[0]}T10:30] [PACMAN] Running 'pacman -Syu'
[${new Date().toISOString().split('T')[0]}T10:30] [PACMAN] synchronizing package lists
[${new Date().toISOString().split('T')[0]}T10:30] [PACMAN] starting full system upgrade
[${new Date().toISOString().split('T')[0]}T10:31] [PACMAN] upgraded firefox (131.0.3-1 -> 132.0.1-1)
[${new Date().toISOString().split('T')[0]}T10:31] [PACMAN] upgraded git (2.47.0-1 -> 2.47.1-1)
[${new Date().toISOString().split('T')[0]}T10:31] [PACMAN] upgraded systemd (256.7-1 -> 256.8-1)
[${new Date().toISOString().split('T')[0]}T10:32] [PACMAN] transaction completed`,
      stderr: '',
      success: true,
    }),
  },

  {
    pattern: /^dmesg$/,
    handler: () => ({
      code: 0,
      stdout: `[    0.000000] Linux version 6.14.0-4-MANJARO (builduser@garuda) (gcc (GCC) 13.2.1 20230801) #1 SMP PREEMPT_DYNAMIC
[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-6.14-x86_64 root=UUID=abc123 rw quiet splash
[    0.000000] KERNEL supported cpus:
[    0.000000]   Intel GenuineIntel
[    0.000000]   AMD AuthenticAMD
[    0.000000] x86/fpu: Supporting XSAVE feature 0x001: 'x87 floating point registers'
[    0.000000] x86/fpu: Supporting XSAVE feature 0x002: 'SSE registers'
[    0.000000] BIOS-provided physical RAM map:
[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009ffff] usable
[    1.234567] pci 0000:08:00.0: [10de:2182] type 00 class 0x030000
[    1.234568] nvidia: loading out-of-tree module taints kernel.
[    2.345678] nvidia 0000:08:00.0: vgaarb: changed VGA decodes`,
      stderr: '',
      success: true,
    }),
  },

  // System information commands
  {
    pattern: /^whoami$/,
    handler: () => ({
      code: 0,
      stdout: 'testuser',
      stderr: '',
      success: true,
    }),
  },

  {
    pattern: /^lsb_release -c$/,
    handler: () => ({
      code: 0,
      stdout: 'Codename:\tsoaring',
      stderr: '',
      success: true,
    }),
  },

  {
    pattern: /^df -T \/ \|tail -n1 \|awk '\{print \$2\}'$/,
    handler: () => ({
      code: 0,
      stdout: 'ext4',
      stderr: '',
      success: true,
    }),
  },

  {
    pattern: /^uname -r$/,
    handler: () => ({
      code: 0,
      stdout: '6.14.0-4-MANJARO',
      stderr: '',
      success: true,
    }),
  },

  {
    pattern: /^echo \$XDG_CURRENT_DESKTOP$/,
    handler: () => ({
      code: 0,
      stdout: 'KDE',
      stderr: '',
      success: true,
    }),
  },

  {
    pattern: /^locale \| grep LANG=$/,
    handler: () => ({
      code: 0,
      stdout: 'LANG=en_US.UTF-8',
      stderr: '',
      success: true,
    }),
  },

  {
    pattern: /^pacman -Ssq$/,
    handler: () => ({
      code: 0,
      stdout: `firefox
git
systemd
vim
wget
yay
neofetch
htop
discord
steam
vlc
libreoffice-fresh
gimp
blender
code
nodejs
npm
python
gcc
make
linux
linux-headers
nvidia
docker
obs-studio
audacity
thunderbird
chromium`,
      stderr: '',
      success: true,
    }),
  },

  {
    pattern:
      /^cat ~\/\.config\/kwinrc \| grep -q 'BorderlessMaximizedWindows=true'$/,
    handler: () => ({
      code: 1, // Not found
      stdout: '',
      stderr: '',
      success: false,
    }),
  },

  // Privileged commands (with pkexec)
  {
    pattern: /^pkexec .+$/,
    handler: (command) => {
      const innerCommand = command.replace(/^pkexec\s+/, '');
      return {
        code: 0,
        stdout: `[ELEVATED] Mock output for: ${innerCommand}`,
        stderr: '',
        success: true,
      };
    },
  },

  // Generic successful command fallback
  {
    pattern: /.*/,
    handler: (command) => ({
      code: 0,
      stdout: `Mock output for: ${command}`,
      stderr: '',
      success: true,
    }),
  },
];

/**
 * Get mock response for a shell command in development mode
 */
export function getMockCommandResult(
  command: string,
  args: string[] = [],
): MockCommandResult {
  const fullCommand = `${command} ${args.join(' ')}`.trim();

  console.log(`[MOCK] Executing command: ${fullCommand}`);

  for (const mockCommand of MOCK_COMMANDS) {
    if (mockCommand.pattern.test(fullCommand)) {
      const result = mockCommand.handler(fullCommand, args);
      console.log(`[MOCK] Result:`, {
        code: result.code,
        stdoutLength: result.stdout.length,
        stderrLength: result.stderr.length,
      });
      return result;
    }
  }

  // Fallback - should never reach here due to catch-all pattern
  return {
    code: 0,
    stdout: `Mock output for: ${fullCommand}`,
    stderr: '',
    success: true,
  };
}

/**
 * Check if we should use mock commands (development mode detection)
 */
export function shouldUseMockCommands(): boolean {
  return false; // process.env.NODE_ENV === 'development' && process.platform === 'darwin';
}
