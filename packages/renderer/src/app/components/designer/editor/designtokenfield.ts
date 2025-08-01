import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  input,
  Input,
  model,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { $dt } from '@primeuix/themes';
import { AutoCompleteCompleteEvent, AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { UniqueComponentId } from 'primeng/utils';
import { DesignerService } from '../designerservice';

@Component({
  selector: 'design-token-field',
  standalone: true,
  imports: [CommonModule, AutoCompleteModule, FormsModule, TooltipModule, ReactiveFormsModule],
  template: `<div class="group">
    <div class="flex justify-between items-center">
      <label
        class="text-xs text-zinc-700 dark:text-white/70 block capitalize text-ellipsis overflow-hidden w-full whitespace-nowrap mb-px"
        for="inputId"
        title="label"
        >{{ label }}</label
      >
      <button *ngIf="switchable" (click)="transfer($event)" type="button" tabindex="-1" style="line-height:14px;">
        <i
          class="pi pi-sort-alt text-zinc-500 dark:text-white/50 !hidden group-hover:!inline-block animate-fadein"
          title="Transfer between color scheme and common"
          style="font-size: .75rem !important; line-height: 14px;"
        ></i>
      </button>
    </div>
    <div class="relative" [id]="id">
      <p-auto-complete
        [(ngModel)]="modelValue"
        [class.ng-invalid]="isInvalid()"
        [class.ng-dirty]="isInvalid()"
        [class.ng-pristine]="!isInvalid()"
        [class.ng-untouched]="!isInvalid()"
        [class.ng-valid]="!isInvalid()"
        [inputId]="inputId"
        [suggestions]="items"
        [showEmptyMessage]="false"
        [inputStyleClass]="inputStyleClass()"
        [maxlength]="100"
        (onSelect)="onOptionSelect($event)"
        (completeMethod)="search($event)"
        (onKeyUp)="onInput($event)"
        optionLabel="label"
      >
        <ng-template #item let-option>
          <div
            class="w-full flex items-center justify-between gap-4 px-2"
            [pTooltip]="getTooltipData(option)"
            tooltipPosition="left"
          >
            <span>{{ option.label }}</span>
            @if (getIsColor(option)) {
              <div
                class="border border-surface-200 dark:border-surface-700 w-4 h-4 rounded-full"
                *ngIf="option.isColor"
                [style]="{ backgroundColor: resolveColor(option.value) }"
              ></div>
            } @else {
              <div class="text-xs max-w-16 text-ellipsis whitespace-nowrap overflow-hidden">
                {{ option.value }}
              </div>
            }
          </div>
        </ng-template>
      </p-auto-complete>
      <div
        class="absolute right-[4px] top-1/2 -mt-3 w-6 h-6 rounded-md border border-surface-300 dark:border-surface-600"
        *ngIf="type() === 'color'"
        [style]="{ backgroundColor: previewColor() }"
      ></div>
    </div>
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignTokenField implements OnInit {
  private designerService: DesignerService = inject(DesignerService);

  @Input() label: string | undefined;

  type = input<string>();

  modelValue = model<any>();

  @Input() switchable = false;

  @Input() path: string | undefined;

  @Input() componentKey: any;

  @Output() modelValueChange = new EventEmitter<any>();

  id: string | undefined;

  items: any;

  inputStyleClass = computed(() => {
    const styleClass = this.isInvalid()
      ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-500/30'
      : 'border-surface-300 dark:border-surface-600';
    return this.type() === 'color' ? `!text-xs !pr-8 ${styleClass}` : `!text-xs ${styleClass}`;
  });

  isInvalid = computed(() => {
    return (
      this.modelValue() == null ||
      this.modelValue().trim().length === 0 ||
      this.modelValue().startsWith(this.componentKey) ||
      (this.modelValue().isColor && $dt(this.modelValue()).value === undefined)
    );
  });

  previewColor = computed(() => {
    const tokenValue = typeof this.modelValue() === 'object' ? this.modelValue().name : this.modelValue();
    return tokenValue && tokenValue.trim().length && tokenValue.startsWith('{') && tokenValue.endsWith('}')
      ? $dt(tokenValue).variable
      : tokenValue;
  });

  ngOnInit() {
    this.id = 'dt_field_' + UniqueComponentId();
  }

  resolveColor(value: any) {
    return this.designerService.resolveColor(value);
  }

  getTooltipData(option: any) {
    return typeof option !== 'object' && option.value;
  }

  get inputId() {
    return this.id + '_input';
  }

  getIsColor(option: { isColor: boolean }) {
    return option.isColor;
  }

  onOptionSelect(event: AutoCompleteSelectEvent) {
    this.modelValue.set(event.value.label);
    this.modelValueChange.emit(this.modelValue());
    event.originalEvent.stopPropagation();
  }

  onInput(event: KeyboardEvent) {
    // @ts-expect-error - event.target may not have complete type information
    this.modelValue.set(event.target.value);
    this.modelValueChange.emit(this.modelValue());
  }

  search(event: AutoCompleteCompleteEvent) {
    const query = event.query;

    if (query.startsWith('{')) {
      this.items = this.designerService.acTokens().filter((t) => t.label.startsWith(query));
    } else {
      this.items = [];
    }
  }

  getPathFromColorScheme(colorScheme: string) {
    const lightPrefix = 'light.';
    const darkPrefix = 'dark.';

    if (colorScheme.startsWith(lightPrefix)) {
      return colorScheme.slice(lightPrefix.length);
    } else if (colorScheme.startsWith(darkPrefix)) {
      return colorScheme.slice(darkPrefix.length);
    }

    return colorScheme;
  }

  transfer(event: MouseEvent) {
    // @ts-expect-error - dynamic component key access on preset components object
    const tokens = this.designerService.designer().theme.preset?.components[this.componentKey];
    const colorSchemePrefix = 'colorScheme.';

    if (this.path?.startsWith(colorSchemePrefix)) {
      const tokenPath = this.getPathFromColorScheme(this.path.slice(colorSchemePrefix.length));

      this.set(tokens, tokenPath, this.modelValue());
      this.unset(tokens, 'colorScheme.light.' + tokenPath);
      this.unset(tokens, 'colorScheme.dark.' + tokenPath);
    } else {
      this.set(tokens, 'colorScheme.light.' + this.path, this.modelValue());
      this.set(tokens, 'colorScheme.dark.' + this.path, this.modelValue());
      this.unset(tokens, this.path);
    }

    this.removeEmptyProps(tokens);
    this.designerService.designer.update((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        // @ts-expect-error - dynamic component key access on theme preset
        preset: {
          ...prev.theme.preset,
          // @ts-expect-error - dynamic component key access on preset components object
          components: { ...prev.theme.preset?.components, [this.componentKey]: { ...tokens } },
        },
      },
    }));
    event.preventDefault();
  }

  removeEmptyProps(obj: any) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];

        if (typeof value === 'object' && value !== null) {
          this.removeEmptyProps(value);
        }

        if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
          Reflect.deleteProperty(obj, key);
        }
      }
    }

    return obj;
  }

  set(obj: string | number | object | undefined, path: string, value: any) {
    if (Object(obj) !== obj) return obj;
    const pathArray = Array.isArray(path) ? path : path.toString().match(/[^.[\]]+/g) || [];

    pathArray.reduce((acc, key, i) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return acc;
      }

      if (i === pathArray.length - 1) {
        acc[key] = value;

        return value;
      }

      acc[key] = Object(acc[key]) === acc[key] ? acc[key] : {};

      return acc[key];
    }, obj);

    return obj;
  }

  unset(obj: string | number | object | undefined, path: string | undefined) {
    if (Object(obj) !== obj) return false;

    const pathArray = Array.isArray(path) ? path : path?.toString().match(/[^.[\]]+/g) || [];

    if (pathArray.length === 0) return false;

    // @ts-expect-error - prototype pollution check requires dynamic property access
    if (pathArray.includes('__proto__') || pathArray.includes('constructor') || pathArray.includes('prototype')) {
      return false;
    }

    let current = obj;
    const length = pathArray.length;

    for (let i = 0; i < length - 1; i++) {
      const key = pathArray[i];

      // @ts-expect-error - dynamic property access with computed key
      if (current[key] == null) {
        return false;
      }

      // @ts-expect-error - dynamic property navigation with computed key
      current = current[key];
    }

    const lastKey = pathArray[length - 1];

    // @ts-expect-error - dynamic property existence check with computed key
    if (!(lastKey in current)) {
      return false;
    }

    // @ts-expect-error - dynamic property deletion with computed key
    Reflect.deleteProperty(current, lastKey);

    return true;
  }
}
