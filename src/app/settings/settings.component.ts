import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { Checkbox } from 'primeng/checkbox';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';
import { Select, SelectChangeEvent } from 'primeng/select';
import { LogLevel } from '../logging/interfaces';
import { Logger } from '../logging/logging';
import { LanguageManagerService } from '../language-manager/language-manager.service';
import { LangPipePipe } from '../lang-pipe/lang-pipe.pipe';

@Component({
  selector: 'rani-settings',
  imports: [Checkbox, TranslocoDirective, FormsModule, Select],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  providers: [LangPipePipe],
})
export class SettingsComponent implements OnInit {
  protected readonly configService = inject(ConfigService);
  protected readonly checkBoxSettings: string[] = [
    'leftButtons',
    'copyDiagnostics',
    'darkMode',
    'autoStart',
    'autoRefresh',
    'showMainLinks',
    'systemdUserContext',
  ];
  logLevels: string[] = Object.values(LogLevel).filter((key) => typeof key !== 'number');

  protected languages = signal<{ language: string; label: string }[]>([]);
  protected settings = computed(() => {
    const settings: { name: string; value: boolean }[] = [];
    for (const [name, value] of Object.entries(this.configService.settings())) {
      if (this.checkBoxSettings.includes(name)) settings.push({ name, value });
    }
    return settings;
  });

  protected readonly LogLevel = LogLevel;
  protected readonly languageManagerService = inject(LanguageManagerService);
  private readonly logger = Logger.getInstance();
  private readonly translocoService = inject(TranslocoService);
  private readonly languagePipe = inject(LangPipePipe);

  ngOnInit() {
    const languages = [];
    for (const lang of this.translocoService.getAvailableLangs()) {
      languages.push({ language: lang as string, label: this.languagePipe.transform(lang as string) });
    }

    this.languages.set(languages);
  }

  async toggleSetting(entry: string) {
    await this.configService.updateConfig(entry, !this.configService.settings()[entry]);
  }

  async selectLogLevel($event: SelectChangeEvent) {
    const level = $event.value as 'ERROR' | 'DEBUG' | 'WARN' | 'TRACE' | 'INFO';
    await this.configService.updateConfig('logLevel', LogLevel[level]);
  }

  async selectLanguage($event: SelectChangeEvent) {
    this.logger.trace($event.value);
    await this.configService.updateConfig('language', $event.value);
  }
}
