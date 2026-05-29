import { Component, input } from '@angular/core';

@Component({
  selector: 'app-ui-skeleton-list-item',
  standalone: true,
  template: `
    <div class="animate-pulse-soft bg-white/10 rounded-2xl p-4 flex items-center gap-3" [style.min-height]="height()">
      <div class="w-10 h-10 rounded-xl bg-white/10 shrink-0"></div>
      <div class="flex-1 space-y-2">
        <div class="h-4 w-3/5 rounded bg-white/10"></div>
        <div class="h-3 w-2/5 rounded bg-white/10"></div>
      </div>
    </div>
  `,
})
export class UiSkeletonListItem {
  readonly height = input('72px');
}
