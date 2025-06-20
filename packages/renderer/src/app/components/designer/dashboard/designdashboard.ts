import { ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MenuModule } from 'primeng/menu';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DesignerService } from '../designerservice';

@Component({
  selector: 'design-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, ToastModule, MenuModule, ConfirmPopupModule],
  template: `<div class="overflow-hidden mb-8" style="border-radius: 50px"></div>
    <div class="text-lg font-semibold mb-2">Theme Designer</div>
    <span class="block leading-6 mb-4"
      >Theme Designer is the ultimate tool to customize and design your own themes featuring a visual editor.</span
    >
    <div class="flex flex-wrap gap-4">
      <button
        class="rounded-xl h-32 w-32 bg-transparent border border-surface-200 dark:border-surface-700 text-black dark:text-white hover:border-surface-400 dark:hover:border-surface-500"
        (click)="openNewTheme()"
        type="button"
      >
        <i class="pi pi-plus"></i>
      </button>
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignDashboard {
  designerService = inject(DesignerService);

  openNewTheme() {
    this.designerService.designer.update((prev: any) => ({ ...prev, activeView: 'create_theme' }));
  }
}
