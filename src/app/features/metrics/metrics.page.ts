import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { UiCard } from '@shared/ui/card';
import { UiSkeletonCard, UiSkeletonStatsGrid } from '@shared/ui';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { MetricsService, type WeeklyActivity, type MuscleDistribution } from '@core/services/metrics.service';
import type { PersonalRecord } from '@shared/models';
import { RelativeDatePipe } from '@shared/pipes/relative-date';
import { LucideTrophy } from '@lucide/angular';

@Component({
  selector: 'app-metrics-page',
  standalone: true,
  imports: [
    UiCard, UiSkeletonCard, UiSkeletonStatsGrid,
    RelativeDatePipe, TranslatePipe,
    LucideTrophy,
  ],
  template: `
    <div class="p-4 flex flex-col gap-5 max-w-lg mx-auto">
      <h1 class="text-xl font-bold">{{ 'metrics.title' | translate }}</h1>

      <!-- Stats Overview -->
      @if (loading()) {
        <app-ui-skeleton-stats-grid />
      } @else if (stats(); as s) {
        <div class="grid grid-cols-2 gap-3">
          <app-ui-card variant="glass" [padding]="true">
            <div class="text-2xl font-bold text-brand">{{ s.completedWorkouts }}</div>
            <div class="text-xs text-on-surface-muted mt-1">{{ 'metrics.totalWorkouts' | translate }}</div>
          </app-ui-card>
          <app-ui-card variant="glass" [padding]="true">
            <div class="text-2xl font-bold text-orange-400">{{ s.currentStreak }}</div>
            <div class="text-xs text-on-surface-muted mt-1">{{ 'metrics.dayStreak' | translate }}</div>
          </app-ui-card>
          <app-ui-card variant="glass" [padding]="true">
            <div class="text-2xl font-bold text-info">{{ formatVolume(s.totalVolume) }}</div>
            <div class="text-xs text-on-surface-muted mt-1">{{ 'metrics.totalVolume' | translate }}</div>
          </app-ui-card>
          <app-ui-card variant="glass" [padding]="true">
            <div class="text-2xl font-bold text-success">{{ s.totalTimeMinutes }}m</div>
            <div class="text-xs text-on-surface-muted mt-1">{{ 'metrics.totalTime' | translate }}</div>
          </app-ui-card>
        </div>
      }

      <!-- Weekly Activity -->
      <div>
        <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">{{ 'metrics.weeklyActivity' | translate }}</h2>
        @if (loadingActivity()) {
          <app-ui-skeleton-card height="120px" />
        } @else if (weeklyActivity().length > 0) {
          <app-ui-card variant="glass">
            <div class="flex items-end gap-1.5 h-28">
              @for (week of weeklyActivity(); track week.week) {
                <div class="flex-1 flex flex-col items-center gap-1">
                  <div
                    class="w-full rounded-t-md transition-all duration-300"
                    [style.height.%]="barHeight(week.sessions)"
                    [class.bg-brand]="$last"
                    [class.bg-white/20]="!$last"
                  ></div>
                  <span class="text-[10px] text-on-surface-muted truncate w-full text-center">{{ week.week }}</span>
                </div>
              }
            </div>
          </app-ui-card>
        } @else {
          <app-ui-card variant="glass">
            <p class="text-sm text-on-surface-muted text-center py-6">{{ 'metrics.noActivity' | translate }}</p>
          </app-ui-card>
        }
      </div>

      <!-- Muscle Distribution -->
      <div>
        <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">{{ 'metrics.muscleDistribution' | translate }}</h2>
        @if (loadingMuscles()) {
          <app-ui-skeleton-card height="160px" />
        } @else if (muscleDistribution().length > 0) {
          <app-ui-card variant="glass">
            <div class="space-y-3">
              @for (m of muscleDistribution(); track m.muscle) {
                <div>
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span class="text-on-surface">{{ m.muscle }}</span>
                    <span class="text-on-surface-muted">{{ m.percentage }}%</span>
                  </div>
                  <div class="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      [style.width.%]="m.percentage"
                      [class.bg-brand]="$index === 0"
                      [class.bg-brand/80]="$index === 1"
                      [class.bg-brand/60]="$index === 2"
                      [class.bg-white/20]="$index > 2"
                    ></div>
                  </div>
                </div>
              }
            </div>
          </app-ui-card>
        } @else {
          <app-ui-card variant="glass">
            <p class="text-sm text-on-surface-muted text-center py-6">{{ 'metrics.noMuscleData' | translate }}</p>
          </app-ui-card>
        }
      </div>

      <!-- Personal Records -->
      <div>
        <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">{{ 'metrics.personalRecords' | translate }}</h2>
        @if (loadingPRs()) {
          <app-ui-skeleton-card height="120px" />
        } @else if (personalRecords().length > 0) {
          <div class="flex flex-col gap-2">
            @for (pr of personalRecords(); track pr.id) {
              <app-ui-card variant="glass" [padding]="true">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                    <svg lucideTrophy class="w-5 h-5 text-warning" strokeWidth="1.5"></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ pr.exercise?.name ?? ('metrics.exercise' | translate) }}</p>
                    <div class="flex items-center gap-2 text-xs text-on-surface-muted">
                      <span>{{ pr.weight }} kg × {{ pr.reps }} reps</span>
                      @if (pr.estimated_one_rm) {
                        <span>· e1RM: {{ pr.estimated_one_rm }} kg</span>
                      }
                    </div>
                  </div>
                  <span class="text-xs text-on-surface-muted shrink-0">{{ pr.achieved_at | relativeDate }}</span>
                </div>
              </app-ui-card>
            }
          </div>
        } @else {
          <app-ui-card variant="glass">
            <div class="text-center py-6">
              <svg lucideTrophy class="w-10 h-10 text-on-surface-muted mx-auto mb-2" strokeWidth="1.5"></svg>
              <p class="text-sm text-on-surface-muted">{{ 'metrics.noRecords' | translate }}</p>
              <p class="text-xs text-on-surface-muted mt-1">{{ 'metrics.noRecordsDesc' | translate }}</p>
            </div>
          </app-ui-card>
        }
      </div>
    </div>
  `,
})
export class MetricsPage implements OnInit {
  private readonly _metrics = inject(MetricsService);

