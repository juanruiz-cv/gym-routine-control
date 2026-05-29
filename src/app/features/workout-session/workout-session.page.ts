import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiBadge } from '@shared/ui/badge';
import { UiSkeletonCard, UiTimer } from '@shared/ui';
import { UiModal } from '@shared/ui/modal';
import { UiEmptyState } from '@shared/ui/empty-state';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { WorkoutService } from '@core/services/workout.service';
import { NotificationService } from '@core/services/notification.service';
import {
  LucideCheck, LucideX, LucideDumbbell,
  LucideChevronLeft, LucideChevronRight, LucideTimer, LucideCheckCircle,
} from '@lucide/angular';

@Component({
  selector: 'app-workout-session-page',
  standalone: true,
  imports: [
    RouterLink, UiCard, UiButton, UiBadge, UiSkeletonCard, UiTimer, UiModal, UiEmptyState,
    TranslatePipe,
    LucideTimer, LucideCheck, LucideCheckCircle, LucideChevronLeft, LucideChevronRight,
    LucideX, LucideDumbbell,
  ],
  template: `
    <div class="flex flex-col min-h-dvh">
      @if (workout(); as w) {
        @let session = w.session;
        @let routineExs = session.routine?.routine_exercises ?? [];
        @let currentEx = routineExs[w.currentExerciseIndex];

        <!-- Header -->
        <div class="sticky top-0 z-10 bg-surface/80 backdrop-blur-xl">
          <div class="flex items-center justify-between p-4">
            <button (click)="confirmCancel.set(true)" class="p-2 rounded-xl hover:bg-surface-hover transition-colors">
              <svg lucideX class="w-5 h-5" strokeWidth="2"></svg>
            </button>
            <div class="text-center">
              <p class="text-sm font-medium">{{ session.routine?.name ?? ('workout.title' | translate) }}</p>
              <p class="text-xs text-on-surface-muted">{{ elapsedTime() }}</p>
            </div>
            <div class="w-9"></div>
          </div>

          <!-- Progress Bar -->
          <div class="h-1 bg-white/5">
            <div
              class="h-full bg-brand transition-all duration-300"
              [style.width.%]="totalProgress()"
            ></div>
          </div>
        </div>

        @if (currentEx) {
          @let exSets = currentExerciseSets();
          @let completedSets = completedExerciseSets();
          @let totalSets = totalExerciseSets();

          <!-- Current Exercise -->
          <div class="flex-1 p-4 space-y-4 max-w-lg mx-auto w-full">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-on-surface-muted">
                  {{ 'workout.exerciseOf' | translate:{ current: w.currentExerciseIndex + 1, total: routineExs.length } }}
                </span>
                <span class="text-xs text-on-surface-muted">{{ 'workout.setsProgress' | translate:{ current: completedSets, total: totalSets } }}</span>
              </div>
              <h2 class="text-xl font-bold">{{ currentEx.exercise?.name ?? ('workout.title' | translate) }}</h2>
              @if (currentEx.exercise?.muscle_group) {
                <app-ui-badge variant="brand" size="sm" class="mt-1">{{ currentEx.exercise!.muscle_group }}</app-ui-badge>
              }
            </div>

            <!-- Sets List -->
            <div class="flex flex-col gap-2">
              @for (set of exSets; track set.id; let i = $index) {
                <app-ui-card variant="glass" [padding]="true" [class.ring-1]="i === w.currentSetIndex && !set.is_completed"
                  [class.ring-brand]="i === w.currentSetIndex && !set.is_completed">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center shrink-0 text-sm font-bold text-on-surface-muted">
                      {{ set.set_number }}
                    </div>

                    <div class="flex-1 flex items-center gap-2">
                      @if (set.is_completed) {
                        <div class="flex items-center gap-3 text-sm">
                          <span class="text-on-surface font-medium">{{ set.weight ?? '—' }} kg</span>
                          <span class="text-on-surface-muted">×</span>
                          <span class="text-on-surface font-medium">{{ set.reps ?? '—' }}</span>
                          <svg lucideCheckCircle class="w-5 h-5 text-success" strokeWidth="2"></svg>
                        </div>
                      } @else {
                        <div class="flex items-center gap-2">
                          <input
                            #weightInput
                            type="number"
                            [value]="set.weight ?? ''"
                            (input)="updateWeight(set.id, +weightInput.value)"
                            class="w-20 px-3 py-2 rounded-lg bg-surface-input border border-white/10 text-sm text-center text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
                            [placeholder]="'workout.lbs' | translate"
                            step="0.5"
                            min="0"
                          />
                          <span class="text-on-surface-muted">×</span>
                          <input
                            #repsInput
                            type="number"
                            [value]="set.reps ?? ''"
                            (input)="updateReps(set.id, +repsInput.value)"
                            class="w-16 px-3 py-2 rounded-lg bg-surface-input border border-white/10 text-sm text-center text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
                            [placeholder]="'routines.reps' | translate"
                            min="1"
                          />
                          <button
                            ui-button variant="primary" size="sm"
                            [disabled]="i !== w.currentSetIndex"
                            (click)="completeSet(set.id); soundClick()"
                          >
                            <svg lucideCheck class="w-4 h-4" strokeWidth="2.5"></svg>
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                </app-ui-card>
              }
            </div>

            <!-- Rest Timer -->
            @if (completedSets > 0 && completedSets < totalSets) {
              <app-ui-card variant="glass">
                <div class="flex items-center gap-3 mb-3">
                  <svg lucideTimer class="w-5 h-5 text-brand" strokeWidth="1.5"></svg>
                  <span class="text-sm font-medium">{{ 'workout.restTimer' | translate }}</span>
                </div>
                <app-ui-timer [duration]="currentEx.rest_time || 90" />
              </app-ui-card>
            }

            <!-- Navigation -->
            <div class="flex gap-3">
              <button
                ui-button variant="secondary" size="md" class="flex-1"
                [disabled]="w.currentExerciseIndex === 0"
                (click)="prevExercise()"
              >
                <svg lucideChevronLeft class="w-4 h-4" strokeWidth="2"></svg>
                {{ 'workout.previous' | translate }}
              </button>

              @if (w.currentExerciseIndex < routineExs.length - 1) {
                <button
                  ui-button variant="primary" size="md" class="flex-1"
                  (click)="nextExercise()"
                >
                  {{ 'workout.next' | translate }}
                  <svg lucideChevronRight class="w-4 h-4" strokeWidth="2"></svg>
                </button>
              } @else {
                <button
                  ui-button variant="primary" size="md" class="flex-1"
                  (click)="finishWorkout()"
                >
                  <svg lucideCheck class="w-4 h-4" strokeWidth="2.5"></svg>
                  {{ 'workout.finish' | translate }}
                </button>
              }
            </div>
          </div>
        } @else {
          <!-- No exercises in this routine -->
          <div class="flex-1 flex items-center justify-center p-4">
            <app-ui-empty-state
              variant="workout"
              title="{{ 'workout.noExercises' | translate }}"
              [primaryAction]="{ label: ('workout.browseRoutines' | translate), routerLink: '/routines', variant: 'primary' }"
            />
          </div>
        }
      } @else {
        <!-- Loading state -->
        <div class="flex-1 flex items-center justify-center">
          <div class="flex flex-col gap-4 w-full max-w-lg mx-auto p-4">
            @for (i of [1,2,3,4]; track i) {
              <app-ui-skeleton-card height="80px" />
            }
          </div>
        </div>
      }

      <!-- Cancel Confirmation -->
      <app-ui-modal [isOpen]="confirmCancel()" [title]="'workout.cancelTitle' | translate" (closed)="confirmCancel.set(false)">
        <p class="text-sm text-on-surface-muted mb-4">
          {{ 'workout.cancelConfirm' | translate }}
        </p>
        <div class="flex gap-3">
          <button ui-button variant="ghost" size="md" class="flex-1" (click)="confirmCancel.set(false)">{{ 'workout.keepGoing' | translate }}</button>
          <button ui-button variant="danger" size="md" class="flex-1" (click)="cancelWorkout()">{{ 'workout.cancel' | translate }}</button>
        </div>
      </app-ui-modal>
    </div>
  `,
})
export class WorkoutSessionPage implements OnInit {
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _workout = inject(WorkoutService);
  private readonly _notification = inject(NotificationService);

