import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiBadge } from '@shared/ui/badge';
import { UiInput } from '@shared/ui/input';
import { UiSkeletonCard } from '@shared/ui';
import { UiModal } from '@shared/ui/modal';
import { DifficultyPipe } from '@shared/pipes/difficulty';
import { UiEmptyState } from '@shared/ui/empty-state';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { I18nService } from '@shared/i18n/i18n.service';
import { RoutineService } from '@core/services/routine.service';
import { WorkoutService } from '@core/services/workout.service';
import { AuthService } from '@core/auth/auth.service';
import { PermissionService } from '@core/services/permission.service';
import { RoutineAssignmentService } from '@core/services/routine-assignment.service';
import { AdminService } from '@core/services/admin.service';
import {
  LucideArrowLeft, LucidePlay, LucidePencil, LucideCopy, LucideTrash2, LucideClock,
  LucideFlame, LucideCheck, LucideUserPlus,
} from '@lucide/angular';
import type { Routine } from '@shared/models';

@Component({
  selector: 'app-routine-detail-page',
  standalone: true,
  imports: [
    RouterLink, UiCard, UiButton, UiBadge, UiInput, UiSkeletonCard, UiModal, UiEmptyState,
    DifficultyPipe, TranslatePipe,
    LucideArrowLeft, LucidePlay, LucidePencil, LucideCopy, LucideTrash2, LucideClock,
    LucideFlame, LucideCheck, LucideUserPlus,
  ],
  template: `
    <div class="p-4 space-y-4 max-w-lg mx-auto">
      <!-- Loading -->
      @if (loading()) {
        <div class="flex flex-col gap-4">
          @for (i of [1,2,3,4]; track i) {
            <app-ui-skeleton-card height="80px" />
          }
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
          <app-ui-empty-state variant="error" title="{{ 'common.error' | translate }}" message="{{ 'common.errorDesc' | translate }}">
            <button ui-button variant="primary" size="md" (click)="goBack()">
              {{ 'common.back' | translate }}
            </button>
          </app-ui-empty-state>
        </div>
      }

      @if (routine(); as r) {
        <!-- Header -->
        <div>
          <button (click)="goBack()" title="{{ 'routines.backTooltip' | translate }}" class="p-2 rounded-xl hover:bg-surface-hover transition-colors mb-3">
            <svg lucideArrowLeft class="w-5 h-5" strokeWidth="2" aria-hidden="true"></svg>
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
                  <span class="text-xs text-on-surface-muted">{{ exCount }} {{ 'routines.exercises' | translate }}</span>
                }
                @if (r.estimated_duration) {
                  <span class="text-xs text-on-surface-muted flex items-center gap-1">
                    <svg lucideClock class="w-3 h-3" strokeWidth="2" aria-hidden="true"></svg>
                    ~{{ r.estimated_duration }}min
                  </span>
                }
              </div>
            </div>

            @if (r.routine_exercises?.length) {
              <button ui-button variant="primary" size="sm" class="shrink-0" title="{{ 'routines.startTooltip' | translate }}" (click)="startWorkout(r)">
                <svg lucidePlay class="w-4 h-4" strokeWidth="2.5" aria-hidden="true"></svg>
                {{ 'routines.start' | translate }}
              </button>
            }
          </div>
        </div>

        <!-- Action Strip -->
        <div class="flex gap-2">
          <button ui-button variant="secondary" size="sm" class="flex-1" title="{{ 'routines.editTooltip' | translate }}" (click)="editRoutine(r)">
            <svg lucidePencil class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
            {{ 'routines.edit' | translate }}
          </button>
          <button ui-button variant="secondary" size="sm" class="flex-1" title="{{ 'routines.duplicateTooltip' | translate }}" (click)="duplicateRoutine(r.id)">
            <svg lucideCopy class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
            {{ 'routines.duplicate' | translate }}
          </button>
          @if (perm.canAssignRoutines()) {
            <button ui-button variant="secondary" size="sm" class="flex-1" title="{{ 'staff.assignRoutine' | translate }}" (click)="showAssignModal.set(true)">
              <svg lucideUserPlus class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
              {{ 'staff.assignRoutine' | translate }}
            </button>
          }
          <button ui-button variant="danger" size="sm" class="flex-1" title="{{ 'routines.deleteTooltip' | translate }}" (click)="showDeleteModal.set(true)">
            <svg lucideTrash2 class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
            {{ 'routines.delete' | translate }}
          </button>
        </div>

        <!-- Exercise List -->
        <div>
          <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">{{ 'routines.exercisesSection' | translate }}</h2>
          @if (!r.routine_exercises?.length) {
            <app-ui-empty-state
              variant="routine"
              title="{{ 'routines.noExercises' | translate }}"
              [primaryAction]="{ label: ('routines.addExercises' | translate), routerLink: '/routines/' + r.id + '/edit', variant: 'primary' }"
            />
          } @else {
            <div class="flex flex-col gap-2">
              @for (ex of r.routine_exercises; track ex.id; let i = $index) {
                <app-ui-card variant="glass" [padding]="true">
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 text-sm font-bold text-brand">
                      {{ i + 1 }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium">{{ ex.exercise?.name ?? ('routines.unknown' | translate) }}</p>
                      @if (ex.exercise?.muscle_group) {
                        <p class="text-xs text-on-surface-muted">{{ 'muscleGroup.' + ex.exercise!.muscle_group | translate }}</p>
                      }
                      <div class="flex items-center gap-3 mt-1.5 text-xs text-on-surface-muted">
                        <span>{{ ex.sets }} {{ 'routines.sets' | translate }}</span>
                        @if (ex.reps) { <span>{{ ex.reps }} {{ 'routines.reps' | translate }}</span> }
                        @if (ex.weight) { <span>{{ ex.weight }} {{ 'routines.kg' | translate }}</span> }
                        @if (ex.rest_time) { <span>{{ ex.rest_time }}{{ 'routines.rest' | translate }}</span> }
                      </div>
                    </div>
                    <a
                      ui-button variant="ghost" size="sm"
                      routerLink="/exercises/{{ ex.exercise_id }}"
                      title="{{ 'routines.viewExercise' | translate }}"
                      class="shrink-0"
                    >
                      <svg lucideFlame class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
                    </a>
                  </div>
                </app-ui-card>
              }
            </div>
          }
        </div>
      }

      <!-- Assign Modal -->
      <app-ui-modal [isOpen]="showAssignModal()" [title]="'staff.assignRoutine' | translate" (closed)="showAssignModal.set(false)">
        <p class="text-sm text-on-surface-muted mb-3">{{ 'staff.assignEmailPrompt' | translate }}</p>
        <app-ui-input
          [placeholder]="'auth.emailPlaceholder' | translate"
          [value]="assignEmail()"
          (valueChange)="assignEmail.set($event); assignError.set('')"
        />
        @if (assignError()) {
          <p class="text-xs text-error mt-1">{{ assignError() }}</p>
        }
        @if (assignSuccess()) {
          <p class="text-xs text-success mt-1">{{ assignSuccess() }}</p>
        }
        <div class="flex gap-3 mt-4">
          <button ui-button variant="ghost" size="md" class="flex-1" (click)="showAssignModal.set(false)">{{ 'common.cancel' | translate }}</button>
          <button ui-button variant="primary" size="md" class="flex-1" [disabled]="assignSaving()" (click)="doAssign()">
            {{ assignSaving() ? ('common.saving' | translate) : ('staff.assignRoutine' | translate) }}
          </button>
        </div>
      </app-ui-modal>

      <!-- Duplicate toast -->
      @if (showDuplicateToast()) {
        <div class="fixed bottom-24 left-4 right-4 max-w-lg mx-auto z-50 animate-slide-up">
          <app-ui-card variant="elevated" [padding]="true">
            <div class="flex items-center gap-3">
              <svg lucideCheck class="w-5 h-5 text-success" strokeWidth="2" aria-hidden="true"></svg>
              <span class="text-sm">{{ 'routines.duplicated' | translate }}</span>
            </div>
          </app-ui-card>
        </div>
      }

      <!-- Delete Modal -->
      <app-ui-modal [isOpen]="showDeleteModal()" [title]="'routines.deleteTitle' | translate" (closed)="showDeleteModal.set(false)">
        <p class="text-sm text-on-surface-muted mb-4">
          {{ 'routines.deleteConfirm' | translate }}
        </p>
        <div class="flex gap-3">
          <button ui-button variant="ghost" size="md" class="flex-1" (click)="showDeleteModal.set(false)">{{ 'routines.cancel' | translate }}</button>
          <button ui-button variant="danger" size="md" class="flex-1" (click)="deleteRoutine()">
            {{ 'routines.delete' | translate }}
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
  private readonly _auth = inject(AuthService);
  private readonly _assignments = inject(RoutineAssignmentService);
  private readonly _admin = inject(AdminService);
  private readonly _i18n = inject(I18nService);
  protected readonly perm = inject(PermissionService);

  readonly routine = signal<Routine | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly showDeleteModal = signal(false);
  readonly showDuplicateToast = signal(false);
  readonly showAssignModal = signal(false);
  readonly assignEmail = signal('');
  readonly assignError = signal('');
  readonly assignSuccess = signal('');
  readonly assignSaving = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this._route.snapshot.paramMap.get('id');
    if (!id) {
      this.goBack();
      return;
    }
    try {
      const r = await this._routines.getById(id);
      if (!r) { this.error.set(true); return; }
      this.routine.set(r);
    } catch {
      this.error.set(true);
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

  async editRoutine(r: Routine): Promise<void> {
    const userId = this._auth.user()?.id;
    if (!userId) return;

    if (r.user_id !== userId && !this.perm.isStaffOrAbove()) {
      const copy = await this._routines.duplicate(r.id);
      if (copy) {
        await this._router.navigate(['/routines', copy.id, 'edit']);
      }
    } else {
      await this._router.navigate(['/routines', r.id, 'edit']);
    }
  }

  async doAssign(): Promise<void> {
    const r = this.routine();
    if (!r || !this.assignEmail()) return;
    this.assignSaving.set(true);
    this.assignError.set('');
    this.assignSuccess.set('');

    try {
      const users = await this._admin.getUsers();
      const match = users.find(u => u.email === this.assignEmail());
      if (!match) {
        this.assignError.set(this._i18n?.t('staff.userNotFound') ?? 'User not found');
        return;
      }
      const result = await this._assignments.assignRoutine(r.id, match.id);
      if (result.error) {
        this.assignError.set(result.error);
      } else {
        this.assignSuccess.set(this._i18n?.t('staff.assignSuccess') ?? 'Routine assigned!');
        this.assignEmail.set('');
      }
    } catch {
      this.assignError.set(this._i18n?.t('common.error') ?? 'An error occurred');
    } finally {
      this.assignSaving.set(false);
    }
  }
}
