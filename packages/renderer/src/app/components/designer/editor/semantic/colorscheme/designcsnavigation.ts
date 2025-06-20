import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldsetModule } from 'primeng/fieldset';
import { FormsModule } from '@angular/forms';
import { DesignTokenField } from '../../designtokenfield';

@Component({
  selector: 'design-cs-navigation',
  standalone: true,
  imports: [CommonModule, DesignTokenField, FormsModule, FieldsetModule],
  template: ` <p-fieldset [toggleable]="true" legend="Navigation">
    <div class="text-sm mb-1 font-semibold text-surface-950 dark:text-surface-0">Item</div>
    <section class="grid grid-cols-4 mb-3 gap-2">
      <div class="flex flex-col gap-1">
        <design-token-field
          [(modelValue)]="colorScheme.navigation.item.focusBackground"
          [type]="'color'"
          label="Focus BG"
        />
      </div>
      <div class="flex flex-col gap-1">
        <design-token-field
          [(modelValue)]="colorScheme.navigation.item.focusBackground"
          [type]="'color'"
          label="Active BG"
        />
      </div>
      <div class="flex flex-col gap-1"></div>
      <div class="flex flex-col gap-1"></div>

      <div class="flex flex-col gap-1">
        <design-token-field [(modelValue)]="colorScheme.navigation.item.color" [type]="'color'" label="Color" />
      </div>
      <div class="flex flex-col gap-1">
        <design-token-field
          [(modelValue)]="colorScheme.navigation.item.focusColor"
          [type]="'color'"
          label="Focus Color"
        />
      </div>
      <div class="flex flex-col gap-1">
        <design-token-field
          [(modelValue)]="colorScheme.navigation.item.activeColor"
          [type]="'color'"
          label="Active Color"
        />
      </div>
      <div class="flex flex-col gap-1"></div>
    </section>

    <div class="text-sm mb-1 font-semibold text-surface-950 dark:text-surface-0">Item Icon</div>
    <section class="grid grid-cols-4 mb-3 gap-2">
      <div class="flex flex-col gap-1">
        <design-token-field [(modelValue)]="colorScheme.navigation.item.icon.color" [type]="'color'" label="Color" />
      </div>
      <div class="flex flex-col gap-1">
        <design-token-field
          [(modelValue)]="colorScheme.navigation.item.icon.focusColor"
          [type]="'color'"
          label="Focus Color"
        />
      </div>
      <div class="flex flex-col gap-1">
        <design-token-field
          [(modelValue)]="colorScheme.navigation.item.icon.activeColor"
          [type]="'color'"
          label="Active Color"
        />
      </div>
      <div class="flex flex-col gap-1"></div>
    </section>

    <div class="text-sm mb-1 font-semibold text-surface-950 dark:text-surface-0">Submenu Label</div>
    <section class="grid grid-cols-4 mb-3 gap-2">
      <div class="flex flex-col gap-1">
        <design-token-field
          [(modelValue)]="colorScheme.navigation.submenuLabel.background"
          [type]="'color'"
          label="BG"
        />
      </div>
      <div class="flex flex-col gap-1">
        <design-token-field [(modelValue)]="colorScheme.navigation.submenuLabel.color" [type]="'color'" label="Color" />
      </div>
      <div class="flex flex-col gap-1"></div>
      <div class="flex flex-col gap-1"></div>
    </section>

    <div class="text-sm mb-1 font-semibold text-surface-950 dark:text-surface-0">Submenu Icon</div>
    <section class="grid grid-cols-4 mb-3 gap-2">
      <div class="flex flex-col gap-1">
        <design-token-field [(modelValue)]="colorScheme.navigation.submenuIcon.color" [type]="'color'" label="Color" />
      </div>
      <div class="flex flex-col gap-1">
        <design-token-field
          [(modelValue)]="colorScheme.navigation.submenuIcon.focusColor"
          [type]="'color'"
          label="Focus Color"
        />
      </div>
      <div class="flex flex-col gap-1">
        <design-token-field
          [(modelValue)]="colorScheme.navigation.submenuIcon.activeColor"
          [type]="'color'"
          label="Active Color"
        />
      </div>
      <div class="flex flex-col gap-1"></div>
    </section>
  </p-fieldset>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignCSNavigation {
  @Input() colorScheme: any;
}
