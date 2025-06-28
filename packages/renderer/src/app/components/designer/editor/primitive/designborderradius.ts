import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldsetModule } from 'primeng/fieldset';
import { FormsModule } from '@angular/forms';
import { DesignerService } from '../../designerservice';
import { DesignTokenField } from '../designtokenfield';

@Component({
  selector: 'design-border-radius',
  standalone: true,
  imports: [CommonModule, DesignTokenField, FieldsetModule, FormsModule],
  template: ` <p-fieldset [toggleable]="true" legend="Rounded">
    <section class="grid grid-cols-4 gap-2">
      <div class="flex flex-col gap-1">
        <design-token-field [(modelValue)]="borderRadiusNone" label="None" />
      </div>
      <div class="flex flex-col gap-1">
        <design-token-field [(modelValue)]="borderRadiusXs" label="Extra Small" />
      </div>
      <div class="flex flex-col gap-1">
        <design-token-field [(modelValue)]="borderRadiusSm" label="Small" />
      </div>
      <div class="flex flex-col gap-1">
        <design-token-field [(modelValue)]="borderRadiusMd" label="Medium" />
      </div>
      <div class="flex flex-col gap-1">
        <design-token-field [(modelValue)]="borderRadiusLg" label="Large" />
      </div>
      <div class="flex flex-col gap-1">
        <design-token-field [(modelValue)]="borderRadiusXl" label="Extra Large" />
      </div>
    </section>
  </p-fieldset>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignBorderRadius {
  designerService = inject(DesignerService);

  get borderRadiusNone() {
    // @ts-ignore
    return this.designerService.designer().theme?.preset?.primitive?.borderRadius.none;
  }
  set borderRadiusNone(value: any) {
    // @ts-ignore
    this.designerService.designer.update((prev) => {
      if (prev.theme.preset) {
        return {
          ...prev,
          theme: {
            ...prev.theme,
            preset: {
              ...prev.theme.preset,
              primitive: {
                // @ts-ignore
                ...prev.theme.preset.primitive,
                // @ts-ignore
                borderRadius: { ...prev.theme.preset.primitive.borderRadius, none: value },
              },
            },
          },
        };
      }
      return prev;
    });
  }

  get borderRadiusXs() {
    // @ts-ignore
    return this.designerService.designer().theme?.preset?.primitive.borderRadius.xs;
  }
  set borderRadiusXs(value: any) {
    // @ts-ignore
    this.designerService.designer.update((prev) => {
      if (prev.theme.preset) {
        return {
          ...prev,
          theme: {
            ...prev.theme,
            preset: {
              ...prev.theme.preset,
              primitive: {
                // @ts-ignore
                ...prev.theme.preset.primitive,
                // @ts-ignore
                borderRadius: { ...prev.theme.preset.primitive.borderRadius, xs: value },
              },
            },
          },
        };
      }
      return prev;
    });
  }

  get borderRadiusSm() {
    // @ts-ignore
    return this.designerService.designer().theme?.preset?.primitive?.borderRadius.sm;
  }
  set borderRadiusSm(value: any) {
    // @ts-ignore
    this.designerService.designer.update((prev) => {
      if (prev.theme.preset) {
        return {
          ...prev,
          theme: {
            ...prev.theme,
            preset: {
              ...prev.theme.preset,
              primitive: {
                // @ts-ignore
                ...prev.theme.preset.primitive,
                // @ts-ignore
                borderRadius: { ...prev.theme.preset.primitive.borderRadius, sm: value },
              },
            },
          },
        };
      }
      return prev;
    });
  }

  get borderRadiusMd() {
    // @ts-ignore
    return this.designerService.designer().theme?.preset?.primitive?.borderRadius.md;
  }
  set borderRadiusMd(value: any) {
    // @ts-ignore
    this.designerService.designer.update((prev) => {
      if (prev.theme.preset) {
        return {
          ...prev,
          theme: {
            ...prev.theme,
            preset: {
              ...prev.theme.preset,
              primitive: {
                // @ts-ignore
                ...prev.theme.preset.primitive,
                // @ts-ignore
                borderRadius: { ...prev.theme.preset.primitive.borderRadius, md: value },
              },
            },
          },
        };
      }
      return prev;
    });
  }

  get borderRadiusLg() {
    // @ts-ignore
    return this.designerService.designer().theme?.preset?.primitive?.borderRadius.lg;
  }
  set borderRadiusLg(value: any) {
    // @ts-ignore
    this.designerService.designer.update((prev) => {
      if (prev.theme.preset) {
        return {
          ...prev,
          theme: {
            ...prev.theme,
            preset: {
              ...prev.theme.preset,
              primitive: {
                // @ts-ignore
                ...prev.theme.preset.primitive,
                // @ts-ignore
                borderRadius: { ...prev.theme.preset.primitive.borderRadius, lg: value },
              },
            },
          },
        };
      }
      return prev;
    });
  }

  get borderRadiusXl() {
    // @ts-ignore
    return this.designerService.designer().theme?.preset?.primitive?.borderRadius.xl;
  }
  set borderRadiusXl(value: any) {
    // @ts-ignore
    this.designerService.designer.update((prev) => {
      if (prev.theme.preset) {
        return {
          ...prev,
          theme: {
            ...prev.theme,
            preset: {
              ...prev.theme.preset,
              primitive: {
                // @ts-ignore
                ...prev.theme.preset.primitive,
                // @ts-ignore
                borderRadius: { ...prev.theme.preset.primitive.borderRadius, xl: value },
              },
            },
          },
        };
      }
      return prev;
    });
  }
}
