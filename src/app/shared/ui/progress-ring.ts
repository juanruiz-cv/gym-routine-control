import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-ui-progress-ring',
  standalone: true,
  template: `
    <div class="relative inline-flex items-center justify-center" [style.width.px]="size()" [style.height.px]="size()">
      <svg [attr.width]="size()" [attr.height]="size()" [attr.viewBox]="'0 0 36 36'" class="-rotate-90">
        <!-- Background circle -->
        <circle
          cx="18" cy="18" r="15.915"
          fill="none"
          [attr.stroke]="trackColor()"
          stroke-width="3"
        />
        <!-- Progress circle -->
        <circle
          cx="18" cy="18" r="15.915"
          fill="none"
          [attr.stroke]="strokeColor()"
          stroke-width="3"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circumference()"
          [attr.stroke-dashoffset]="offset()"
          class="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      @if (showLabel()) {
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="font-bold" [class]="labelClasses()">{{ displayValue() }}</span>
        </div>
      }
    </div>
  `,
})
export class UiProgressRing {
  readonly value = input(0);
  readonly max = input(100);
  readonly size = input(64);
  readonly strokeColor = input('#f97316');
  readonly trackColor = input('rgba(255,255,255,0.1)');
  readonly showLabel = input(true);
  readonly labelFormat = input<'percent' | 'number' | 'custom'>('percent');
  readonly customLabel = input('');

  protected readonly circumference = computed(() => 2 * Math.PI * 15.915);
  protected readonly normalized = computed(() => Math.min(1, Math.max(0, this.value() / this.max())));
  protected readonly offset = computed(() => this.circumference() * (1 - this.normalized()));

  protected readonly displayValue = computed(() => {
    if (this.labelFormat() === 'custom') return this.customLabel();
    if (this.labelFormat() === 'number') return `${Math.round(this.value())}`;
    return `${Math.round(this.normalized() * 100)}%`;
  });

  protected readonly labelClasses = computed(() => {
    const sizes: Record<number, string> = {
      48: 'text-xs',
      64: 'text-sm',
      80: 'text-base',
      96: 'text-lg',
      128: 'text-2xl',
    };
    return sizes[this.size()] ?? 'text-sm';
  });
}
