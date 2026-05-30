import { Component } from '@angular/core';

@Component({
  selector: 'app-ui-skeleton-stats-grid',
  standalone: true,
  template: `
    <div class="grid grid-cols-2 gap-4">
      @for (i of [1,2,3,4]; track i) {
        <div class="animate-pulse-soft bg-skeleton/10 rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-4 h-4 rounded bg-skeleton/10"></div>
            <div class="h-3 w-16 rounded bg-skeleton/10"></div>
          </div>
          <div class="h-7 w-20 rounded bg-skeleton/10 mb-2"></div>
          <div class="h-3 w-24 rounded bg-skeleton/10"></div>
        </div>
      }
    </div>
  `,
})
export class UiSkeletonStatsGrid {}
