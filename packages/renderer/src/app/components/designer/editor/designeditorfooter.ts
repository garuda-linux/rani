import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesignerService } from '../designerservice';
import { ConfigService } from '../../config/config.service';

@Component({
  standalone: true,
  selector: 'design-editor-footer',
  imports: [CommonModule],
  template: `<div class="flex justify-end gap-2">
    <button class="btn-design-outlined" (click)="save()" type="button">Save</button>
    <button class="btn-design" (click)="apply()" type="button">Apply</button>
    <button class="btn-design-outlined" (click)="download()" type="button">Download</button>
    <button class="btn-design-outlined" (click)="reset()" type="button">Reset</button>
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignEditorFooter {
  configService: ConfigService = inject(ConfigService);
  designerService: DesignerService = inject(DesignerService);

  async apply() {
    await this.designerService.applyTheme(this.designerService.designer().theme);
  }

  async save() {
    await this.configService.updateConfig('customDesign', JSON.stringify(this.designerService.designer().theme));
  }

  async reset() {
    await this.designerService.createThemeFromPreset();
  }

  async download() {
    await this.designerService.downloadTheme(this.designerService.designer().theme);
  }
}
