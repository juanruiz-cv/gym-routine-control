import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiBadge } from '@shared/ui/badge';
import { UiSkeletonCard, UiTimer } from '@shared/ui';
import { UiModal } from '@shared/ui/modal';
import { UiEmptyState } from '@shared/ui/empty-state';
import { RecoveryTimerAvatarComponent } from '@shared/components/recovery-timer-avatar/recovery-timer-avatar.component';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { WorkoutService } from '@core/services/workout.service';
import { NotificationService } from '@core/services/notification.service';
import type { WorkoutSet } from '@shared/models';
import {
  LucideCheck, LucideX,
  LucideTimer, LucideCheckCircle, LucideChevronDown,
  LucideGripVertical,
} from '@lucide/angular';

@Component({
  selector: 'app-workout-session-page',
  standalone: true,
  imports: [
    UiCard, UiButton, UiBadge, UiSkeletonCard, UiTimer, UiModal, UiEmptyState,
    TranslatePipe, DragDropModule, RecoveryTimerAvatarComponent,
    LucideTimer, LucideCheck, LucideCheckCircle, LucideX, LucideChevronDown,
    LucideGripVertical,
  ],
  template: `
    <div class="flex flex-col min-h-dvh">
      @if (workout(); as w) {
        @let session = w.session;
        @let routineExs = session.routine?.routine_exercises ?? [];

        <!-- Header -->
        <div class="sticky top-0 z-10 bg-surface/80 backdrop-blur-xl">
          <div class="flex items-center justify-between px-4 py-2">
            <button
              (click)="confirmCancel.set(true)"
              class="p-2 rounded-xl hover:bg-surface-hover transition-colors"
              [attr.aria-label]="'workout.cancel' | translate"
            >
              <svg lucideX class="w-5 h-5" strokeWidth="2" aria-hidden="true"></svg>
            </button>
            <div class="text-center">
              <p class="text-sm font-medium">{{ session.routine?.name ?? ('workout.title' | translate) }}</p>
            </div>
            <button
              ui-button variant="primary" size="sm"
              [title]="'workout.finish' | translate"
              (click)="confirmFinish.set(true)"
              [attr.aria-label]="'workout.finish' | translate"
            >
              <svg lucideCheck class="w-4 h-4" strokeWidth="2.5" aria-hidden="true"></svg>
            </button>
          </div>

          <!-- Progress Bar -->
          <div
            class="h-1 bg-white/5"
            role="progressbar"
            [attr.aria-valuenow]="totalProgress()"
            aria-valuemin="0"
            aria-valuemax="100"
            [attr.aria-label]="'workout.progress' | translate"
          >
            <div
              class="h-full bg-brand transition-all duration-300"
              [style.width.%]="totalProgress()"
            ></div>
          </div>
        </div>

        @if (routineExs.length > 0) {
          <div class="flex-1 p-4 space-y-3 max-w-lg lg:max-w-3xl mx-auto w-full">
            <!-- Global Timer -->
            <div class="mb-3">
              <app-ui-card variant="glass" [padding]="true">
                <app-ui-timer
                  mode="countup"
                  [autoStart]="true"
                  [allowStop]="true"
                  stopLabel="workout.finish"
                  (timerStopped)="confirmCancel.set(true)"
                />
              </app-ui-card>
            </div>

            <!-- Exercise Accordion -->
            <div cdkDropList class="space-y-3" (cdkDropListDropped)="onExerciseDrop($event)">
            @for (ex of routineExs; track ex.id) {
              @let exSets = getExerciseSets(ex.id);
              @let completed = countCompleted(exSets);
              @let total = exSets.length;

              <div
                cdkDrag
                class="rounded-2xl border border-border glass overflow-hidden"
              >
                <!-- Header -->
                <div class="flex items-center p-4 gap-3">
                  <button cdkDragHandle
                    class="cursor-grab active:cursor-grabbing shrink-0 p-1 -m-1 rounded hover:bg-surface-hover transition-colors"
                    [attr.aria-label]="'workout.reorder' | translate"
                  >
                    <svg lucideGripVertical class="w-4 h-4 text-on-surface-muted" strokeWidth="1.5" aria-hidden="true"></svg>
                  </button>
                  <button
                    class="flex-1 flex items-center gap-3 text-left min-w-0"
                    (click)="toggleExercise(ex.id)"
                    [attr.aria-expanded]="isExpanded(ex.id)"
                    [attr.aria-label]="ex.exercise?.name"
                  >
                    <svg lucideChevronDown
                      [class.rotate-180]="!isExpanded(ex.id)"
                      class="w-5 h-5 text-on-surface-muted transition-transform duration-200 shrink-0"
                      strokeWidth="2"
                      aria-hidden="true">
                    </svg>
                    <div class="flex-1 min-w-0">
                      <h3 class="text-base font-semibold text-on-surface truncate">{{ ex.exercise?.name ?? ('workout.title' | translate) }}</h3>
                      @if (ex.exercise?.muscle_group) {
                        <app-ui-badge variant="brand" size="sm" class="mt-0.5">
                          {{ 'muscleGroup.' + ex.exercise!.muscle_group | translate }}
                        </app-ui-badge>
                      }
                    </div>
                    <span
                      class="text-sm tabular-nums shrink-0"
                      [class.text-brand]="completed === total && total > 0"
                      [class.text-on-surface-muted]="completed !== total"
                    >
                      {{ completed }}/{{ total }}
                    </span>
                  </button>
                </div>

                <!-- Body -->
                @if (isExpanded(ex.id)) {
                  <div class="px-4 pb-4 space-y-2 border-t border-border">
                    @for (set of exSets; track set.id) {
                      <div class="pt-3 first:pt-3">
                        <div
                          [class.border-2]="isCurrentSet(set, exSets)"
                          [class.border-brand]="isCurrentSet(set, exSets)"
                          class="rounded-2xl"
                        >
                          <app-ui-card variant="glass" [padding]="true">
                            <div class="flex items-center gap-3">
                              <div class="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center shrink-0 text-sm font-bold text-on-surface-muted">
                                {{ set.set_number }}
                              </div>

                              <div class="flex-1 flex items-center gap-2">
                                @if (set.is_completed) {
                                  <div class="flex items-center gap-3 text-sm">
                                    <span class="text-on-surface font-medium">{{ set.weight ?? '—' }} kg</span>
                                    <span class="text-on-surface-muted">&times;</span>
                                    <span class="text-on-surface font-medium">{{ set.reps ?? '—' }}</span>
                                    <svg lucideCheckCircle class="w-5 h-5 text-success" strokeWidth="2" aria-hidden="true"></svg>
                                  </div>
                                } @else {
                                  <div class="flex items-center gap-2">
                                    <label class="sr-only" [for]="'weight-' + set.id">{{ 'workout.weight' | translate }}</label>
                                    <input
                                      [id]="'weight-' + set.id"
                                      #weightInput
                                      type="number"
                                      [value]="set.weight ?? ''"
                                      (input)="updateWeight(set.id, +weightInput.value)"
                                      class="w-20 px-3 py-2 rounded-lg bg-surface-input border border-white/10 text-sm text-center text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
                                      [placeholder]="'workout.lbs' | translate"
                                      step="0.5"
                                      min="0"
                                    />
                                    <span class="text-on-surface-muted">&times;</span>
                                    <label class="sr-only" [for]="'reps-' + set.id">{{ 'routines.reps' | translate }}</label>
                                    <input
                                      [id]="'reps-' + set.id"
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
                                      [disabled]="!canCompleteSet(set, exSets)"
                                      (click)="openConfirmSet(set.id, ex.id); soundClick()"
                                      [attr.aria-label]="'workout.completeSet' | translate"
                                    >
                                      <svg lucideCheck class="w-4 h-4" strokeWidth="2.5" aria-hidden="true"></svg>
                                    </button>
                                  </div>
                                }
                              </div>
                            </div>
                          </app-ui-card>
                        </div>
                      </div>
                    }

                    <!-- Rest Timer between sets -->
                    @if (completed > 0 && completed < total) {
                      @if (restTimerChanging() === ex.id) {
                        <app-ui-skeleton-card height="200px" class="mt-3" />
                      } @else if (restTimerActiveFor() === ex.id) {
                        <app-ui-card variant="glass" class="mt-3">
                          <div class="flex flex-col sm:flex-row items-center gap-4">
                            <app-recovery-timer-avatar
                              [remainingSeconds]="currentRestRemaining()"
                              [totalSeconds]="customRestTime()"
                            />
                            <div class="flex-1 flex flex-col items-center">
                              <div class="flex items-center gap-3 mb-3">
                                <svg lucideTimer class="w-5 h-5 text-brand" strokeWidth="1.5" aria-hidden="true"></svg>
                                <span class="text-sm font-medium">{{ 'workout.restTimer' | translate }}</span>
                                <input
                                  type="text"
                                  [value]="restTimeDisplay()"
                                  (blur)="onRestTimeChange($any($event.target).value, ex.id)"
                                  class="w-16 px-2 py-1 rounded-lg bg-surface-input border border-white/10 text-xs text-center text-on-surface placeholder:text-on-surface-muted/50 focus:outline-none focus:ring-1 focus:ring-brand"
                                  placeholder="1:30"
                                />
                              </div>
                              <app-ui-timer
                                mode="countdown"
                                [duration]="customRestTime()"
                                [autoStart]="true"
                                [allowSkip]="true"
                                skipLabel="timer.skipRest"
                                (timerStopped)="skipRestFor(ex.id)"
                                (timerCompleted)="onRestCompleted()"
                                (timerTick)="currentRestRemaining.set($event)"
                              />
                            </div>
                          </div>
                        </app-ui-card>
                      }
                    }
                  </div>
                }
              </div>
            }
            </div>

            <!-- Bottom Finish -->
            <div class="flex gap-3 pt-2 pb-4">
              <button ui-button variant="primary" size="md" class="flex-1" (click)="finishWorkout()">
                <svg lucideCheck class="w-4 h-4" strokeWidth="2.5" aria-hidden="true"></svg>
                {{ 'workout.finish' | translate }}
              </button>
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

      <!-- Complete Set Confirmation -->
      @if (setToConfirm(); as pending) {
        <app-ui-modal [isOpen]="true" [title]="'workout.completeSet' | translate" (closed)="setToConfirm.set(null)">
          <div class="mb-4 space-y-2">
            @if (pending.exName) {
              <p class="text-on-surface font-medium text-sm">{{ pending.exName }}</p>
            }
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center shrink-0 text-sm font-bold text-on-surface-muted">
                {{ pending.setNumber }}
              </span>
              <span class="text-base font-semibold text-on-surface">
                {{ pending.weight }} kg &times; {{ pending.reps }}
              </span>
            </div>
          </div>
          <div class="flex gap-3">
            <button ui-button variant="ghost" size="md" class="flex-1" (click)="setToConfirm.set(null)">{{ 'workout.cancel' | translate }}</button>
            <button ui-button variant="primary" size="md" class="flex-1" (click)="confirmAndComplete()">
              <svg lucideCheck class="w-4 h-4" strokeWidth="2.5" aria-hidden="true"></svg>
              {{ 'workout.completeSet' | translate }}
            </button>
          </div>
        </app-ui-modal>
      }

      <!-- Finish Confirmation -->
      <app-ui-modal [isOpen]="confirmFinish()" [title]="'workout.finishTitle' | translate" (closed)="confirmFinish.set(false)">
        <p class="text-sm text-on-surface-muted mb-4">
          @if (pendingSetsCount() > 0) {
            {{ 'workout.finishPending' | translate:{ count: pendingSetsCount() } }}
          } @else {
            {{ 'workout.finishConfirm' | translate }}
          }
        </p>
        <div class="flex gap-3">
          <button ui-button variant="ghost" size="md" class="flex-1" (click)="confirmFinish.set(false)">{{ 'workout.cancel' | translate }}</button>
          <button ui-button variant="primary" size="md" class="flex-1" (click)="confirmFinish.set(false); finishWorkout()">
            <svg lucideCheck class="w-4 h-4" strokeWidth="2.5" aria-hidden="true"></svg>
            {{ 'workout.finish' | translate }}
          </button>
        </div>
      </app-ui-modal>
    </div>
  `,
  styles: [`
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 1rem;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      opacity: 0.9;
    }
    .cdk-drag-placeholder {
      opacity: 0.3;
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `],
})
export class WorkoutSessionPage implements OnInit, OnDestroy {
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _workout = inject(WorkoutService);
  private readonly _notification = inject(NotificationService);