  readonly workout = this._workout.activeWorkout;
  readonly confirmCancel = signal(false);
  private _startTime = Date.now();

  readonly totalProgress = computed(() => {
    const w = this.workout();
    if (!w?.session?.sets?.length) return 0;
    const total = w.session.sets.length;
    const completed = w.session.sets.filter(s => s.is_completed).length;
    return total > 0 ? (completed / total) * 100 : 0;
  });

  readonly elapsedTime = computed(() => {
    const elapsed = Math.floor((Date.now() - this._startTime) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  });

  readonly currentExerciseSets = computed(() => {
    const w = this.workout();
    if (!w) return [];
    const currentEx = w.session.routine?.routine_exercises?.[w.currentExerciseIndex];
    if (!currentEx) return [];
    return (w.session.sets ?? []).filter(s => s.routine_exercise_id === currentEx.id);
  });

  readonly completedExerciseSets = computed(() => {
    return this.currentExerciseSets().filter(s => s.is_completed).length;
  });

  readonly totalExerciseSets = computed(() => {
    return this.currentExerciseSets().length;
  });

  async ngOnInit(): Promise<void> {
    const sessionId = this._route.snapshot.paramMap.get('sessionId');
    if (!sessionId) {
      await this._router.navigate(['/routines']);
      return;
    }

    const active = this._workout.activeWorkout();
    if (!active || active.session.id !== sessionId) {
      await this._workout.resumeSession(sessionId);
      if (!this._workout.activeWorkout()) {
        await this._router.navigate(['/routines']);
        return;
      }
    }

    this._startTime = Date.now();
    setInterval(() => { /* trigger change detection for elapsedTime */ }, 1000);
  }

  updateWeight(setId: string, weight: number): void {
    const w = this.workout();
    if (!w) return;
    const sets = w.session.sets?.map(s =>
      s.id === setId ? { ...s, weight: isNaN(weight) ? null : weight } : s
    );
    if (sets && w.session.sets) {
      w.session.sets = sets;
    }
  }

  updateReps(setId: string, reps: number): void {
    const w = this.workout();
    if (!w) return;
    const sets = w.session.sets?.map(s =>
      s.id === setId ? { ...s, reps: isNaN(reps) ? null : reps } : s
    );
    if (sets && w.session.sets) {
      w.session.sets = sets;
    }
  }

  async completeSet(setId: string): Promise<void> {
    const w = this.workout();
    if (!w) return;

    const set = w.session.sets?.find(s => s.id === setId);
    if (!set) return;

    await this._workout.completeSet(setId, {
      weight: set.weight ?? undefined,
      reps: set.reps ?? undefined,
    });
  }

  soundClick(): void {
    this._notification.playTick();
    this._notification.vibrate(50);
  }

  nextExercise(): void {
    const w = this.workout();
    if (!w) return;
    const max = (w.session.routine?.routine_exercises?.length ?? 1) - 1;
    if (w.currentExerciseIndex < max) {
      const newIndex = w.currentExerciseIndex + 1;
      const sets = w.session.sets ?? [];
      const nextExId = w.session.routine?.routine_exercises?.[newIndex]?.id;
      const nextSetIndex = nextExId ? sets.findIndex(s => s.routine_exercise_id === nextExId && !s.is_completed) : 0;
      this._updateWorkoutPosition(newIndex, Math.max(0, nextSetIndex));
    }
  }

  prevExercise(): void {
    const w = this.workout();
    if (!w) return;
    if (w.currentExerciseIndex > 0) {
      const newIndex = w.currentExerciseIndex - 1;
      const sets = w.session.sets ?? [];
      const prevExId = w.session.routine?.routine_exercises?.[newIndex]?.id;
      const prevSetIndex = prevExId ? sets.findIndex(s => s.routine_exercise_id === prevExId && !s.is_completed) : 0;
      this._updateWorkoutPosition(newIndex, Math.max(0, prevSetIndex));
    }
  }

  private _updateWorkoutPosition(exerciseIndex: number, setIndex: number): void {
    this._workout.navigateToExercise(exerciseIndex, setIndex);
  }

  async finishWorkout(): Promise<void> {
    const w = this.workout();
    if (!w) return;
    await this._workout.completeSession(w.session.id);
    await this._router.navigate(['/workout', w.session.id, 'summary']);
  }

  async cancelWorkout(): Promise<void> {
    const w = this.workout();
    if (!w) return;
    this.confirmCancel.set(false);
    await this._workout.cancelSession(w.session.id);
    await this._router.navigate(['/routines']);
  }
}
