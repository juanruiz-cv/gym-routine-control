import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiBadge } from '@shared/ui/badge';
import { UiSkeleton } from '@shared/ui/skeleton';
import { UiModal } from '@shared/ui/modal';
import { DifficultyPipe } from '@shared/pipes/difficulty';
import { RoutineService } from '@core/services/routine.service';
import { WorkoutService } from '@core/services/workout.service';
import {
  LucideArrowLeft, LucidePlay, LucidePencil, LucideCopy, LucideTrash2, LucideClock,
  LucideDumbbell, LucideFlame, LucideCheck,
} from '@lucide/angular';
import type { Routine } from '@shared/models';

@Component({
  selector: 'app-routine-detail-page',
  standalone: true,
  imports: [
    RouterLink, UiCard, UiButton, UiBadge, UiSkeleton, UiModal,
    DifficultyPipe,
    LucideArrowLeft, LucidePlay, LucidePencil, LucideCopy, LucideTrash2, LucideClock,
    LucideDumbbell, LucideFlame, LucideCheck,
  ],
  template: `
    <div class="p-4 space-y-4 max-w-lg mx-auto">
      <!-- Loading -->
      @if (loading()) {
        <div class="space-y-4">
          <app-ui-skeleton variant="card" height="48px" />
          @for (i of [1,2,3]; track i) {
            <app-ui-skeleton variant="card" height="80px" />
          }
        </div>
        <div class="flex justify-center py-12">
          <span class="text-on-surface-muted">Loading...</span>
        </div>
      }

      @if (routine(); as r) {
        <!-- Header -->
        <div>
          <button (click)="goBack()" class="p-2 rounded-xl hover:bg-surface-hover transition-colors mb-3">
            <svg lucideArrowLeft class="w-5 h-5" strokeWidth="2"></svg>
          </button>
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <h1 class="text-xl font-bold truncate">{{ r.name }}</h1>
              @if (r.description) {
                <p class="text-sm text-on-surface-muted mt-1">{{ r.description }}</p>
              }
              <div class="flex items-center gap-2 mt-2">
                <app-ui-badge
                  [variant]="r.difficulty === 'beginner' ? 'success' : r.difficulty === 'intermediate' ? 'warning' : 'error'"
                  size="sm"
                >
                  {{ r.difficulty | difficulty }}
                </app-ui-badge>
                @let exCount = r.routine_exercises?.length ?? 0;
                @if (exCount > 0) {
                  <span class="text-xs text-on-surface-muted">{{ exCount }} exercises</span>
                }
                @if (r.estimated_duration) {
                  <span class="text-xs text-on-surface-muted flex items-center gap-1">
                    <svg lucideClock class="w-3 h-3" strokeWidth="2"></svg>
                    ~{{ r.estimated_duration }}min
                  </span>
                }
              </div>
            </div>

            @if (r.routine_exercises?.length) {
              <button ui-button variant="primary" size="sm" class="shrink-0" (click)="startWorkout(r)">
                <svg lucidePlay class="w-4 h-4" strokeWidth="2.5"></svg>
                Start
              </button>
            }
          </div>
        </div>

        <!-- Action Strip -->
        <div class="flex gap-2">
          <button ui-button variant="secondary" size="sm" class="flex-1" routerLink="/routines/{{ r.id }}/edit">
            <svg lucidePencil class="w-4 h-4" strokeWidth="2"></svg>
            Edit
          </button>
          <button ui-button variant="secondary" size="sm" class="flex-1" (click)="duplicateRoutine(r.id)">
            <svg lucideCopy class="w-4 h-4" strokeWidth="2"></svg>
            Duplicate
          </button>
          <button ui-button variant="danger" size="sm" class="flex-1" (click)="showDeleteModal.set(true)">
            <svg lucideTrash2 class="w-4 h-4" strokeWidth="2"></svg>
            Delete
          </button>
        </div>

        <!-- Exercise List -->
        <div>
          <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">Exercises</h2>
          @if (!r.routine_exercises?.length) {
            <app-ui-card variant="glass">
              <div class="flex flex-col items-center py-8 text-center">
                <svg lucideDumbbell class="w-10 h-10 text-on-surface-muted mb-2" strokeWidth="1.5"></svg>
                <p class="text-sm text-on-surface-muted">No exercises in this routine</p>
                <a ui-button variant="primary" size="sm" class="mt-3" routerLink="/routines/{{ r.id }}/edit">
                  Add exercises
                </a>
              </div>
            </app-ui-card>
          } @else {
            <div class="space-y-2">
              @for (ex of r.routine_exercises; track ex.id; let i = $index) {
                <app-ui-card variant="glass" [padding]="true">
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 text-sm font-bold text-brand">
                      {{ i + 1 }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium">{{ ex.exercise?.name ?? 'Unknown' }}</p>
                      @if (ex.exercise?.muscle_group) {
                        <p class="text-xs text-on-surface-muted">{{ ex.exercise!.muscle_group }}</p>
                      }
                      <div class="flex items-center gap-3 mt-1.5 text-xs text-on-surface-muted">
                        <span>{{ ex.sets }} sets</span>
                        @if (ex.reps) { <span>{{ ex.reps }} reps</span> }
                        @if (ex.weight) { <span>{{ ex.weight }} kg</span> }
                        @if (ex.rest_time) { <span>{{ ex.rest_time }}s rest</span> }
                      </div>
                    </div>
                    <a
                      ui-button variant="ghost" size="sm"
                      routerLink="/exercises/{{ ex.exercise_id }}"
                      class="shrink-0"
                    >
                      <svg lucideFlame class="w-4 h-4" strokeWidth="2"></svg>
                    </a>
                  </div>
                </app-ui-card>
              }
            </div>
          }
        </div>
      }

      <!-- Duplicate toast -->
      @if (showDuplicateToast()) {
        <div class="fixed bottom-24 left-4 right-4 max-w-lg mx-auto z-50 animate-slide-up">
          <app-ui-card variant="elevated" [padding]="true">
            <div class="flex items-center gap-3">
              <svg lucideCheck class="w-5 h-5 text-success" strokeWidth="2"></svg>
              <span class="text-sm">Routine duplicated successfully!</span>
            </div>
          </app-ui-card>
        </div>
      }

      <!-- Delete Modal -->
      <app-ui-modal [isOpen]="showDeleteModal()" title="Delete Routine" (closed)="showDeleteModal.set(false)">
        <p class="text-sm text-on-surface-muted mb-4">
          Are you sure you want to delete "{{ routine()?.name }}"? This action cannot be undone.
        </p>
        <div class="flex gap-3">
          <button ui-button variant="ghost" size="md" class="flex-1" (click)="showDeleteModal.set(false)">Cancel</button>
          <button ui-button variant="danger" size="md" class="flex-1" (click)="deleteRoutine()">
            Delete
          </button>
        </div>
      </app-ui-modal>
    </div>
  `,
})
export class RoutineDetailPage implements OnInit {
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _routines = inject(RoutineService);
  private readonly _workout = inject(WorkoutService);

