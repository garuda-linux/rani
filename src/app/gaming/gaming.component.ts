import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { TableModule } from 'primeng/table';
import { NgForOf, NgOptimizedImage } from '@angular/common';
import { DataViewModule } from 'primeng/dataview';
import { FullPackageDefinition, StatefulPackage } from '../interfaces';
import { ChildProcess, Command } from '@tauri-apps/plugin-shell';
import { Card } from 'primeng/card';
import { flavors } from '@catppuccin/palette';
import { TabsModule } from 'primeng/tabs';
import { Tooltip } from 'primeng/tooltip';
import { OperationManagerService } from '../operation-manager/operation-manager.service';
import { LoadingService } from '../loading-indicator/loading-indicator.service';
import { Logger } from '../logging/logging';
import { ConfigService } from '../config/config.service';

@Component({
  selector: 'rani-gaming',
  imports: [TranslocoDirective, TableModule, DataViewModule, NgForOf, Card, NgOptimizedImage, TabsModule, Tooltip],
  templateUrl: './gaming.component.html',
  styleUrl: './gaming.component.css',
})
export class GamingComponent implements OnInit {
  backgroundColor = signal<string>('background-color');
  tabIndex = signal<number>(0);

  data: { name: string; sections: FullPackageDefinition[] }[] = [
    {
      name: 'gaming.launchers',
      sections: [
        { name: 'Steam (runtime)', pkgname: ['steam'], icon: 'steam.png' },
        { name: 'Steam (native)', pkgname: ['steam-native-runtime'], icon: 'steam.png' },
        { name: 'Lutris', pkgname: ['lutris'], icon: 'lutris.png' },
        { name: 'Bottles', pkgname: ['bottles'], icon: 'bottles.svg' },
        { name: 'Heroic Games Launcher', pkgname: ['heroic-games-launcher'], icon: 'heroic-icon.png' },
        { name: 'Minigalaxy', pkgname: ['minigalaxy'], icon: 'minigalaxy.png' },
        { name: 'GameHub', pkgname: ['gamehub'], icon: 'gamehub.svg' },
        { name: 'Itch', pkgname: ['itch'], icon: 'itch.svg' },
      ],
    },
    {
      name: 'gaming.wine',
      sections: [
        { name: 'WINE', pkgname: ['wine-meta'], icon: 'winehq.png' },
        { name: 'Winetricks', pkgname: ['winetricks'], icon: 'winehq.png' },
        { name: 'ProtonGE-Custom', pkgname: ['proton-ge-custom-bin'], icon: 'proton-ge-custom.png' },
        { name: 'Protontricks', pkgname: ['protontricks'], icon: 'proton.svg' },
        { name: 'Luxtorpeda', pkgname: ['luxtorpeda'], icon: 'proton.svg' },
        { name: 'Boxtron', pkgname: ['boxtron'], icon: 'DOSBox.png' },
      ],
    },
    {
      name: 'gaming.tools',
      sections: [
        { name: 'DXVK', pkgname: ['dxvk-mingw-git'], icon: 'generic.png' },
        { name: 'vkBasalt', pkgname: ['vkbasalt'], icon: 'generic.png' },
        { name: 'MangoHud', pkgname: ['mangohud', 'lib32-mangohud'], icon: 'mangohud.png' },
        { name: 'Gamemode', pkgname: ['gamemode', 'lib32-gamemode'], icon: 'generic.png' },
        { name: 'SteamTinkerLaunch', pkgname: ['steamtinkerlaunch'], icon: 'steam.png' },
        { name: 'VR video player', pkgname: ['vr-video-player'], icon: 'generic.png' },
        { name: 'Gamescope', pkgname: ['gamescope'], icon: 'valve.png' },
        { name: 'Gamescope session', pkgname: ['gamescope-session-git'], icon: 'valve.png' },
        { name: 'Gamescope session (Steam)', pkgname: ['gamescope-session-steam-git'], icon: 'steam.png' },
      ],
    },
    {
      name: 'gaming.misc',
      sections: [
        { name: 'GOverlay', pkgname: ['goverlay'], icon: 'goverlay.png' },
        { name: 'Fastgame', pkgname: ['fastgame'], icon: 'generic.png' },
        { name: 'CoreCtrl', pkgname: ['corectrl'], icon: 'corectrl.png' },
        { name: 'GWE', pkgname: ['gwe'], icon: 'gwe.png' },
        { name: 'OpenRGB', pkgname: ['openrgb'], icon: 'openrgb.png' },
        { name: 'Piper', pkgname: ['piper'], icon: 'piper.svg' },
        { name: 'AntimicroX', pkgname: ['antimicrox'], icon: 'antimicrox.png' },
        { name: 'Sc-controller', pkgname: ['sc-controller'], icon: 'generic.png' },
        { name: 'Oversteer', pkgname: ['oversteer'], icon: 'generic.png' },
        { name: 'Game Conquerer', pkgname: ['gameconqueror'], icon: 'generic.png' },
        { name: 'DisplayCAL', pkgname: ['displaycal'], icon: 'displaycal.png' },
        { name: 'Keyboard visualizer', pkgname: ['keyboardvisualizer'], icon: 'generic.png' },
        { name: 'Polychromatic', pkgname: ['polychromatic'], icon: 'polychromatic_green.svg' },
        { name: 'Fancontrol-GUI', pkgname: ['fancontrol-gui'], icon: 'fancontrol.svg' },
        { name: 'Input remapper', pkgname: ['input-remapper'], icon: 'generic.png' },
        { name: 'EasyEffects', pkgname: ['easyeffects'], icon: 'easyeffects.svg' },
        { name: 'Noisetorch', pkgname: ['noisetorch'], icon: 'noisetorch.png' },
        { name: 'Nyrna', pkgname: ['nyrna'], icon: 'nyrna.png' },
        { name: 'Mumble', pkgname: ['mumble'], icon: 'mumble.svg' },
        { name: 'Discord', pkgname: ['discord'], icon: 'discord.png' },
        { name: 'OBS Studio', pkgname: ['obs-studio'], icon: 'obs.svg' },
        { name: 'VLC', pkgname: ['vlc'], icon: 'vlc.svg' },
        { name: 'StreamLink Twitch GUI', pkgname: ['streamlink-twitch-gui'], icon: 'streamlink-twitch.png' },
        { name: 'SoundWire', pkgname: ['soundwire'], icon: 'soundwire.png' },
        { name: 'DroidCam', pkgname: ['droidcam'], icon: 'droidcam.png' },
        { name: 'AnyDesk', pkgname: ['anydesk'], icon: 'anydesk.svg' },
      ],
    },
    {
      name: 'gaming.controllers',
      sections: [
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
      ],
    },
    // TODO: fill this in
    //  { name: 'gaming.games', sections: [{ name: 'Doom', pkgname: ['doom'], icon: 'doom.png' }] },
    {
      name: 'gaming.emulators',
      sections: [
        { name: 'Dolphin', pkgname: ['dolphin-emu'], icon: 'dolphin-emu.png' },
        { name: 'Mandarine (Citra)', pkgname: ['mandarine-git'], icon: 'mandarine.svg' },
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
        { name: 'MAME', pkgname: ['mame'], icon: 'generic.png' },
        { name: 'Mednafen', pkgname: ['mednafen'], icon: 'generic.png' },
        { name: 'mGBA', pkgname: ['mgba'], icon: 'mgba.png' },
        { name: 'mupen64plus', pkgname: ['m64py'], icon: 'mupen64plus.png' },
        { name: 'Nestopia', pkgname: ['nestopia'], icon: 'nestopia.png' },
        { name: 'PCSX-R', pkgname: ['pcsxr'], icon: 'pcsxr.png' },
        { name: 'Pegasus frontend', pkgname: ['pegasus-frontend-git'], icon: 'generic.png' },
        { name: 'PCSX2', pkgname: ['pcsx2'], icon: 'pcsx2.png' },
        { name: 'PPSSPP', pkgname: ['ppsspp'], icon: 'ppsspp.png' },
        { name: 'Reicast', pkgname: ['reicast'], icon: 'reicast.png' },
        { name: 'RPCS3', pkgname: ['rpcs3'], icon: 'rpcs3.png' },
        { name: 'RetroArch', pkgname: ['retroarch'], icon: 'retroarch.png' },
        { name: 'RyuJinx', pkgname: ['ryujinx'], icon: 'ryujinx.png' },
        { name: 'SameBoy', pkgname: ['sameboy'], icon: 'sameboy.png' },
        { name: 'ScummVM', pkgname: ['scummvm'], icon: 'scummvm.png' },
        { name: 'Snes9x', pkgname: ['snes9x'], icon: 'snes9x.png' },
        { name: 'Stella', pkgname: ['stella'], icon: 'stella.gif' },
        { name: 'VBA-M', pkgname: ['vbam-wx'], icon: 'vba-m.png' },
        { name: 'VICE', pkgname: ['vice'], icon: 'vice.svg' },
        { name: 'WayDroid', pkgname: ['waydroid-script-git'], icon: 'waydroid.png' },
        { name: 'Xemu', pkgname: ['xemu'], icon: 'xemu.png' },
        { name: 'Yabause', pkgname: ['yabause-qt'], icon: 'yabause.png' },
        { name: 'Torzu (Yuzu)', pkgname: ['torzu-qt6-git'], icon: 'torzu.png' },
        { name: 'ZSNES', pkgname: ['zsnes'], icon: 'zsnes.png' },
      ],
    },
  ];

  protected readonly operationManager = inject(OperationManagerService);
  private readonly configService = inject(ConfigService);
  private readonly logger = Logger.getInstance();
  private readonly loadingService = inject(LoadingService);

  constructor() {
    effect(() => {
      const darkMode = this.configService.settings().darkMode;
      this.backgroundColor.set(darkMode ? flavors.mocha.colors.surface0.hex : flavors.latte.colors.surface0.hex);
    });
  }

  async ngOnInit(): Promise<void> {
    this.loadingService.loadingOn();
    await this.checkInstalled();
    this.loadingService.loadingOff();
  }

  async checkInstalled() {
    this.logger.info('Checking installed packages');
    const cmd = 'pacman -Qq';
    const result: ChildProcess<string> = await Command.create('exec-bash', ['-c', cmd]).execute();

    if (result.code !== 0) {
      this.logger.error(`Error checking installed packages: ${result.stderr}`);
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

  togglePackage(item: StatefulPackage): void {
    item.selected = !item.selected;
    this.operationManager.handleTogglePackage(item);
  }
}