  readonly workout = this._workout.activeWorkout;
  readonly confirmCancel = signal(false);
  readonly confirmFinish = signal(false);
  readonly expandedExerciseIds = signal<Set<string>>(new Set());
  readonly restTimerActiveFor = signal<string | null>(null);
  readonly restTimerChanging = signal<string | null>(null);
  readonly customRestTime = signal(90);
  readonly currentRestRemaining = signal(90);
  readonly setToConfirm = signal<{ setId: string; exId: string; weight: number; reps: number; setNumber: number; exName: string | undefined } | null>(null);

  private _wakeLock: WakeLockSentinel | null = null;

  readonly totalProgress = computed(() => {
    const w = this.workout();
    if (!w?.session?.sets?.length) return 0;
    const total = w.session.sets.length;
    const completed = w.session.sets.filter(s => s.is_completed).length;
    return total > 0 ? (completed / total) * 100 : 0;
  });

  readonly pendingSetsCount = computed(() => {
    const w = this.workout();
    if (!w?.session?.sets?.length) return 0;
    return w.session.sets.filter(s => !s.is_completed).length;
  });

  readonly restTimeDisplay = computed(() => {
    const total = this.customRestTime();
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  });

  getExerciseSets(exId: string): WorkoutSet[] {
    const w = this.workout();
    if (!w) return [];
    return (w.session.sets ?? []).filter(s => s.routine_exercise_id === exId);
  }

