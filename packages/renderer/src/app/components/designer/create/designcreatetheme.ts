import { DesignerService, Theme } from '../designerservice';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { FileUploadModule } from 'primeng/fileupload';

const presets = {
  Aura,
  Lara,
  Nora,
};

@Component({
  selector: 'design-create-theme',
  standalone: true,
  imports: [CommonModule, FormsModule, DividerModule, FileUploadModule],
  template: `<section class="mb-6">
      <span class="block text-lg font-semibold mb-2">Theme Name</span>
      <input
        class="px-3 py-2 rounded-md border border-surface-300 dark:border-surface-700 flex-1"
        [(ngModel)]="themeName"
        type="text"
        autocomplete="off"
        maxlength="25"
      />
    </section>
    <section class="mb-6">
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
                  <p-fileUpload
                    [chooseButtonProps]="{ styleClass: 'btn-design choose-btn' }"
                    (onSelect)="onFileSelect($event)"
                    mode="basic"
                  ></p-fileUpload>
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

  themeName: string;

  basePreset = 'Aura';

  themeData: Theme | null = null;

  presetOptions = [
    { label: 'Aura', value: 'Aura' },
    { label: 'Lara', value: 'Lara' },
    { label: 'Nora', value: 'Nora' },
  ];

  async createThemeFromPreset() {
    if (!this.themeName || this.themeName.trim().length === 0) {
      this.messageService.add({
        key: 'designer',
        severity: 'error',
        summary: 'Error',
        detail: 'Name is required',
        life: 3000,
      });
    } else {
      const newPreset = structuredClone(presets[this.basePreset]);
      this.designerService.themeName.set(this.themeName);
      this.designerService.basePreset.set(this.basePreset);
      this.designerService.newPreset.set(newPreset);
      await this.designerService.createThemeFromPreset();
    }
  }

  onFileSelect(event: any) {
    const file = event.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      this.themeData = e.target.result;
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

    reader.onerror = (e) => {
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

  useThemeJson() {
    this.designerService.loadThemeEditor(this.themeData?.key, this.themeData?.preset);
  }
}
