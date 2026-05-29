import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiSkeleton } from '@shared/ui/skeleton';
import { UiBadge } from '@shared/ui/badge';
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
    UiCard, UiButton, UiSkeleton, UiBadge,
    DurationPipe, RelativeDatePipe,
    LucideDumbbell, LucideFlame, LucideCalendar, LucideArrowRight,
    LucideTrendingUp, LucidePlay, LucideClock, LucideListOrdered,
  ],
  template: `
    <div class="p-4 space-y-5 max-w-lg mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold">Dashboard</h1>
          <p class="text-sm text-on-surface-muted">{{ greeting() }}</p>
        </div>
      </div>

      <!-- Stats Grid -->
      @if (loading()) {
        <div class="grid grid-cols-2 gap-3">
          @for (item of [1,2,3,4]; track item) {
            <app-ui-card variant="glass" [padding]="true">
              <app-ui-skeleton variant="text" width="60%" height="16px" class="mb-2" />
              <app-ui-skeleton variant="rectangular" width="40%" height="32px" />
            </app-ui-card>
          }
        </div>
      } @else if (stats(); as s) {
        <div class="grid grid-cols-2 gap-3">
          <app-ui-card variant="glass" [padding]="true">
            <div class="flex items-center gap-2 text-brand mb-1">
              <svg lucideDumbbell class="w-4 h-4" strokeWidth="2"></svg>
              <span class="text-xs font-medium text-on-surface-muted">Workouts</span>
            </div>
            <p class="text-2xl font-bold">{{ s.completedWorkouts }}</p>
            <p class="text-xs text-on-surface-muted mt-0.5">Total completed</p>
          </app-ui-card>

          <app-ui-card variant="glass" [padding]="true">
            <div class="flex items-center gap-2 text-orange-400 mb-1">
              <svg lucideFlame class="w-4 h-4" strokeWidth="2"></svg>
              <span class="text-xs font-medium text-on-surface-muted">Streak</span>
            </div>
            <p class="text-2xl font-bold">{{ s.currentStreak }}</p>
            <p class="text-xs text-on-surface-muted mt-0.5">Days in a row</p>
          </app-ui-card>

          <app-ui-card variant="glass" [padding]="true">
            <div class="flex items-center gap-2 text-info mb-1">
              <svg lucideTrendingUp class="w-4 h-4" strokeWidth="2"></svg>
              <span class="text-xs font-medium text-on-surface-muted">Volume</span>
            </div>
            <p class="text-2xl font-bold">{{ formatVolume(s.totalVolume) }}</p>
            <p class="text-xs text-on-surface-muted mt-0.5">Total kg lifted</p>
          </app-ui-card>

          <app-ui-card variant="glass" [padding]="true">
            <div class="flex items-center gap-2 text-success mb-1">
              <svg lucideCalendar class="w-4 h-4" strokeWidth="2"></svg>
              <span class="text-xs font-medium text-on-surface-muted">This Week</span>
            </div>
            <p class="text-2xl font-bold">{{ s.weeklyWorkouts }}</p>
            <p class="text-xs text-on-surface-muted mt-0.5">Workouts</p>
          </app-ui-card>
        </div>
      }

      <!-- Quick Actions -->
      <div>
        <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">Quick Actions</h2>
        <div class="grid grid-cols-3 gap-3">
          <a ui-button variant="secondary" size="sm" class="flex-col gap-2 h-auto py-4" routerLink="/workout">
            <svg lucidePlay class="w-6 h-6" strokeWidth="1.5"></svg>
            <span class="text-xs">Start Workout</span>
          </a>
          <a ui-button variant="secondary" size="sm" class="flex-col gap-2 h-auto py-4" routerLink="/routines">
            <svg lucideListOrdered class="w-6 h-6" strokeWidth="1.5"></svg>
            <span class="text-xs">Routines</span>
          </a>
          <a ui-button variant="secondary" size="sm" class="flex-col gap-2 h-auto py-4" routerLink="/exercises">
            <svg lucideDumbbell class="w-6 h-6" strokeWidth="1.5"></svg>
            <span class="text-xs">Exercises</span>
          </a>
        </div>
      </div>

      <!-- Recent Activity -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-on-surface-secondary">Recent Activity</h2>
          <a routerLink="/workout" class="text-xs text-brand font-medium flex items-center gap-1">
            View all <svg lucideArrowRight class="w-3 h-3" strokeWidth="2"></svg>
          </a>
        </div>

        @if (loadingSessions()) {
          <div class="space-y-2">
            @for (item of [1,2,3]; track item) {
              <app-ui-skeleton variant="card" height="56px" />
            }
          </div>
        } @else if (recentSessions().length === 0) {
          <app-ui-card variant="glass">
            <div class="text-center py-6">
              <svg lucideDumbbell class="w-10 h-10 text-on-surface-muted mx-auto mb-2" strokeWidth="1.5"></svg>
              <p class="text-sm text-on-surface-muted">No workouts yet</p>
              <a ui-button variant="primary" size="sm" class="mt-3" routerLink="/workout">
                Start your first workout
              </a>
            </div>
          </app-ui-card>
        } @else {
          <div class="space-y-2">
            @for (session of recentSessions(); track session.id) {
              <app-ui-card variant="glass" [padding]="true">
                <a routerLink="/workout/{{ session.id }}" class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                    <svg lucideDumbbell class="w-5 h-5 text-brand" strokeWidth="1.5"></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ session.routine?.name ?? 'Workout' }}</p>
                    <div class="flex items-center gap-2 text-xs text-on-surface-muted">
                      <span>{{ session.completed_at | relativeDate }}</span>
                      @if (session.duration) {
                        <span>·</span>
                        <span class="flex items-center gap-1">
                          <svg lucideClock class="w-3 h-3" strokeWidth="2"></svg>
                          {{ session.duration | duration }}
                        </span>
                      }
                    </div>
                  </div>
                  <app-ui-badge variant="success" size="sm">Done</app-ui-badge>
                </a>
              </app-ui-card>
            }
          </div>
        }
      </div>

      <!-- Volume Chart -->
      @if (volumeData().length > 0) {
        <div>
          <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">Volume Trend</h2>
          <app-ui-card variant="glass">
            <div class="flex items-end gap-1.5 h-32">
              @for (point of volumeData(); track point.date) {
                <div class="flex-1 flex flex-col items-center gap-1">
                  <div
                    class="w-full rounded-t-md transition-all duration-300"
                    [style.height.%]="point.volume / maxVolume() * 100"
                    [class.bg-brand]="isCurrentWeek(point.date)"
                    [class.bg-white/20]="!isCurrentWeek(point.date)"
                  ></div>
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
  `,
})
export class DashboardPage implements OnInit {
  private readonly _metrics = inject(MetricsService);
  private readonly _workout = inject(WorkoutService);

  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
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
