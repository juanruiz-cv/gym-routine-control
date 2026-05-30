import { Component, input, model, signal, computed, ElementRef, HostListener, viewChildren, viewChild, inject } from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-ui-select',
  standalone: true,
  template: `
    <div class="relative">
      @if (label()) {
        <label [for]="selectId()" class="text-sm font-medium text-on-surface mb-1.5 block">{{ label() }}</label>
      }
      <button
        #trigger
        [id]="selectId()"
        type="button"
        role="combobox"
        [disabled]="disabled()"
        (click)="toggle()"
        (keydown)="onTriggerKeydown($event)"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-controls]="isOpen() ? listboxId() : null"
        class="w-full flex items-center justify-between gap-2 text-left transition-colors
               bg-surface-input border border-border text-on-surface
               focus:outline-none focus:ring-1 focus:ring-brand
               disabled:opacity-50 disabled:cursor-not-allowed"
        [class.rounded-xl]="size() === 'md'"
        [class.rounded-lg]="size() === 'sm'"
        [class.px-4]="size() === 'md'"
        [class.py-3]="size() === 'md'"
        [class.px-3]="size() === 'sm'"
        [class.py-1.5]="size() === 'sm'"
        [class.text-sm]="size() === 'sm'"
      >
        <span class="truncate" [class.text-on-surface-muted]="!selectedLabel()">
          {{ selectedLabel() || placeholder() }}
        </span>
        <svg
          class="w-4 h-4 shrink-0 text-on-surface-muted transition-transform duration-200"
          [class.rotate-180]="isOpen()"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      @if (isOpen()) {
        <div
          [id]="listboxId()"
          class="absolute z-50 left-0 right-0 mt-1 bg-surface-elevated border border-border shadow-lg overflow-hidden animate-fade-in"
          [class.rounded-xl]="size() === 'md'"
          [class.rounded-lg]="size() === 'sm'"
          (mousedown)="$event.stopPropagation()"
          role="listbox"
        >
          @for (opt of options(); track opt.value; let idx = $index) {
            <button
              #optionBtn
              type="button"
              role="option"
              [attr.aria-selected]="value() === opt.value"
              (click)="selectOption(opt.value)"
              (keydown)="onOptionKeydown($event, opt.value)"
              class="w-full text-left transition-colors focus:outline-none focus:bg-surface-hover"
              [class.bg-brand/10.text-brand]="value() === opt.value"
              [class.hover:bg-surface-hover]="value() !== opt.value"
              [class.text-on-surface]="value() !== opt.value"
              [class.px-4.py-3]="size() === 'md'"
              [class.px-3.py-2.text-sm]="size() === 'sm'"
            >
              {{ opt.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class UiSelect {
  readonly label = input('');
  readonly placeholder = input('');
  readonly options = input<SelectOption[]>([]);
  readonly value = model('');
  readonly disabled = input(false);
  readonly size = input<'sm' | 'md'>('md');
  readonly selectId = input(`select-${Math.random().toString(36).slice(2, 9)}`);
  protected readonly listboxId = computed(() => `${this.selectId()}-listbox`);

  protected readonly isOpen = signal(false);
  protected readonly selectedLabel = computed(() => {
    const opt = this.options().find(o => o.value === this.value());
    return opt?.label ?? '';
  });

  private _focusedIndex = 0;
  private readonly _elementRef = inject(ElementRef);
  protected readonly _optionElements = viewChildren<ElementRef<HTMLButtonElement>>('optionBtn');
  private readonly _triggerElement = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  protected toggle(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  protected open(): void {
    if (this.disabled()) return;
    this.isOpen.set(true);
    this._focusedIndex = 0;
    requestAnimationFrame(() => this._focusOption(0));
  }

  protected close(): void {
    this.isOpen.set(false);
    this._triggerElement()?.nativeElement.focus();
  }

  protected selectOption(value: string): void {
    this.value.set(value);
    this.close();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = event.target as Node;
    if (!this._elementRef.nativeElement.contains(target)) {
      this.close();
    }
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isOpen()) {
        this.open();
      } else {
        this._focusNext();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.isOpen()) {
        this._focusPrev();
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.isOpen()) {
        this.open();
      } else {
        const idx = this._focusedIndex;
        const opt = this.options()[idx];
        if (opt) this.selectOption(opt.value);
      }
    } else if (event.key === 'Escape') {
      this.close();
    } else if (event.key === 'Tab') {
      if (this.isOpen()) this.close();
    }
  }

  protected onOptionKeydown(event: KeyboardEvent, value: string): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this._focusNext();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this._focusPrev();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectOption(value);
    } else if (event.key === 'Escape') {
      this.close();
    } else if (event.key === 'Tab') {
      this.selectOption(value);
    }
  }

  private _focusNext(): void {
    this._focusedIndex = Math.min(this._focusedIndex + 1, this.options().length - 1);
    requestAnimationFrame(() => this._focusOption(this._focusedIndex));
  }

  private _focusPrev(): void {
    this._focusedIndex = Math.max(this._focusedIndex - 1, 0);
    requestAnimationFrame(() => this._focusOption(this._focusedIndex));
  }

  private _focusOption(index: number): void {
    this._optionElements()[index]?.nativeElement.focus();
  }
}
