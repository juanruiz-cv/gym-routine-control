import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { UiCard } from '@shared/ui/card';
import { UiSkeletonCard, UiSkeletonStatsGrid } from '@shared/ui';
import { UiEmptyState } from '@shared/ui/empty-state';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { MetricsService, type WeeklyActivity, type MuscleDistribution } from '@core/services/metrics.service';
import type { PersonalRecord } from '@shared/models';
import { RelativeDatePipe } from '@shared/pipes/relative-date';
import { MuscleMapComponent } from '@shared/components/muscle-map/muscle-map.component';
import { MUSCLE_GROUP_TO_ANATOMY } from '@shared/models/muscle-anatomy';
import { LucideTrophy } from '@lucide/angular';

@Component({
  selector: 'app-metrics-page',
  standalone: true,
  imports: [
    UiCard, UiSkeletonCard, UiSkeletonStatsGrid, UiEmptyState,
    RelativeDatePipe, TranslatePipe, MuscleMapComponent,
    LucideTrophy,
  ],
  template: `
    <div class="p-4 flex flex-col gap-5 max-w-lg mx-auto md:max-w-4xl lg:max-w-none lg:mx-0 lg:px-6 lg:gap-6">
      <h1 class="text-xl font-bold">{{ 'metrics.title' | translate }}</h1>

      <!-- Stats Overview -->
      @if (loading()) {
        <app-ui-skeleton-stats-grid />
      } @else if (stats(); as s) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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

      <!-- Charts Row -->
      <div class="lg:flex lg:gap-6">
        <!-- Weekly Activity -->
        <div class="lg:flex-1">
          <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">{{ 'metrics.weeklyActivity' | translate }}</h2>
          @if (loadingActivity()) {
            <app-ui-skeleton-card height="120px" />
          } @else if (weeklyActivity().length > 0) {
            <app-ui-card variant="glass">
              <div class="flex items-end gap-2 h-32 lg:h-40">
                @for (week of weeklyActivity(); track week.week) {
                  <div class="flex-1 flex flex-col items-center gap-1.5">
                    <div class="flex-1 w-full flex items-end">
                      <div
                        class="w-full rounded-t-md transition-all duration-500 group relative"
                        [style.height.%]="barHeight(week.sessions)"
                        [class.bg-gradient-to-t]="$last"
                        [class.from-brand]="$last"
                        [class.to-brand/60]="$last"
                        [class.bg-white/15]="!$last"
                      >
                        <span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-on-surface opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {{ week.sessions }} sesiones
                        </span>
                      </div>
                    </div>
                    <span class="text-[10px] text-on-surface-muted truncate w-full text-center">{{ week.week }}</span>
                  </div>
                }
              </div>
            </app-ui-card>
          } @else {
            <app-ui-empty-state variant="metrics" title="{{ 'metrics.noActivity' | translate }}" />
          }
        </div>

        <!-- Muscle Distribution -->
        <div class="mt-5 lg:mt-0 lg:flex-1">
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
            <app-ui-empty-state variant="metrics" title="{{ 'metrics.noMuscleData' | translate }}" />
          }
        </div>
      </div>

      <!-- Personal Records -->
      <div>
        <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">{{ 'metrics.personalRecords' | translate }}</h2>
        @if (loadingPRs()) {
          <app-ui-skeleton-card height="120px" />
        } @else if (personalRecords().length > 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            @for (pr of personalRecords(); track pr.id) {
              <app-ui-card variant="glass" [padding]="true">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                    <svg lucideTrophy class="w-5 h-5 text-warning" strokeWidth="1.5" aria-hidden="true"></svg>
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
          <app-ui-empty-state variant="metrics" title="{{ 'metrics.noRecords' | translate }}" message="{{ 'metrics.noRecordsDesc' | translate }}" />
        }
      </div>

      <!-- Muscle Heatmap -->
      <div>
        <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">{{ 'metrics.muscleHeatmap' | translate }}</h2>
        @if (loadingMuscles()) {
          <app-ui-skeleton-card height="300px" />
        } @else if (muscleDistribution().length > 0) {
          <app-ui-card variant="glass">
            <div class="py-2">
              <app-muscle-map
                [mode]="'heatmap'"
                [heatmapData]="heatmapData()"
              />
            </div>
          </app-ui-card>
        } @else {
          <app-ui-empty-state variant="metrics" title="{{ 'metrics.noMuscleData' | translate }}" />
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

  readonly heatmapData = computed(() => {
    const dist = this.muscleDistribution();
    const result: Record<string, number> = {};
    for (const item of dist) {
      const anatomies = MUSCLE_GROUP_TO_ANATOMY[item.muscle] ?? [];
      if (anatomies.length === 0) continue;
      const pctPerMuscle = item.percentage / anatomies.length;
      for (const a of anatomies) {
        result[a] = (result[a] ?? 0) + pctPerMuscle;
      }
    }
    return result;
  });
}
