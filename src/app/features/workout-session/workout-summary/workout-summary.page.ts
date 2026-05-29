import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiBadge } from '@shared/ui/badge';
import { UiSkeleton } from '@shared/ui/skeleton';
import { WorkoutService } from '@core/services/workout.service';
import { DurationPipe } from '@shared/pipes/duration';
import {
  LucideCheckCircle2, LucideDumbbell, LucideFlame, LucideClock, LucideBarChart3,
  LucideHome, LucideRotateCcw,
} from '@lucide/angular';
import type { WorkoutSession } from '@shared/models';

@Component({
  selector: 'app-workout-summary-page',
  standalone: true,
  imports: [
    RouterLink, UiCard, UiButton, UiBadge, UiSkeleton,
    DurationPipe,
    LucideCheckCircle2, LucideDumbbell, LucideFlame, LucideClock, LucideBarChart3,
    LucideHome, LucideRotateCcw,
  ],
  template: `
    <div class="p-4 space-y-4 max-w-lg mx-auto">
      @if (loading()) {
        <div class="space-y-4">
          <app-ui-skeleton variant="card" height="120px" />
          <app-ui-skeleton variant="card" height="80px" />
          <app-ui-skeleton variant="card" height="200px" />
        </div>
      }

      @if (session(); as s) {
        <!-- Completion Header -->
        <div class="text-center py-6">
          <div class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
            <svg lucideCheckCircle2 class="w-8 h-8 text-success" strokeWidth="1.5"></svg>
          </div>
          <h1 class="text-xl font-bold">Workout Complete!</h1>
          <p class="text-sm text-on-surface-muted mt-1">Great job!</p>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 gap-3">
          <app-ui-card variant="glass" [padding]="true">
            <div class="flex items-center gap-2 text-brand mb-1">
              <svg lucideDumbbell class="w-4 h-4" strokeWidth="2"></svg>
              <span class="text-xs text-on-surface-muted">Exercises</span>
            </div>
            <p class="text-xl font-bold">{{ exerciseCount() }}</p>
          </app-ui-card>

          <app-ui-card variant="glass" [padding]="true">
            <div class="flex items-center gap-2 text-info mb-1">
              <svg lucideClock class="w-4 h-4" strokeWidth="2"></svg>
              <span class="text-xs text-on-surface-muted">Duration</span>
            </div>
            <p class="text-xl font-bold">{{ s.duration | duration }}</p>
          </app-ui-card>

          <app-ui-card variant="glass" [padding]="true">
            <div class="flex items-center gap-2 text-warning mb-1">
              <svg lucideBarChart3 class="w-4 h-4" strokeWidth="2"></svg>
              <span class="text-xs text-on-surface-muted">Volume</span>
            </div>
            <p class="text-xl font-bold">{{ totalVolume() }} kg</p>
          </app-ui-card>

          <app-ui-card variant="glass" [padding]="true">
            <div class="flex items-center gap-2 text-success mb-1">
              <svg lucideFlame class="w-4 h-4" strokeWidth="2"></svg>
              <span class="text-xs text-on-surface-muted">Sets</span>
            </div>
            <p class="text-xl font-bold">{{ completedSets() }}</p>
          </app-ui-card>
        </div>

        <!-- Exercise Breakdown -->
        <div>
          <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">Exercise Breakdown</h2>
          <div class="space-y-2">
            @for (ex of exerciseBreakdown(); track ex.id) {
              <app-ui-card variant="glass" [padding]="true">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 text-sm font-bold text-brand">
                    {{ $index + 1 }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium">{{ ex.name }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-xs text-on-surface-muted">{{ ex.completed }}/{{ ex.total }} sets</span>
                      @if (ex.volume > 0) {
                        <span class="text-xs text-on-surface-muted">· {{ ex.volume }} kg</span>
                      }
                    </div>
                  </div>
                  <app-ui-badge [variant]="ex.completed === ex.total ? 'success' : 'warning'" size="sm">
                    {{ ex.completed }}/{{ ex.total }}
                  </app-ui-badge>
                </div>
              </app-ui-card>
            }
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-2">
          <a ui-button variant="secondary" size="md" class="flex-1" routerLink="/dashboard">
            <svg lucideHome class="w-4 h-4" strokeWidth="2"></svg>
            Dashboard
          </a>
          <a ui-button variant="primary" size="md" class="flex-1" routerLink="/routines">
            <svg lucideRotateCcw class="w-4 h-4" strokeWidth="2"></svg>
            New Workout
          </a>
        </div>
      }
    </div>
  `,
})
export class WorkoutSummaryPage implements OnInit {
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _workout = inject(WorkoutService);

  readonly session = signal<WorkoutSession | null>(null);
  readonly loading = signal(true);

  readonly exerciseCount = computed(() => {
    const s = this.session();
    const exIds = new Set(s?.sets?.map(se => se.routine_exercise_id) ?? []);
    return exIds.size;
  });

  readonly completedSets = computed(() => {
    return this.session()?.sets?.filter(s => s.is_completed).length ?? 0;
  });

  readonly totalVolume = computed(() => {
    return this.session()?.sets?.reduce((sum, s) => sum + ((s.weight ?? 0) * (s.reps ?? 0)), 0) ?? 0;
  });

  readonly exerciseBreakdown = computed(() => {
    const s = this.session();
    if (!s?.sets?.length || !s.routine?.routine_exercises?.length) return [];

    return s.routine.routine_exercises.map(re => {
      const sets = s.sets!.filter(se => se.routine_exercise_id === re.id);
      const completed = sets.filter(se => se.is_completed).length;
      const volume = sets.reduce((sum, se) => sum + ((se.weight ?? 0) * (se.reps ?? 0)), 0);
      return {
        id: re.id,
        name: re.exercise?.name ?? 'Unknown',
        total: sets.length,
        completed,
        volume,
      };
    }).filter(ex => ex.total > 0);
  });

  async ngOnInit(): Promise<void> {
    const sessionId = this._route.snapshot.paramMap.get('sessionId');
    if (!sessionId) {
      await this._router.navigate(['/dashboard']);
      return;
    }

    try {
      const session = await this._workout.getSessionWithSets(sessionId);
      if (session) {
        this.session.set(session);
      } else {
        await this._router.navigate(['/dashboard']);
      }
    } catch {
      await this._router.navigate(['/dashboard']);
    } finally {
      this.loading.set(false);
    }
  }
}
