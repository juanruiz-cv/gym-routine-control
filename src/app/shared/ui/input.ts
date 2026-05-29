import { Component, input, forwardRef, model } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-ui-input',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiInput), multi: true }],
  template: `
    <div class="flex flex-col gap-1.5">
      @if (label()) {
        <label [for]="id()" class="text-sm font-medium text-on-surface">{{ label() }}</label>
      }
      <div class="relative">
        @if (hasIcon()) {
          <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-muted pointer-events-none">
            <ng-content select="[icon]" />
          </div>
        }
        <input
          [id]="id()" [type]="type()" [value]="value()" (input)="onInput($event)" (blur)="onBlur()"
          [placeholder]="placeholder()" [disabled]="disabled()" [attr.autocomplete]="autocomplete()"
          class="w-full px-4 py-3 rounded-xl bg-surface-input border transition-colors text-on-surface placeholder:text-on-surface-muted/50 focus:outline-none focus:ring-1"
          [class.pl-11]="hasIcon()" [class.border-error]="!!error()" [class.border-white/10]="!error()"
          [class.focus:border-brand]="!error()" [class.focus:ring-brand]="!error()"
          [class.focus:border-error]="!!error()" [class.focus:ring-error]="!!error()"
          [class.opacity-50]="disabled()"
        />
      </div>
      @if (error()) { <p class="text-xs text-error mt-0.5" role="alert">{{ error() }}</p> }
      @if (hint() && !error()) { <p class="text-xs text-on-surface-muted mt-0.5">{{ hint() }}</p> }
    </div>
  `,
})
export class UiInput implements ControlValueAccessor {
  readonly id = input(`input-${Math.random().toString(36).slice(2, 9)}`);
  readonly label = input('');
  readonly type = input('text');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly disabled = input(false);
  readonly autocomplete = input('off');
  readonly hasIcon = input(false);
  readonly value = model('');

  private _onChange?: (value: string) => void;
  private _onTouched?: () => void;

  protected onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this._onChange?.(val);
  }
  protected onBlur(): void { this._onTouched?.(); }
  writeValue(val: string): void { this.value.set(val ?? ''); }
  registerOnChange(fn: (value: string) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void { this._onTouched = fn; }
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  setDisabledState(_: boolean): void {}
}
