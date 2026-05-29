import { Component, input, computed, inject, contentChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButton } from '@shared/ui/button';
import { I18nService } from '@shared/i18n/i18n.service';
import {
  LucideInbox, LucideDumbbell, LucideClipboardList, LucideTrophy,
  LucideActivity, LucideSearch, LucideAlertCircle,
} from '@lucide/angular';

export interface EmptyStateAction {
  label: string;
  routerLink?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export type EmptyStateVariant = 'default' | 'exercise' | 'routine' | 'metrics' | 'workout' | 'search' | 'error';

const VARIANT_ICONS: Record<EmptyStateVariant, unknown> = {
  default: LucideInbox,
  exercise: LucideDumbbell,
  routine: LucideClipboardList,
  metrics: LucideTrophy,
  workout: LucideActivity,
  search: LucideSearch,
  error: LucideAlertCircle,
};

@Component({
  selector: 'app-ui-empty-state',
  standalone: true,
  imports: [
    RouterLink, UiButton,
    LucideInbox, LucideDumbbell, LucideClipboardList, LucideTrophy,
    LucideActivity, LucideSearch, LucideAlertCircle,
  ],
  template: `
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <div class="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
        @switch (variant()) {
          @case ('exercise') {
            <svg lucideDumbbell class="w-7 h-7 text-on-surface-muted" strokeWidth="1.5"></svg>
          }
          @case ('routine') {
            <svg lucideClipboardList class="w-7 h-7 text-on-surface-muted" strokeWidth="1.5"></svg>
          }
          @case ('metrics') {
            <svg lucideTrophy class="w-7 h-7 text-on-surface-muted" strokeWidth="1.5"></svg>
          }
          @case ('workout') {
            <svg lucideActivity class="w-7 h-7 text-on-surface-muted" strokeWidth="1.5"></svg>
          }
          @case ('search') {
            <svg lucideSearch class="w-7 h-7 text-on-surface-muted" strokeWidth="1.5"></svg>
          }
          @case ('error') {
            <svg lucideAlertCircle class="w-7 h-7 text-error" strokeWidth="1.5"></svg>
          }
          @default {
            <svg lucideInbox class="w-7 h-7 text-on-surface-muted" strokeWidth="1.5"></svg>
          }
        }
      </div>
      <h3 class="text-base font-semibold text-on-surface mb-1">{{ resolvedTitle() }}</h3>
      @if (message()) {
        <p class="text-sm text-on-surface-muted max-w-xs">{{ message() }}</p>
      }
      @if (primaryAction(); as action) {
        <div class="mt-4 flex flex-col sm:flex-row items-center gap-3">
          @if (action.routerLink) {
            <a ui-button [variant]="action.variant ?? 'primary'" size="md" [routerLink]="action.routerLink">{{ action.label }}</a>
          } @else {
            <button ui-button [variant]="action.variant ?? 'primary'" size="md" (click)="action.onClick">{{ action.label }}</button>
          }
          @if (secondaryAction(); as secondary) {
            @if (secondary.routerLink) {
              <a ui-button [variant]="secondary.variant ?? 'secondary'" size="md" [routerLink]="secondary.routerLink">{{ secondary.label }}</a>
            } @else {
              <button ui-button [variant]="secondary.variant ?? 'secondary'" size="md" (click)="secondary.onClick">{{ secondary.label }}</button>
            }
          }
        </div>
      } @else {
        <div class="mt-4"><ng-content /></div>
      }
    </div>
  `,
})
export class UiEmptyState {
  private readonly _i18n = inject(I18nService);

  readonly title = input('');
  readonly message = input('');
  readonly variant = input<EmptyStateVariant>('default');
  readonly primaryAction = input<EmptyStateAction | undefined>(undefined);
  readonly secondaryAction = input<EmptyStateAction | undefined>(undefined);

  protected readonly resolvedTitle = computed(() => this.title() || this._i18n.t('emptyState.default'));
}
