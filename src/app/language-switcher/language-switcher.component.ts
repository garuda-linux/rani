import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
  OnDestroy,
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
export class LanguageSwitcherComponent implements OnDestroy {
  languages = signal<string[]>([]);
  ref: DynamicDialogRef | undefined;
  showButton = input<boolean>(false);
  visible = signal<boolean>(false);

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly configService = inject(ConfigService);
  private readonly dialogService = inject(DialogService);
  private readonly logger = Logger.getInstance();
  private readonly translocoService = inject(TranslocoService);

  constructor() {
    effect(() => {
      const savedLang: string = this.configService.settings().language;
      (async (): Promise<void> => {
        const sysLang: string | null = await locale();
        let activeLang: string = savedLang ?? sysLang;
        if (activeLang.match(/en-/)) {
          activeLang = 'en';
        }
        this.logger.trace(`Active language: ${activeLang}`);

        if (activeLang && activeLang !== this.translocoService.getActiveLang() && (this.translocoService.getAvailableLangs() as string[]).includes(activeLang)) {
          this.translocoService.setActiveLang(activeLang);
        }

        this.languages.set(this.translocoService.getAvailableLangs() as string[]);

        this.cdr.markForCheck();
      })();
    });
  }

  /**
   * Select a new language, setting it as the active language.
   * Additionally, update the query parameter if the current URL contains one and the language is not the default.
   * @param language The selected language
   */
  selectLanguage(language: string): void {
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
