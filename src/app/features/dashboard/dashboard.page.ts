import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiSkeletonStatsGrid, UiSkeletonListItem } from '@shared/ui';
import { UiBadge } from '@shared/ui/badge';
import { UiEmptyState } from '@shared/ui/empty-state';
import { I18nService } from '@shared/i18n/i18n.service';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { MetricsService, type VolumeDataPoint } from '@core/services/metrics.service';
import { WorkoutService } from '@core/services/workout.service';
import { DurationPipe } from '@shared/pipes/duration';
import { RelativeDatePipe } from '@shared/pipes/relative-date';
import { LucideDumbbell, LucideFlame, LucideCalendar, LucideArrowRight, LucideTrendingUp, LucidePlay, LucideClock, LucideListOrdered } from '@lucide/angular';
import type { WorkoutSession } from '@shared/models';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink, SlicePipe,
    UiCard, UiButton, UiSkeletonStatsGrid, UiSkeletonListItem, UiBadge, UiEmptyState,
    DurationPipe, RelativeDatePipe, TranslatePipe,
    LucideDumbbell, LucideFlame, LucideCalendar, LucideArrowRight,
    LucideTrendingUp, LucidePlay, LucideClock, LucideListOrdered,
  ],
  template: `
    <div class="p-4 flex flex-col gap-6 max-w-lg mx-auto md:max-w-4xl lg:max-w-none lg:mx-0 lg:px-6 lg:gap-8">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold">{{ 'dashboard.title' | translate }}</h1>
          <p class="text-sm text-on-surface-muted">{{ greeting() }}</p>
        </div>
      </div>

      <!-- Stats Grid -->
      @if (loading()) {
        <app-ui-skeleton-stats-grid />
      } @else if (stats(); as s) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <app-ui-card variant="glass" [padding]="true">
            <div class="flex items-center gap-2 text-brand mb-1">
              <svg lucideDumbbell class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
              <span class="text-xs font-medium text-on-surface-muted">{{ 'dashboard.workouts' | translate }}</span>
            </div>
            <p class="text-2xl font-bold">{{ s.completedWorkouts }}</p>
            <p class="text-xs text-on-surface-muted mt-0.5">{{ 'dashboard.totalCompleted' | translate }}</p>
          </app-ui-card>

          <app-ui-card variant="glass" [padding]="true">
            <div class="flex items-center gap-2 text-orange-400 mb-1">
              <svg lucideFlame class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
              <span class="text-xs font-medium text-on-surface-muted">{{ 'dashboard.streak' | translate }}</span>
            </div>
            <p class="text-2xl font-bold">{{ s.currentStreak }}</p>
            <p class="text-xs text-on-surface-muted mt-0.5">{{ 'dashboard.streakDesc' | translate }}</p>
          </app-ui-card>

          <app-ui-card variant="glass" [padding]="true">
            <div class="flex items-center gap-2 text-info mb-1">
              <svg lucideTrendingUp class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
              <span class="text-xs font-medium text-on-surface-muted">{{ 'dashboard.volume' | translate }}</span>
            </div>
            <p class="text-2xl font-bold">{{ formatVolume(s.totalVolume) }}</p>
            <p class="text-xs text-on-surface-muted mt-0.5">{{ 'dashboard.volumeDesc' | translate }}</p>
          </app-ui-card>

          <app-ui-card variant="glass" [padding]="true">
            <div class="flex items-center gap-2 text-success mb-1">
              <svg lucideCalendar class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
              <span class="text-xs font-medium text-on-surface-muted">{{ 'dashboard.thisWeek' | translate }}</span>
            </div>
            <p class="text-2xl font-bold">{{ s.weeklyWorkouts }}</p>
            <p class="text-xs text-on-surface-muted mt-0.5">{{ 'dashboard.thisWeekDesc' | translate }}</p>
          </app-ui-card>
        </div>
      }

      <!-- Desktop: 3-column layout -->
      <div class="lg:flex lg:gap-6 lg:items-start">
        <!-- Quick Actions -->
        <div class="lg:w-52 lg:shrink-0 mt-6 lg:mt-0">
          <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">{{ 'dashboard.quickActions' | translate }}</h2>
          <div class="grid grid-cols-3 gap-3 lg:flex lg:flex-col lg:gap-3">
            <a ui-button variant="secondary" size="sm"
              class="flex-col gap-2 h-auto py-4 lg:flex-row lg:justify-start lg:gap-3 lg:py-4 lg:px-4 lg:h-auto w-full"
              routerLink="/workout">
              <svg lucidePlay class="w-5 h-5 lg:w-6 lg:h-6" strokeWidth="1.5" aria-hidden="true"></svg>
              <span class="text-xs lg:text-sm">{{ 'dashboard.startWorkout' | translate }}</span>
            </a>
            <a ui-button variant="secondary" size="sm"
              class="flex-col gap-2 h-auto py-4 lg:flex-row lg:justify-start lg:gap-3 lg:py-4 lg:px-4 lg:h-auto w-full"
              routerLink="/routines">
              <svg lucideListOrdered class="w-5 h-5 lg:w-6 lg:h-6" strokeWidth="1.5" aria-hidden="true"></svg>
              <span class="text-xs lg:text-sm">{{ 'nav.routines' | translate }}</span>
            </a>
            <a ui-button variant="secondary" size="sm"
              class="flex-col gap-2 h-auto py-4 lg:flex-row lg:justify-start lg:gap-3 lg:py-4 lg:px-4 lg:h-auto w-full"
              routerLink="/exercises">
              <svg lucideDumbbell class="w-5 h-5 lg:w-6 lg:h-6" strokeWidth="1.5" aria-hidden="true"></svg>
              <span class="text-xs lg:text-sm">{{ 'nav.exercises' | translate }}</span>
            </a>
          </div>
        </div>

        <!-- Volume Chart -->
        <div class="flex-1 min-w-0 mt-6 lg:mt-0">
          @if (volumeData().length > 0) {
            <div>
              <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">{{ 'dashboard.volumeTrend' | translate }}</h2>
              <app-ui-card variant="glass">
                <div class="flex items-end gap-2 h-32 lg:h-48">
                  @for (point of volumeData(); track point.date) {
                    <div class="flex-1 flex flex-col items-center gap-1.5">
                      <div class="flex-1 w-full flex items-end">
                        <div
                          class="w-full rounded-t-md transition-all duration-500 group relative"
                          [style.height.%]="point.volume / maxVolume() * 100"
                          [class.bg-gradient-to-t]="isCurrentWeek(point.date)"
                          [class.from-brand]="isCurrentWeek(point.date)"
                          [class.to-brand/60]="isCurrentWeek(point.date)"
                          [class.bg-white/15]="!isCurrentWeek(point.date)"
                        >
                          <span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-on-surface opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {{ formatVolume(point.volume) }}
                          </span>
                        </div>
                      </div>
                      <span class="text-[10px] text-on-surface-muted truncate w-full text-center">
                        {{ point.date | slice:5:10 }}
                      </span>
                    </div>
                  }
                </div>
              </app-ui-card>
            </div>
          }
        </div>

        <!-- Recent Activity -->
        <div class="lg:w-72 lg:shrink-0 mt-6 lg:mt-0">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-on-surface-secondary">{{ 'dashboard.recentActivity' | translate }}</h2>
            <a routerLink="/workout" class="text-xs text-brand font-medium flex items-center gap-1">
              {{ 'dashboard.viewAll' | translate }} <svg lucideArrowRight class="w-3 h-3" strokeWidth="2" aria-hidden="true"></svg>
            </a>
          </div>

          @if (loadingSessions()) {
            <div class="flex flex-col gap-3">
              @for (item of [1,2,3]; track item) {
                <app-ui-skeleton-list-item height="72px" />
              }
            </div>
          } @else if (recentSessions().length === 0) {
            <app-ui-empty-state
              variant="workout"
              title="{{ 'dashboard.noWorkouts' | translate }}"
              [primaryAction]="{ label: ('dashboard.startFirst' | translate), routerLink: '/workout', variant: 'primary' }"
            />
          } @else {
            <div class="flex flex-col gap-3">
              @for (session of recentSessions(); track session.id) {
                <app-ui-card variant="glass" [padding]="true">
                  <a routerLink="/workout/{{ session.id }}" class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                      <svg lucideDumbbell class="w-5 h-5 text-brand" strokeWidth="1.5" aria-hidden="true"></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium truncate">{{ session.routine?.name ?? ('dashboard.workout' | translate) }}</p>
                      <div class="flex items-center gap-2 text-xs text-on-surface-muted">
                        <span>{{ session.completed_at | relativeDate }}</span>
                        @if (session.duration) {
                          <span>·</span>
                          <span class="flex items-center gap-1">
                            <svg lucideClock class="w-3 h-3" strokeWidth="2" aria-hidden="true"></svg>
                            {{ session.duration | duration }}
                          </span>
                        }
                      </div>
                    </div>
                    <app-ui-badge variant="success" size="sm">{{ 'dashboard.done' | translate }}</app-ui-badge>
                  </a>
                </app-ui-card>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DashboardPage implements OnInit {
  private readonly _metrics = inject(MetricsService);
  private readonly _workout = inject(WorkoutService);
  private readonly _i18n = inject(I18nService);

  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return this._i18n.t('dashboard.greetingMorning');
    if (h < 18) return this._i18n.t('dashboard.greetingAfternoon');
    return this._i18n.t('dashboard.greetingEvening');
  });

  readonly stats = this._metrics.stats;
  readonly loading = this._metrics.loading;

  readonly loadingSessions = signal(true);
  readonly recentSessions = signal<WorkoutSession[]>([]);
  readonly volumeData = signal<VolumeDataPoint[]>([]);

  readonly maxVolume = computed(() => {
    const data = this.volumeData();
    return Math.max(...data.map(d => d.volume), 1);
  });

  async ngOnInit(): Promise<void> {
    await this._metrics.getDashboardStats();
    await Promise.all([this._loadRecentSessions(), this._loadVolumeData()]);
  }

  private async _loadRecentSessions(): Promise<void> {
    try {
      const sessions = await this._workout.getSessionHistory(5);
      this.recentSessions.set(sessions);
    } catch {
      this.recentSessions.set([]);
    } finally {
      this.loadingSessions.set(false);
    }
  }

  private async _loadVolumeData(): Promise<void> {
    try {
      const data = await this._metrics.getVolumeHistory(8);
      this.volumeData.set(data);
    } catch {
      this.volumeData.set([]);
    }
  }

  formatVolume(kg: number): string {
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`;
    return kg.toLocaleString();
  }

  isCurrentWeek(date: string): boolean {
    const now = new Date();
    const d = new Date(date);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    return d >= start;
  }
}
