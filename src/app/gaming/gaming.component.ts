import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { TableModule } from 'primeng/table';
import { NgForOf, NgOptimizedImage } from '@angular/common';
import { AppService } from '../app.service';
import { DataViewModule } from 'primeng/dataview';
import { Operation, Package } from '../interfaces';
import { debug, error, info, trace } from '@tauri-apps/plugin-log';
import { INSTALL_ACTION_NAME, REMOVE_ACTION_NAME } from '../constants';
import { ChildProcess, Command } from '@tauri-apps/plugin-shell';
import { Card } from 'primeng/card';
import { flavors } from '@catppuccin/palette';
import { TabsModule } from 'primeng/tabs';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-gaming',
  imports: [TranslocoDirective, TableModule, DataViewModule, NgForOf, Card, NgOptimizedImage, TabsModule, Tooltip],
  templateUrl: './gaming.component.html',
  styleUrl: './gaming.component.css',
})
export class GamingComponent implements OnInit {
  backgroundColor = signal<string>('background-color');
  tabIndex = signal<number>(0);

  launchers: Package[] = [
    { name: 'Steam (runtime)', pkgname: ['steam'], icon: 'steam.png' },
    { name: 'Steam (native)', pkgname: ['steam-native-runtime'], icon: 'steam.png' },
    { name: 'Lutris', pkgname: ['lutris'], icon: 'lutris.png' },
    { name: 'Bottles', pkgname: ['bottles'], icon: 'com.usebottles.bottles.svg' },
    { name: 'Heroic Games Launcher', pkgname: ['heroic-games-launcher'], icon: 'heroic-icon.png' },
    { name: 'Minigalaxy', pkgname: ['minigalaxy'], icon: 'minigalaxy.png' },
    { name: 'GameHub', pkgname: ['gamehub'], icon: 'gamehub.svg' },
    { name: 'Itch', pkgname: ['itch'], icon: 'itch.svg' },
  ];

  wine: Package[] = [
    { name: 'WINE', pkgname: ['wine-meta'], icon: 'winehq.png' },
    { name: 'Winetricks', pkgname: ['winetricks'], icon: 'winehq.png' },
    { name: 'ProtonGE-Custom', pkgname: ['proton-ge-custom-bin'], icon: 'proton-ge-custom.png' },
    { name: 'Protontricks', pkgname: ['protontricks'], icon: 'proton.svg' },
    { name: 'Luxtorpeda', pkgname: ['luxtorpeda'], icon: 'proton.svg' },
    { name: 'Boxtron', pkgname: ['boxtron'], icon: 'DOSBox.png' },
  ];

  tools: Package[] = [
    { name: 'DXVK', pkgname: ['dxvk-mingw-git'], icon: 'generic.png' },
    { name: 'vkBasalt', pkgname: ['vkbasalt'], icon: 'generic.png' },
    { name: 'MangoHud', pkgname: ['mangohud', 'lib32-mangohud'], icon: 'mangohud.png' },
    { name: 'Gamemode', pkgname: ['gamemode', 'lib32-gamemode'], icon: 'generic.png' },
    { name: 'SteamTinkerLaunch', pkgname: ['steamtinkerlaunch'], icon: 'steam.png' },
    { name: 'VR video player', pkgname: ['vr-video-player'], icon: 'generic.png' },
    { name: 'Gamescope', pkgname: ['gamescope'], icon: 'valve.png' },
    { name: 'Gamescope session', pkgname: ['gamescope-session-git'], icon: 'valve.png' },
    { name: 'Gamescope session (Steam)', pkgname: ['gamescope-session-steam-git'], icon: 'steam.png' },
  ];