  readonly routine = signal<Routine | null>(null);
  readonly loading = signal(true);
  readonly showDeleteModal = signal(false);
  readonly showDuplicateToast = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this._route.snapshot.paramMap.get('id');
    if (!id) {
      this.goBack();
      return;
    }
    try {
      const r = await this._routines.getById(id);
      this.routine.set(r);
    } catch {
      this.goBack();
    } finally {
      this.loading.set(false);
    }
  }

  async startWorkout(r: Routine): Promise<void> {
    if (!r.routine_exercises?.length) return;
    try {
      const exercises = r.routine_exercises.map(re => ({
        id: re.id,
        sets: re.sets,
      }));
      const session = await this._workout.startSession(r.id, exercises);
      await this._router.navigate(['/workout', session.id]);
    } catch {
      // Handle error
    }
  }

  async duplicateRoutine(id: string): Promise<void> {
    await this._routines.duplicate(id);
    this.showDuplicateToast.set(true);
    setTimeout(() => this.showDuplicateToast.set(false), 2500);
  }

  async deleteRoutine(): Promise<void> {
    const r = this.routine();
    if (!r) return;
    await this._routines.softDelete(r.id);
    this.showDeleteModal.set(false);
    await this._router.navigate(['/routines']);
  }

  goBack(): void {
    this._router.navigate(['/routines']);
  }
}
