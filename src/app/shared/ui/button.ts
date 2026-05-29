import { Component, input, computed, output } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[ui-button], a[ui-button]',
  standalone: true,
  host: {
    '[class]': 'classes()',
    '[attr.disabled]': 'disabled() ? true : null',
    '(click)': 'onClick()',
  },
  template: `<ng-content />`,
})
export class UiButton {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly disabled = input(false);
  readonly full = input(false);
  readonly clicked = output<void>();

  protected readonly classes = computed(() => {
    const base = [
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ];
    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-brand text-white hover:bg-brand-dark active:scale-[0.98]',
      secondary: 'bg-surface-elevated text-on-surface hover:bg-surface-hover border border-white/10',
      ghost: 'text-on-surface-muted hover:text-on-surface hover:bg-surface-hover',
      danger: 'bg-error/10 text-error hover:bg-error/20',
    };
    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3.5 text-base gap-2.5',
    };
    return [...base, variants[this.variant()], sizes[this.size()], this.full() ? 'w-full' : ''].filter(Boolean).join(' ');
  });

  protected onClick(): void { if (!this.disabled()) this.clicked.emit(); }
}
