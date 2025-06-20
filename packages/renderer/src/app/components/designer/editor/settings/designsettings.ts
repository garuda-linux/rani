import { DesignerService } from '../../designerservice';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ConfirmPopupModule } from 'primeng/confirmpopup';

@Component({
  selector: 'design-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmPopupModule],
  template: ` <section>
      <div class="text-lg font-semibold mb-2">Font</div>
      <div class="flex gap-4">
        <div>
          <div class="text-sm mb-1 font-semibold text-surface-950 dark:text-surface-0">Base</div>
          <select
            class="appearance-none px-3 py-2 rounded-md border border-surface-300 dark:border-surface-700 w-20"
            [(ngModel)]="designerService.designer().theme.config.font_size"
            (change)="changeBaseFontSize()"
          >
            <option *ngFor="let fontSize of fontSizes" [value]="fontSize">{{ fontSize }}</option>
          </select>
        </div>

        <div>
          <div class="text-sm mb-1 font-semibold text-surface-950 dark:text-surface-0">Family</div>
          <select
            class="appearance-none px-3 py-2 rounded-md border border-surface-300 dark:border-surface-700 w-48"
            [(ngModel)]="designerService.designer().theme.config.font_family"
            (change)="changeFont()"
          >
            <option *ngFor="let font of fonts" [value]="font">{{ font }}</option>
          </select>
        </div>
      </div>
    </section>
    <p-confirm-popup />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignSettings {
  designerService: DesignerService = inject(DesignerService);

  confirmationService: ConfirmationService = inject(ConfirmationService);

  missingTokens = computed(() => this.designerService.missingTokens());

  status = computed(() => this.designerService.status());

  fontSizes: string[] = ['12px', '13px', '14px', '15px', '16px'];

  fonts: string[] = [
    'DM Sans',
    'Dosis',
    'Figtree',
    'IBM Plex Sans',
    'Inter var',
    'Lato',
    'Lexend',
    'Merriweather Sans',
    'Montserrat',
    'Noto Sans Display',
    'Nunito',
    'Nunito Sans',
    'Onest',
    'Open Sans',
    'Outfit',
    'Poppins',
    'PT Sans',
    'Public Sans',
    'Quicksand',
    'Raleway',
    'Roboto',
    'Source Sans Pro',
    'Space Grotesk',
    'Spline Sans',
    'Titillium Web',
    'Ubuntu Sans',
  ];

  async changeFont() {
    await this.designerService.applyFont(this.designerService.designer().theme.config.font_family);
    await this.designerService.saveTheme(this.designerService.designer().theme);
  }

  async changeBaseFontSize() {
    document.documentElement.style.setProperty('font-size', this.designerService.designer().theme.config.font_size);
    await this.designerService.saveTheme(this.designerService.designer().theme);
  }
}
