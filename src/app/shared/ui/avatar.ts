import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-ui-avatar',
  standalone: true,
  template: `
    <div [class]="classes()" [style.background]="bgColor()">
      @if (src()) {
        <img [src]="src()" [alt]="alt()" class="w-full h-full object-cover rounded-full" />
      } @else {
        <span class="font-semibold text-sm">{{ initials() }}</span>
      }
    </div>
  `,
})
export class UiAvatar {
  readonly src = input('');
  readonly alt = input('');
  readonly name = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  protected readonly initials = computed(() => {
    const n = this.name();
    if (!n) return '?';
    return n
      .split(' ')
      .map(p => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  protected readonly bgColor = computed(() => {
    const n = this.name();
    if (!n) return 'bg-surface-hover';
    const colors = [
      '#ef4444', '#3b82f6', '#22c55e', '#f59e0b',
      '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1',
    ];
    const index = n.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[index % colors.length];
  });

  protected readonly classes = computed(() => {
    const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };
    return `inline-flex items-center justify-center rounded-full text-white shrink-0 ${sizes[this.size()]}`;
  });
}
