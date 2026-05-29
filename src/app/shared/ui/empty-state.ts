import { Component, input } from '@angular/core';
import { LucideInbox } from '@lucide/angular';

@Component({
  selector: 'app-ui-empty-state',
  standalone: true,
  imports: [LucideInbox],
  template: `
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <div class="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
        <svg lucideInbox class="w-7 h-7 text-on-surface-muted" strokeWidth="1.5"></svg>
      </div>
      <h3 class="text-base font-semibold text-on-surface mb-1">{{ title() }}</h3>
      @if (message()) { <p class="text-sm text-on-surface-muted max-w-xs">{{ message() }}</p> }
      <div class="mt-4"><ng-content /></div>
    </div>
  `,
})
export class UiEmptyState {
  readonly title = input('Nothing here yet');
  readonly message = input('');
}
