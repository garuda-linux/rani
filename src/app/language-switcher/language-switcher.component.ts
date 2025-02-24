import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AppService } from '../app.service';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { LanguageSelectionComponent } from '../language-selection/language-selection.component';
import { locale } from '@tauri-apps/plugin-os';
import { getConfigStore } from '../store';
import { Store } from '@tauri-apps/plugin-store';

@Component({
  selector: 'app-language-switcher',
  imports: [CommonModule, Button, TranslocoDirective, DynamicDialogModule, DialogModule],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css',
  providers: [DialogService],
})
export class LanguageSwitcherComponent implements OnInit, OnDestroy {
  languages = signal<string[]>([]);
  ref: DynamicDialogRef | undefined;
  visible = signal(false);

  private readonly appService = inject(AppService);
  private readonly dialogService = inject(DialogService);
  private readonly route = inject(Router).routerState.root;
  private readonly translocoService = inject(TranslocoService);

  /**
   * Initialize the component and subscribe to the router events to detect language changes
   * via query parameters.
   */
  async ngOnInit(): Promise<void> {
    const sysLang: string | null = await locale();
    const store: Store = await getConfigStore();
    const savedLang = (await store.get('language')) as string;

    let activeLang: string = savedLang ?? sysLang;
    if (activeLang.match(/en-/)) {
      activeLang = 'en';
    }

    if (activeLang && activeLang !== this.translocoService.getActiveLang()) {
      this.translocoService.setActiveLang(activeLang);
      void store.set('language', sysLang);
    } else if (
      !savedLang &&
      sysLang &&
      (this.translocoService.getAvailableLangs() as unknown as string).includes(sysLang)
    ) {
      void store.set('language', sysLang);
      this.appService.translocoService.setActiveLang(sysLang);
    }

    this.appService.activeLanguage.set(this.translocoService.getActiveLang());
    this.languages.set(this.translocoService.getAvailableLangs() as string[]);
  }

  /**
   * Select a new language, setting it as the active language.
   * Additionally, update the query parameter if the current URL contains one and the language is not the default.
   * @param language The selected language
   */
  selectLanguage(language: string): void {
    this.translocoService.setActiveLang(language);
    this.appService.activeLanguage.set(language);
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
      console.error('Language selected:', language);
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