  readonly stats = this._metrics.stats;
  readonly loading = this._metrics.loading;

  readonly loadingActivity = signal(true);
  readonly loadingMuscles = signal(true);
  readonly loadingPRs = signal(true);

  readonly weeklyActivity = signal<WeeklyActivity[]>([]);
  readonly muscleDistribution = signal<MuscleDistribution[]>([]);
  readonly personalRecords = signal<PersonalRecord[]>([]);

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this._metrics.getDashboardStats(),
      this._loadActivity(),
      this._loadMuscles(),
      this._loadPRs(),
    ]);
  }

  private async _loadActivity(): Promise<void> {
    try {
      const data = await this._metrics.getWeeklyActivity(12);
      this.weeklyActivity.set(data);
    } catch {
      this.weeklyActivity.set([]);
    } finally {
      this.loadingActivity.set(false);
    }
  }

  private async _loadMuscles(): Promise<void> {
    try {
      const data = await this._metrics.getMuscleDistribution();
      this.muscleDistribution.set(data);
    } catch {
      this.muscleDistribution.set([]);
    } finally {
      this.loadingMuscles.set(false);
    }
  }

  private async _loadPRs(): Promise<void> {
    try {
      const data = await this._metrics.getPersonalRecords();
      this.personalRecords.set(data);
    } catch {
      this.personalRecords.set([]);
    } finally {
      this.loadingPRs.set(false);
    }
  }

  readonly maxActivity = computed(() => {
    const data = this.weeklyActivity();
    return Math.max(...data.map(w => w.sessions), 1);
  });

  barHeight(sessions: number): number {
    return (sessions / this.maxActivity()) * 100;
  }

  formatVolume(kg: number): string {
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`;
    return kg.toLocaleString();
  }
}
