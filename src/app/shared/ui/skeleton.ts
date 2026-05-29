import { Component, input, computed } from '@angular/core';

type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card';

@Component({
  selector: 'app-ui-skeleton',
  standalone: true,
  template: `
    <div [class]="classes()" [style.width]="width()" [style.height]="height()">
      &nbsp;
    </div>
  `,
})
export class UiSkeleton {
  readonly variant = input<SkeletonVariant>('text');
  readonly width = input('100%');
  readonly height = input('auto');
  readonly lines = input(1);
  readonly rounded = input(true);

  protected readonly classes = computed(() => {
    const base = ['animate-pulse-soft bg-white/10'];

    if (this.variant() === 'circular') {
      return [...base, 'rounded-full'].join(' ');
    }

    const roundedClass = this.rounded() ? 'rounded-xl' : '';
    const height = this.variant() === 'text' ? 'h-4' : '';

    return [...base, roundedClass, height].filter(Boolean).join(' ');
  });
}