  commonApps: Package[] = [
    { name: 'GOverlay', pkgname: ['goverlay'], icon: 'goverlay.png' },
    { name: 'Fastgame', pkgname: ['fastgame'], icon: 'fastgame.png' },
    { name: 'CoreCtrl', pkgname: ['corectrl'], icon: 'corectrl.png' },
    { name: 'GWE', pkgname: ['gwe'], icon: 'gwe.png' },
    { name: 'OpenRGB', pkgname: ['openrgb'], icon: 'openrgb.png' },
    { name: 'Piper', pkgname: ['piper'], icon: 'piper.png' },
    { name: 'PulseEffects', pkgname: ['pulseeffects'], icon: 'pulseeffects.png' },
    { name: 'antimicroX', pkgname: ['antimicrox'], icon: 'antimicrox.png' },
    { name: 'sc-controller', pkgname: ['sc-controller'], icon: 'sc-controller.png' },
    { name: 'oversteer', pkgname: ['oversteer'], icon: 'oversteer.png' },
    { name: 'Game Conquerer', pkgname: ['gameconqueror'], icon: 'gameconqueror.png' },
    { name: 'DisplayCAL', pkgname: ['displaycal'], icon: 'displaycal.png' },
    { name: 'Keyboard visualizer', pkgname: ['keyboardvisualizer'], icon: 'keyboardvisualizer.png' },
    { name: 'Polychromatic', pkgname: ['polychromatic'], icon: 'polychromatic.png' },
    { name: 'Fancontrol-GUI', pkgname: ['fancontrol-gui'], icon: 'fancontrol-gui.png' },
    { name: 'Input remapper', pkgname: ['input-remapper'], icon: 'input-remapper.png' },
    { name: 'Piper', pkgname: ['piper'], icon: 'piper.png' },
    { name: 'EasyEffects', pkgname: ['easyeffects'], icon: 'easyeffects.png' },
    { name: 'Noisetorch', pkgname: ['noisetorch'], icon: 'noisetorch.png' },
    { name: 'Nyrna', pkgname: ['nyrna'], icon: 'nyrna.png' },
    { name: 'Mumble', pkgname: ['mumble'], icon: 'mumble.png' },
    { name: 'Discord', pkgname: ['discord'], icon: 'discord.png' },
    { name: 'OBS Studio', pkgname: ['obs-studio'], icon: 'obs-studio.png' },
    { name: 'VLC', pkgname: ['vlc'], icon: 'vlc.png' },
    { name: 'StreamLink Twitch GUI', pkgname: ['streamlink-twitch-gui'], icon: 'streamlink-twitch-gui.png' },
    { name: 'SoundWire', pkgname: ['soundwire'], icon: 'soundwire.png' },
    { name: 'DroidCam', pkgname: ['droidcam'], icon: 'droidcam.png' },
    { name: 'AnyDesk', pkgname: ['anydesk'], icon: 'anydesk.png' },
  ];

  controllers: Package[] = [
    {
      name: 'Xboxdrv',
      pkgname: ['xboxdrv'],
      icon: 'xbox.png',
      description: "Xbox controller driver, only use if kernel driver doesn't work!",
    },
    { name: 'XpadNeo', pkgname: ['xpadneo-dkms'], icon: 'xbox.png' },
    { name: 'Xbox generic controller', pkgname: ['xbox-generic-controller'], icon: 'xbox.png' },
    { name: 'Xbox One/X/S', pkgname: ['xone-dkms-git'], icon: 'xone.svg' },
    { name: 'Xbox One dongle', pkgname: ['xone-dongle-firmware'], icon: 'xone.svg' },
  ];

  games: Package[] = [{ name: 'Doom', pkgname: ['doom'], icon: 'doom.png' }];

