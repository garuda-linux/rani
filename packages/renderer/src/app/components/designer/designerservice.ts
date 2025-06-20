import { computed, inject, Injectable, signal, effect, untracked } from '@angular/core';
import { $dt, usePreset } from '@primeuix/styled';
import { MessageService } from 'primeng/api';
import { ConfigService } from '../config/config.service';
import { Logger } from '../../logging/logging';
import type { ITheme } from '@xterm/xterm';

export interface Theme {
  key: string | null;
  name: string | null;
  preset: Record<string, unknown> | null;
  config: Record<string, unknown> | null;
}

export interface Designer {
  active: boolean;
  activeView: string;
  activeTab: number;
  acTokens: unknown[];
  theme: Theme;
}
@Injectable({ providedIn: 'root' })
export class DesignerService {
  private readonly configService = inject(ConfigService);
  private readonly logger = Logger.getInstance();
  messageService: MessageService = inject(MessageService);

  designer = signal<Designer>({
    active: false,
    activeView: 'dashboard',
    activeTab: 0,
    acTokens: [],
    theme: {
      key: null,
      name: null,
      preset: null,
      config: null,
    },
  });

  preset = signal<{ primitive: unknown; semantic: unknown }>({ primitive: null, semantic: null });
  acTokens = computed(() => this.designer().acTokens);
  missingTokens = signal<unknown[]>([]);
  status = signal<'preview' | 'updated' | null>(null);
  otp = signal<string | undefined>(undefined);
  loading = signal<boolean>(false);
  // currentTheme = signal<unknown>(null); // Unused, commented out
  themeName = signal<string | undefined>(undefined);
  basePreset = signal<string | null>(null);
  newPreset = signal<Record<string, unknown> | null>(null);
  figmaData = signal<unknown>(null);

  mustNotTriggerEffect = false;

  constructor() {
    effect(() => {
      if (this.configService.settings().activeTheme === 'Custom Themedesigner' && !this.mustNotTriggerEffect) {
        this.logger.debug('Custom theme was triggered, activating designer');
        this.mustNotTriggerEffect = true;

        if (untracked(this.configService.settings).customDesign !== null) {
          this.logger.debug('Custom design found, activating theme');
          // @ts-ignore
          void this.activateTheme(JSON.parse(this.configService.settings().customDesign) as Theme);
        } else {
          this.logger.debug('No custom design found, creating new theme from preset');
          this.configService.updateState('designerActive', true);
          void this.createThemeFromPreset();
        }
      } else if (this.configService.settings().activeTheme !== 'Custom Themedesigner' && this.mustNotTriggerEffect) {
        this.logger.debug('Custom theme was deactivated, resetting designer state');
        this.mustNotTriggerEffect = false;
      }
    });
  }

  resolveColor(token: string): string {
    if (token && token.startsWith('{') && token.endsWith('}')) {
      const cssVariable = $dt(token).variable.slice(4, -1);
      return getComputedStyle(document.documentElement).getPropertyValue(cssVariable);
    } else {
      return token;
    }
  }

  refreshACTokens() {
    this.designer.update((prev) => ({ ...prev, acTokens: [] }));
    if (this.designer().theme.preset) {
      // @ts-expect-error whatever .......
      this.generateACTokens(null, this.designer().theme.preset);
    }
  }

  async createThemeFromPreset() {
    if (this.designer().activeView === 'editor') {
      this.designer.update((prev) => ({ ...prev, activeView: 'dashboard' }));
    }

    // @ts-ignore
    await this.loadThemeEditor('customTheme', this.newPreset());
  }

