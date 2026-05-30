import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-ui-skeleton-card',
  standalone: true,
  template: `
    <div [class]="classes()" [style.min-height]="height()" [style.width]="width()">
      <ng-content />
    </div>
  `,
})
export class UiSkeletonCard {
  readonly height = input<string>('auto');
  readonly width = input<string>('100%');
  readonly padding = input(true);
  readonly rounded = input(true);

  protected readonly classes = computed(() => {
    const base = ['animate-pulse-soft', 'bg-skeleton/10'];
    if (this.rounded()) base.push('rounded-2xl');
    if (this.padding()) base.push('p-4');
    return base.join(' ');
  });
}