  emulators: Package[] = [
    { name: 'Dolphin', pkgname: ['dolphin-emu'], icon: 'dolphin-emu.png' },
    { name: 'Mandarine (Citra)', pkgname: ['mandarine-git'], icon: 'mandarine.png' },
    { name: 'Desmume', pkgname: ['desmume'], icon: 'desmume.png' },
    { name: 'Dolphin-emu', pkgname: ['dolphin-emu'], icon: 'dolphin-emu.png' },
    { name: 'DOSBox', pkgname: ['dosbox'], icon: 'DOSBox.png' },
    { name: 'DuckStation', pkgname: ['duckstation'], icon: 'duckstation.png' },
    { name: 'eka2l1', pkgname: ['eka2l1-git'], icon: 'eka2l1.png' },
    { name: 'Emulationstation', pkgname: ['emulationstation'], icon: 'es-0.png' },
    { name: 'DGen/SDL', pkgname: ['dgen-sdl'], icon: 'dgen.png' },
    { name: 'ePSXe', pkgname: ['epsxe'], icon: 'epsxe.png' },
    { name: 'FCEUX', pkgname: ['fceux'], icon: 'fceux.png' },
    { name: 'FS-UAE', pkgname: ['fs-uae'], icon: 'fs-uae.png' },
    { name: 'Hatari', pkgname: ['hatari'], icon: 'hatari.png' },
    { name: 'Higan', pkgname: ['higan'], icon: 'higan.png' },
    { name: 'Kega Fusion', pkgname: ['kega-fusion'], icon: 'kega-fusion.png' },
    { name: 'Libretro', pkgname: ['libretro'], icon: 'libretro.png' },
    { name: 'Libretro (all cores)', pkgname: ['libretro-meta'], icon: 'libretro.png' },
    { name: 'MAME', pkgname: ['mame'], icon: 'mame.png' },
    { name: 'Mednafen', pkgname: ['mednafen'], icon: 'mednafen.png' },
    { name: 'mGBA', pkgname: ['mgba'], icon: 'mgba.png' },
    { name: 'mupen64plus', pkgname: ['m64py'], icon: 'mupen64plus.png' },
    { name: 'Nestopia', pkgname: ['nestopia'], icon: 'nestopia.png' },
    { name: 'PCSX-R', pkgname: ['pcsxr'], icon: 'pcsxr.png' },
    { name: 'Pegasus frontend', pkgname: ['pegasus-frontend-git'], icon: 'pegasus-frontend.png' },
    { name: 'PCSX2', pkgname: ['pcsx2'], icon: 'pcsx2.png' },
    { name: 'PPSSPP', pkgname: ['ppsspp'], icon: 'ppsspp.png' },
    { name: 'Reicast', pkgname: ['reicast'], icon: 'reicast.png' },
    { name: 'RPCS3', pkgname: ['rpcs3'], icon: 'rpcs3.png' },
    { name: 'RetroArch', pkgname: ['retroarch'], icon: 'retroarch.png' },
    { name: 'RyuJinx', pkgname: ['ryujinx'], icon: 'ryujinx.png' },
    { name: 'SameBoy', pkgname: ['sameboy'], icon: 'sameboy.png' },
    { name: 'ScummVM', pkgname: ['scummvm'], icon: 'scummvm.png' },
    { name: 'Snes9x', pkgname: ['snes9x'], icon: 'snes9x.png' },
    { name: 'Stella', pkgname: ['stella'], icon: 'stella.png' },
    { name: 'VBA-M', pkgname: ['vbam-wx'], icon: 'vba-m.png' },
    { name: 'VICE', pkgname: ['vice'], icon: 'vice.png' },
    { name: 'WayDroid', pkgname: ['waydroid-script-git'], icon: 'waydroid.png' },
    { name: 'Xemu', pkgname: ['xemu'], icon: 'xemu.png' },
    { name: 'Yabause', pkgname: ['yabause-qt'], icon: 'yabause.png' },
    { name: 'Torzu (Yuzu)', pkgname: ['torzu-qt6-git'], icon: 'yuzu.png' },
    { name: 'ZSNES', pkgname: ['zsnes'], icon: 'zsnes.png' },
  ];

  data: { name: string; sections: Package[] }[] = [
    { name: 'Launchers', sections: this.launchers },
    { name: 'Wine', sections: this.wine },
    { name: 'Tools', sections: this.tools },
    { name: 'Common apps', sections: this.commonApps },
    { name: 'Controllers', sections: this.controllers },
    { name: 'Games', sections: this.games },
    { name: 'Emulators', sections: this.emulators },
  ];

  private readonly appService = inject(AppService);

  constructor() {
    effect(() => {
      const darkMode = this.appService.themeHandler.darkMode();
      this.backgroundColor.set(darkMode ? flavors.mocha.colors.surface0.hex : flavors.latte.colors.surface0.hex);
    });
  }

  ngOnInit() {
    void this.checkInstalled();
  }