  countCompleted(sets: WorkoutSet[]): number {
    return sets.filter(s => s.is_completed).length;
  }

  isCurrentSet(set: WorkoutSet, sets: WorkoutSet[]): boolean {
    const firstIncomplete = sets.find(s => !s.is_completed);
    return firstIncomplete?.id === set.id;
  }

  canCompleteSet(set: WorkoutSet, sets: WorkoutSet[]): boolean {
    return this.isCurrentSet(set, sets) && set.weight != null && set.reps != null;
  }

  toggleExercise(id: string): void {
    this.expandedExerciseIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isExpanded(id: string): boolean {
    return this.expandedExerciseIds().has(id);
  }

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

    this._requestWakeLock();
    document.addEventListener('visibilitychange', this._onVisibilityChange);

    const exs = this.workout()?.session.routine?.routine_exercises ?? [];
    if (exs.length > 0) {
      const allSets = this.workout()?.session.sets ?? [];
      const activeEx = exs.find(ex =>
        allSets.filter(s => s.routine_exercise_id === ex.id).some(s => !s.is_completed)
      );
      this.expandedExerciseIds.set(activeEx ? new Set([activeEx.id]) : new Set([exs[0].id]));
    }
  }

  ngOnDestroy(): void {
    this._releaseWakeLock();
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
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

  openConfirmSet(setId: string, exId: string): void {
    const w = this.workout();
    if (!w) return;
    const set = w.session.sets?.find(s => s.id === setId);
    if (!set || set.weight == null || set.reps == null) return;
    const ex = w.session.routine?.routine_exercises?.find(e => e.id === exId);
    this.setToConfirm.set({
      setId,
      exId,
      weight: set.weight,
      reps: set.reps,
      setNumber: set.set_number,
      exName: ex?.exercise?.name,
    });
  }

  confirmAndComplete(): void {
    const pending = this.setToConfirm();
    if (!pending) return;
    this.setToConfirm.set(null);
    this.completeSet(pending.setId, pending.exId);
  }

  onExerciseDrop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return;

    const w = this.workout();
    if (!w?.session.routine?.routine_exercises) return;

    const arr = [...w.session.routine.routine_exercises];
    const [moved] = arr.splice(event.previousIndex, 1);
    arr.splice(event.currentIndex, 0, moved);
    arr.forEach((ex, i) => { ex.sort_order = i; });
    w.session.routine.routine_exercises = arr;
  }