  generateACTokens(parentPath: string | null, obj: Record<string, unknown>) {
    for (const key in obj) {
      if (key === 'dark' || key === 'components' || key === 'directives') {
        continue;
      }
      if (key === 'primitive' || key === 'semantic' || key === 'colorScheme' || key === 'light' || key === 'extend') {
        this.generateACTokens(null, obj[key] as Record<string, unknown>);
      } else {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          this.generateACTokens(parentPath ? parentPath + '.' + key : key, obj[key] as Record<string, unknown>);
        } else {
          const regex = /\.\d+$/;
          const tokenName = this.camelCaseToDotCase(parentPath ? parentPath + '.' + key : key);
          const tokenValue = obj[key] as string;
          const isColor =
            tokenName.includes('color') ||
            tokenName.includes('background') ||
            regex.test(tokenName) ||
            (typeof tokenValue === 'string' &&
              (tokenValue.startsWith('#') ||
                tokenValue.startsWith('rgb') ||
                tokenValue.startsWith('hsl') ||
                tokenValue.startsWith('oklch')));
          this.designer.update((prev) => ({
            ...prev,
            acTokens: [
              ...prev.acTokens,
              {
                name: tokenName,
                label: '{' + tokenName + '}',
                variable: $dt(tokenName).variable,
                value: tokenValue,
                isColor: isColor,
              },
            ],
          }));
        }
      }
    }
  }

  camelCaseToDotCase(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, '$1.$2').toLowerCase();
  }

  async applyFont(fontFamily: string) {
    if (fontFamily !== 'Inter var') {
      await this.loadFont(fontFamily, 400);
      await this.loadFont(fontFamily, 500);
      await this.loadFont(fontFamily, 600);
      await this.loadFont(fontFamily, 700);
    } else {
      document.body.style.fontFamily = `"Inter var", sans-serif`;
    }
  }

  async loadFont(fontFamily: string, weight: number): Promise<FontFace | undefined> {
    try {
      const fontFamilyPath = fontFamily.toLowerCase().replace(/\s+/g, '-');
      const fontUrl = `https://fonts.bunny.net/${fontFamilyPath}/files/${fontFamilyPath}-latin-${weight}-normal.woff2`;
      const font = new FontFace(fontFamily, `url(${fontUrl})`, {
        weight: weight.toString(),
        style: 'normal',
      });
      const loadedFont = await font.load();
      document.fonts.add(loadedFont);
      document.body.style.fontFamily = `"${fontFamily}", sans-serif`;
      return loadedFont;
    } catch {
      // silent fail as some fonts may have not all the font weights
      return undefined;
    }
  }

  async applyTheme(theme: { preset: Record<string, unknown> }) {
    usePreset(theme.preset);
    this.messageService.add({
      key: 'designer',
      severity: 'success',
      summary: 'Success',
      detail: 'Theme applied.',
      life: 3000,
    });
  }

  async loadThemeEditor(t_key: string, preset: Record<string, unknown>) {
    this.designer.update((prev) => ({
      ...prev,
      theme: {
        name: this.themeName() ?? null,
        key: t_key,
        preset: preset,
        config: {
          font_size: '14px',
          font_family: 'Inter var',
        },
      },
    }));
    await this.applyFont('Inter var');
    document.documentElement.style.fontSize = '14px';
    usePreset(preset);
    this.designer.update((prev) => ({ ...prev, activeTab: 0, activeView: 'editor' }));
    this.themeName.set(undefined);
    this.basePreset.set(null);
    this.newPreset.set(null);

    console.debug('Theme editor loaded with preset:', preset);
    console.debug('Current designer state:', this.designer());
  }

  async activateTheme(data: Theme) {
    this.designer.update((prev) => ({
      ...prev,
      active: true,
      theme: {
        key: data.key,
        name: data.name,
        preset: data.preset,
        config: data.config,
      },
    }));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    usePreset(this.designer().theme.preset!);
    await this.applyFont((this.designer().theme.config as Record<string, string>)['fontFamily']);
    document.documentElement.style.setProperty(
      'font-size',
      (this.designer().theme.config as Record<string, string>)['font_size'],
    );
    this.designer.update((prev) => ({ ...prev, activeTab: 0, activeView: 'editor' }));
    this.status.set(null);
  }

  /**
   * Save the current theme to the configuration, as a JSON string.
   * @param theme The theme object to save.
   */
  async saveTheme(theme: Theme) {
    this.configService.updateConfig('customDesign', JSON.stringify(theme));
  }

  /**
   * Download the theme as a JSON file.
   * @param theme The theme object to download.
   */
  async downloadTheme(theme: Theme) {
    const file = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
    const blobUrl: string = window.URL.createObjectURL(file);
    const link: HTMLAnchorElement = document.createElement('a');

    link.setAttribute('href', blobUrl);
    link.setAttribute('download', `${theme.name}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }

  /**
   * Get the xterm.js theme based on the current design settings.
   * @param darkMode Whether to use the dark mode theme.
   * @return The xterm.js theme object.
   */
  getXtermTheme(darkMode: boolean): ITheme {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const designTheme = JSON.parse(this.configService.settings().customDesign!) as Theme;
    const themePreset = designTheme.preset as any;
    const colorScheme = darkMode ? themePreset.semantic.colorScheme.dark : themePreset.semantic.colorScheme.light;

    return {
      // Basic terminal settings
      foreground: this.resolveColor(colorScheme.text.color),
      background: this.resolveColor(colorScheme.content.background),
      cursor: this.resolveColor(colorScheme.primary.color),
      cursorAccent: this.resolveColor(colorScheme.content.background),

      // Standard ANSI colors derived from colorScheme
      black: this.resolveColor(colorScheme.surface[950]),
      red: this.resolveColor(colorScheme.formField.invalidBorderColor),
      green: this.resolveColor(colorScheme.primary.color),
      yellow: this.resolveColor(colorScheme.navigation.item.icon.color),
      blue: this.resolveColor(colorScheme.highlight.background),
      magenta: this.resolveColor(colorScheme.primary.hoverColor),
      cyan: this.resolveColor(colorScheme.highlight.focusBackground),
      white: this.resolveColor(colorScheme.formField.color),

      // Bright variants
      brightBlack: this.resolveColor(colorScheme.surface[700]),
      brightRed: this.resolveColor(colorScheme.formField.invalidPlaceholderColor),
      brightGreen: this.resolveColor(colorScheme.primary.hoverColor),
      brightYellow: this.resolveColor(colorScheme.navigation.item.icon.focusColor),
      brightBlue: this.resolveColor(colorScheme.primary.activeColor),
      brightMagenta: this.resolveColor(colorScheme.highlight.focusColor),
      brightCyan: this.resolveColor(colorScheme.formField.floatLabelFocusColor),
      brightWhite: this.resolveColor(colorScheme.text.hoverColor),
    };
  }

  /**
   * Get the scrollbar colors based on the current design settings.
   * @param darkMode Whether to use the dark mode colors.
   * @return An object containing the scrollbar colors.
   */
  getScrollbarColors(darkMode: boolean): ScrollbarColors {
    const designTheme = JSON.parse(this.configService.settings().customDesign!) as Theme;
    const themePreset = designTheme.preset as any;
    const colorScheme = darkMode ? themePreset.semantic.colorScheme.dark : themePreset.semantic.colorScheme.light;

    return {
      scrollbarColor: this.resolveColor(colorScheme.content.background),
      backgroundColor: this.resolveColor(colorScheme.primary.color),
    };
  }
}

export interface ScrollbarColors {
  scrollbarColor: string;
  backgroundColor: string;
}