  addToPending(pkg: Package): void {
    pkg.selected = !pkg.selected;

    if ((!pkg.initialState && pkg.selected) || pkg.initialState === pkg.selected) {
      const queueExists: boolean = this.checkExistingOperations(INSTALL_ACTION_NAME, pkg);
      if (!queueExists && pkg.selected) {
        this.addToInstallAction(pkg);
      }
    } else if ((pkg.initialState && !pkg.selected) || pkg.initialState === pkg.selected) {
      const queueExists: boolean = this.checkExistingOperations(REMOVE_ACTION_NAME, pkg);
      if (!queueExists && !pkg.selected) {
        this.addToRemoveAction(pkg);
      }
    }
  }

  checkExistingOperations(type: typeof INSTALL_ACTION_NAME | typeof REMOVE_ACTION_NAME, pkg: Package): boolean {
    const existingOperation: Operation | undefined = this.appService
      .pendingOperations()
      .find((operation) => operation.name === type);
    const existingOppositeOperation: Operation | undefined = this.appService
      .pendingOperations()
      .find(
        (operation) => operation.name === (type === INSTALL_ACTION_NAME ? REMOVE_ACTION_NAME : INSTALL_ACTION_NAME),
      );

    void trace(`Checking for existing operation ${type}, found: ${existingOperation !== undefined}`);

    void trace(`Package initial state: ${pkg.initialState}, selected: ${pkg.selected}`);

    if (existingOperation && pkg.initialState !== pkg.selected) {
      void debug(`Adding ${pkg.pkgname} to existing operation ${type}`);
      existingOperation.commandArgs.push(pkg.pkgname);
    } else if (existingOperation && pkg.initialState === pkg.selected) {
      this.removeFromAction(existingOperation, pkg);
    } else if (!existingOperation && pkg.initialState !== pkg.selected) {
      return false;
    } else if (!existingOperation && pkg.initialState === pkg.selected) {
      if (existingOppositeOperation) this.removeFromAction(existingOppositeOperation, pkg);
      return true;
    }

    return existingOperation !== undefined;
  }

  removeFromAction(operation: Operation, pkg: Package): void {
    void debug(`Removing ${pkg.pkgname} from existing operation ${operation.name}`);
    for (const pkgname of pkg.pkgname) {
      const index = operation.commandArgs.indexOf(pkgname);
      operation.commandArgs.splice(index, 1);
      void debug(`Removed ${pkgname} from args`);
    }

    if (operation.commandArgs.length === 0) {
      void debug(`Removing ${operation.name} operation`);
      const index = this.appService.pendingOperations().indexOf(operation);
      this.appService.pendingOperations().splice(index, 1);
    }
  }

  addToRemoveAction(pkg: Package): void {
    const operation: Operation = {
      name: REMOVE_ACTION_NAME,
      prettyName: 'Remove apps',
      sudo: true,
      status: 'pending',
      commandArgs: [...pkg.pkgname],
      command: (args?: string[]): string => {
        void info('Removing packages');
        return `pacman --noconfirm -Rns ${args?.join(' ')}`;
      },
    };
    this.appService.pendingOperations().push(operation);
  }

  addToInstallAction(pkg: Package): void {
    const operation: Operation = {
      name: INSTALL_ACTION_NAME,
      prettyName: 'Install apps',
      sudo: true,
      status: 'pending',
      commandArgs: [...pkg.pkgname],
      command: (args?: string[]): string => {
        void info('Installing packages');
        const allPkgs: string[] = [];
        for (const arg of args!) {
          if (arg.includes(',')) allPkgs.push(...arg.split(','));
          else allPkgs.push(arg);
        }
        return `pacman --needed --noconfirm -S ${allPkgs.join(' ')}`;
      },
    };
    this.appService.pendingOperations().push(operation);
  }

  async checkInstalled() {
    void info('Checking installed packages');
    const cmd = 'pacman -Qq';
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

    if (result.code !== 0) {
      void error(`Error checking installed packages: ${result.stderr}`);
      return;
    }

    const installedPackages: string[] = result.stdout.split('\n');
    for (const sections of this.data) {
      for (const pkg of sections.sections) {
        pkg.selected = installedPackages.includes(pkg.pkgname[0]);
        pkg.initialState = pkg.selected;
      }
    }
  }
}