  async completeSet(setId: string, exId: string): Promise<void> {
    const w = this.workout();
    if (!w) return;

    const set = w.session.sets?.find(s => s.id === setId);
    if (!set) return;

    const completedWeight = set.weight;
    const completedReps = set.reps;

    await this._workout.completeSet(setId, {
      weight: set.weight ?? undefined,
      reps: set.reps ?? undefined,
    });

    if (completedWeight != null && completedReps != null) {
      const current = this.workout();
      if (current) {
        const exSets = (current.session.sets ?? []).filter(s => s.routine_exercise_id === exId);
        const nextSet = exSets.find(s => !s.is_completed);
        if (nextSet) {
          current.session.sets = current.session.sets?.map(s =>
            s.id === nextSet.id ? { ...s, weight: completedWeight, reps: completedReps } : s
          );
        }
      }
    }

    this.customRestTime.set(
      w.session.routine?.routine_exercises?.find(e => e.id === exId)?.rest_time ?? 90
    );
    this.restTimerChanging.set(exId);
    this.restTimerActiveFor.set(null);
    setTimeout(() => {
      this.restTimerActiveFor.set(exId);
      this.restTimerChanging.set(null);
    }, 50);
  }

  skipRestFor(exId: string): void {
    this.restTimerChanging.set(exId);
    this.restTimerActiveFor.set(null);
    setTimeout(() => {
      this.restTimerActiveFor.set(exId);
      this.restTimerChanging.set(null);
    }, 50);
  }

