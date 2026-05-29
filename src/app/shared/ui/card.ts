import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-ui-card',
  standalone: true,
  template: `
    <div [class]="classes()">
      @if (title() || subtitle()) {
        <div class="flex flex-col gap-0.5 mb-3">
          @if (title()) {
            <h3 class="text-base font-semibold text-on-surface">{{ title() }}</h3>
          }
          @if (subtitle()) {
            <p class="text-sm text-on-surface-muted">{{ subtitle() }}</p>
          }
        </div>
      }
      <ng-content />
    </div>
  `,
})
export class UiCard {
  readonly variant = input<'default' | 'glass' | 'elevated'>('default');
  readonly title = input('');
  readonly subtitle = input('');
  readonly padding = input(true);

  protected readonly classes = computed(() => {
    const base = ['rounded-2xl transition-colors duration-200'];

    const variants = {
      default: 'bg-surface-card',
      glass: 'glass',
      elevated: 'bg-surface-elevated',
    };

    return [...base, variants[this.variant()], this.padding() ? 'p-4' : '']
      .filter(Boolean)
      .join(' ');
  });
}
