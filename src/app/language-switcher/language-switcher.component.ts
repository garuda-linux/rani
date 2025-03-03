import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { DialogModule } from 'primeng/dialog';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { LanguageSelectionComponent } from './language-selection.component';
import { locale } from '@tauri-apps/plugin-os';
import { ConfigService } from '../config/config.service';
import { Logger } from '../logging/logging';

@Component({
  selector: 'rani-language-switcher',
  imports: [CommonModule, Button, TranslocoDirective, DynamicDialogModule, DialogModule],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css',
  providers: [DialogService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent implements OnInit, OnDestroy {
  languages = signal<string[]>([]);
  ref: DynamicDialogRef | undefined;
  showButton = input<boolean>(false);
  visible = signal<boolean>(false);

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly configService = inject(ConfigService);
  private readonly dialogService = inject(DialogService);
  private readonly logger = Logger.getInstance();
  private readonly translocoService = inject(TranslocoService);

  /**
   * Initialize the component and subscribe to the router events to detect language changes
   * via query parameters.
   */
  async ngOnInit(): Promise<void> {
    const sysLang: string | null = await locale();
    const savedLang: string = this.configService.settings().language;

    let activeLang: string = savedLang ?? sysLang;
    if (activeLang.match(/en-/)) {
      activeLang = 'en';
    }
    this.logger.trace(`Active language: ${activeLang}`);

    if (activeLang && activeLang !== this.translocoService.getActiveLang()) {
      this.translocoService.setActiveLang(activeLang);
      await this.configService.updateConfig('language', activeLang);
    } else if (
      !savedLang &&
      sysLang &&
      (this.translocoService.getAvailableLangs() as unknown as string).includes(sysLang)
    ) {
      this.translocoService.setActiveLang(sysLang);
    }

    await this.configService.updateConfig('language', this.translocoService.getActiveLang());
    this.languages.set(this.translocoService.getAvailableLangs() as string[]);

    this.cdr.markForCheck();
  }

  /**
   * Select a new language, setting it as the active language.
   * Additionally, update the query parameter if the current URL contains one and the language is not the default.
   * @param language The selected language
   */
  selectLanguage(language: string): void {
    this.translocoService.setActiveLang(language);
    void this.configService.updateConfig('language', language);
    this.cdr.markForCheck();
  }

  /**
   * Open the language selection dialog, allowing the user to choose a new language.
   * When the dialog is closed, the selected language is set as the active language.
   */
  show(): void {
    this.ref = this.dialogService.open(LanguageSelectionComponent, {
      modal: true,
      dismissableMask: true,
    });
    this.ref.onClose.subscribe((language: string) => {
      if (language) {
        this.selectLanguage(language);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.ref) {
      this.ref.close();
    }
  }
}
