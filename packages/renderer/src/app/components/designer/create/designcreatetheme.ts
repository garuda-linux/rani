import { DesignerService } from '../designerservice';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';
import Material from '@primeuix/themes/material';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { FileUploadModule } from 'primeng/fileupload';
import { Preset } from '@primeuix/themes/types';
import { Logger } from '../../../logging/logging';
import { themes } from '../../../theme';
import { Select } from 'primeng/select';

const presets: Record<string, Preset> = {
  Aura,
  Lara,
  Material,
  Nora,
};

@Component({
  selector: 'design-create-theme',
  standalone: true,
  imports: [CommonModule, FormsModule, DividerModule, FileUploadModule, Select],
  template: `<section class="mb-6">
    <div class="text-lg font-semibold mb-2">Foundation</div>
    <span class="block text-muted-color leading-6 mb-4">Start by choosing a built-in theme as a foundation</span>
    <div class="flex flex-col">
      <div class="flex flex-col gap-4 border border-surface-200 dark:border-surface-700 rounded-md p-4">
        <div class="flex items-center gap-2">
          <i class="pi pi-prime" style="font-size: 20px"></i>
          <span class="font-semibold">Base Theme</span>
        </div>
        <span class="text-muted-color">Variety of built-in themes with distinct characteristics.</span>
        <div class="flex justify-between">
          <div class="flex">
            <button
              class="border border-surface-200 dark:border-surface-700 px-3 py-2 border-r-0 last:border-r first:rounded-l-md last:rounded-r-md transition-colors duration-200"
              *ngFor="let presetOption of presetOptions"
              [ngClass]="{
                'bg-zinc-950 text-white dark:bg-white dark:text-black': presetOption.value === basePreset,
                'hover:bg-gray-100 dark:hover:bg-surface-800': presetOption.value !== basePreset,
              }"
              (click)="updateBasePreset(presetOption)"
              type="button"
            >
              {{ presetOption.label }}
            </button>
          </div>
          <button class="btn-design" (click)="createThemeFromPreset()" type="button">Create</button>
        </div>
      </div>

      <div class="flex flex-col">
        <div class="flex flex-col gap-4 border border-surface-200 dark:border-surface-700 rounded-md p-4">
          <div class="flex items-center gap-2">
            <i class="pi pi-prime" style="font-size: 20px"></i>
            <span class="font-semibold">Rani Preset</span>
          </div>
          <span class="text-muted-color">Customize one of the themes shipped with Rani to your like.</span>
          <div class="flex justify-between">
            <div class="flex">
              <p-select
                [(ngModel)]="raniPreset"
                [options]="raniPresetOptions"
                optionLabel="label"
                optionValue="label"
                placeholder="Select a preset"
              ></p-select>
            </div>
            <button class="btn-design" (click)="createThemeFromRaniPreset()" type="button">Create</button>
          </div>
        </div>
      </div>

      <div class="flex flex-col mt-5">
        <div class="flex flex-col gap-4 border border-surface-200 dark:border-surface-700 rounded-md p-4">
          <div class="flex items-center gap-2">
            <i class="pi pi-prime" style="font-size: 20px"></i>
            <span class="font-semibold">Upload saved theme JSON</span>
          </div>
          <span class="text-muted-color">Upload your previously saved theme, or upload a shared one.</span>
          <div class="flex justify-between">
            <div class="flex">
              <div class="flex justify-between">
                <p-fileupload
                  [chooseButtonProps]="{ styleClass: 'btn-design choose-btn' }"
                  (onSelect)="onFileSelect($event)"
                  mode="basic"
                ></p-fileupload>
              </div>
            </div>
            <button class="btn-design" (click)="useThemeJson()" type="button">Create</button>
          </div>
        </div>
      </div>
    </div>
  </section> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignCreateTheme {
  designerService: DesignerService = inject(DesignerService);
  messageService: MessageService = inject(MessageService);

  themeName = 'Rani theme';
  basePreset = 'Aura';
  themeData: string | null = null;
  presetOptions = [
    { label: 'Aura', value: 'Aura' },
    { label: 'Lara', value: 'Lara' },
    { label: 'Material', value: 'Material' },
    { label: 'Nora', value: 'Nora' },
  ];

  raniPreset = '';
  raniPresetOptions = Object.keys(themes).map((theme) => ({
    label: theme,
    value: themes[theme],
  }));

  private readonly logger: Logger = Logger.getInstance();

  async createThemeFromPreset() {
    this.logger.debug(`Creating theme from preset: ${this.basePreset}`);
    const newPreset: Preset = structuredClone(presets[this.basePreset]);

    this.designerService.themeName.set(this.themeName);
    this.designerService.basePreset.set(this.basePreset);
    this.designerService.newPreset.set(newPreset);

    await this.designerService.createThemeFromPreset();
  }

  onFileSelect(event: { files: File[] }) {
    const file = event.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.themeData = e.target?.result as string;

      try {
        this.themeData = JSON.parse(this.themeData);
        this.messageService.add({
          key: 'designer',
          severity: 'success',
          summary: 'Success',
          detail: 'File loaded successfully',
          life: 3000,
        });
      } catch (error) {
        this.messageService.add({
          key: 'designer',
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid JSON format',
          life: 3000,
        });
        this.themeData = null;
      }
    };

    reader.onerror = (e: ProgressEvent<FileReader>) => {
      this.messageService.add({
        key: 'designer',
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to read file',
        life: 3000,
      });
    };

    reader.readAsText(file);
  }

  updateBasePreset(preset: any) {
    this.basePreset = preset.value;
  }

  async useThemeJson() {
    if (!this.themeData) {
      this.messageService.add({
        key: 'designer',
        severity: 'error',
        summary: 'Error',
        detail: 'No theme data provided',
        life: 3000,
      });
      return;
    }
    await this.designerService.loadThemeEditor(this.themeData);
  }

  async createThemeFromRaniPreset() {
    this.logger.debug(`Creating theme from Rani preset: ${this.raniPreset}`);
    const preset = this.raniPresetOptions.find((p) => p.label === this.raniPreset)?.value;

    if (!preset) {
      this.messageService.add({
        key: 'designer',
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid Rani preset selected',
        life: 3000,
      });
      return;
    }

    const newPreset: Preset = structuredClone(preset);
    this.designerService.themeName.set(this.themeName);
    this.designerService.basePreset.set(this.raniPresetToBasePreset(this.raniPreset));
    this.designerService.newPreset.set(newPreset);
    await this.designerService.createThemeFromPreset();
  }

  raniPresetToBasePreset(raniPreset: string): string {
    switch (true) {
      case raniPreset.includes('Aura'):
        return 'Aura';
      case raniPreset.includes('Lara'):
        return 'Lara';
      case raniPreset.includes('Nora'):
        return 'Nora';
      case raniPreset.includes('Material'):
      default:
        return 'Aura';
    }
  }
}