  onRestTimeChange(value: string, exId: string): void {
    const seconds = this._parseRestTime(value);
    if (seconds && seconds >= 10) {
      this.customRestTime.set(seconds);
      this.restTimerChanging.set(exId);
      this.restTimerActiveFor.set(null);
      setTimeout(() => {
        this.restTimerActiveFor.set(exId);
        this.restTimerChanging.set(null);
      }, 50);
    }
  }

  onRestCompleted(): void {
    this._notification.playTimerEnd();
    this._notification.vibrate([200, 100, 200]);
  }

  soundClick(): void {
    this._notification.playTick();
    this._notification.vibrate(50);
  }

  async finishWorkout(): Promise<void> {
    const w = this.workout();
    if (!w) return;
    this._releaseWakeLock();
    await this._workout.completeSession(w.session.id);
    await this._router.navigate(['/workout', w.session.id, 'summary']);
  }

  async cancelWorkout(): Promise<void> {
    const w = this.workout();
    if (!w) return;
    this.confirmCancel.set(false);
    this._releaseWakeLock();
    await this._workout.cancelSession(w.session.id);
    await this._router.navigate(['/routines']);
  }

  private _onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible' && !this._wakeLock) {
      this._requestWakeLock();
    }
  };

  private async _requestWakeLock(): Promise<void> {
    try {
      if ('wakeLock' in navigator) {
        this._wakeLock = await navigator.wakeLock.request('screen');
        this._wakeLock.addEventListener('release', () => {
          this._wakeLock = null;
        });
      }
    } catch {
      /* WakeLock not supported or denied */
    }
  }

  private async _releaseWakeLock(): Promise<void> {
    try {
      if (this._wakeLock) {
        await this._wakeLock.release();
        this._wakeLock = null;
      }
    } catch {
      /* already released */
    }
  }

  private _parseRestTime(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const plain = Number(trimmed);
    if (!isNaN(plain) && plain >= 10) return plain;

    const parts = trimmed.split(':');
    if (parts.length === 2) {
      const min = Number(parts[0]);
      const sec = Number(parts[1]);
      if (!isNaN(min) && !isNaN(sec) && min >= 0 && sec >= 0 && sec < 60) {
        const total = min * 60 + sec;
        if (total >= 10) return total;
      }
    }

    return null;
  }
}
