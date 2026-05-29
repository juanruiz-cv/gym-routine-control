import { Component, input, computed } from '@angular/core';

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'app-ui-badge',
  standalone: true,
  template: `
    <span [class]="classes()"><ng-content /></span>
  `,
})
export class UiBadge {
  readonly variant = input<BadgeVariant>('default');
  readonly size = input<BadgeSize>('sm');

  protected readonly classes = computed(() => {
    const base = [
      'inline-flex items-center font-medium rounded-lg whitespace-nowrap',
    ];

    const variants: Record<BadgeVariant, string> = {
      default: 'bg-surface-hover text-on-surface-secondary',
      brand: 'bg-brand/10 text-brand',
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      error: 'bg-error/10 text-error',
      info: 'bg-info/10 text-info',
    };

    const sizes: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return [...base, variants[this.variant()], sizes[this.size()]].join(' ');
  });
}
