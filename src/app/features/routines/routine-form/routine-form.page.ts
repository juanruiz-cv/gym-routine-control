import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiInput } from '@shared/ui/input';
import { UiSkeletonCard } from '@shared/ui';
import { UiEmptyState } from '@shared/ui/empty-state';
import { ExercisePicker } from '@features/exercises/exercise-picker/exercise-picker.component';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { RoutineService } from '@core/services/routine.service';
import { ExerciseService } from '@core/services/exercise.service';
import { SupabaseService } from '@core/services/supabase.service';
import { LucideArrowLeft, LucidePlus, LucideTrash2, LucideRotateCw, LucideAlertCircle } from '@lucide/angular';
import type { Exercise, Difficulty } from '@shared/models';

interface ExerciseEntry {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number | null;
  weight: number | null;
  restTime: number;
}

@Component({
  selector: 'app-routine-form-page',
  standalone: true,
  imports: [
    UiCard, UiButton, UiInput, UiSkeletonCard, UiEmptyState, ExercisePicker, TranslatePipe,
    LucideArrowLeft, LucidePlus, LucideTrash2, LucideRotateCw, LucideAlertCircle,
  ],
  template: `
    <div class="p-4 flex flex-col gap-4 max-w-lg mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button (click)="goBack()" class="p-2 rounded-xl hover:bg-surface-hover transition-colors">
          <svg lucideArrowLeft class="w-5 h-5" strokeWidth="2" aria-hidden="true"></svg>
        </button>
        <h1 class="text-xl font-bold">{{ isEdit() ? ('routines.editRoutine' | translate) : ('routines.newRoutine' | translate) }}</h1>
      </div>

      <!-- Basic Info Card -->
      <app-ui-card variant="glass" [title]="'routines.basicInfo' | translate">
        <div class="flex flex-col gap-4">
          <app-ui-input [label]="'routines.name' | translate" [value]="name()" (valueChange)="name.set($event)" [placeholder]="'routines.namePlaceholder' | translate" />
          <app-ui-input [label]="'routines.description' | translate" [value]="description()" (valueChange)="description.set($event)" [placeholder]="'routines.descriptionPlaceholder' | translate" />
          <fieldset class="flex flex-col gap-1.5 border-0 p-0 m-0">
            <legend class="text-sm font-medium text-on-surface">{{ 'routines.difficulty' | translate }}</legend>
            <div class="flex gap-2">
              @for (diff of difficulties; track diff) {
                <button
                  ui-button
                  [variant]="difficulty() === diff ? 'primary' : 'secondary'"
                  size="sm"
                  (click)="difficulty.set(diff)"
                >
                  {{ diff | translate }}
                </button>
              }
            </div>
          </fieldset>
          <app-ui-input [label]="'routines.estimatedDuration' | translate" type="number" [value]="duration()" (valueChange)="duration.set($event)" placeholder="45" />
        </div>
      </app-ui-card>

      <!-- Exercises Card -->
      <app-ui-card variant="glass" [title]="'routines.exercisesForm' | translate">
        <div class="space-y-3">
          <!-- Loading exercises -->
          @if (exercisesStatus() === 'loading') {
            <div class="flex flex-col gap-3 py-4">
              @for (i of [1,2]; track i) {
                <app-ui-skeleton-card height="64px" />
              }
            </div>
          }

          <!-- Error loading exercises -->
          @if (exercisesStatus() === 'error') {
            <div class="flex flex-col items-center py-8 text-center">
              <svg lucideAlertCircle class="w-10 h-10 text-error mb-2" strokeWidth="1.5" aria-hidden="true"></svg>
              <p class="text-sm text-on-surface-muted">{{ 'common.errorDesc' | translate }}</p>
              <button ui-button variant="secondary" size="sm" class="mt-3" (click)="retryLoadExercises()">
                <svg lucideRotateCw class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
                {{ 'common.retry' | translate }}
              </button>
            </div>
          }

          <!-- No exercises in DB -->
          @if (exercisesStatus() === 'empty') {
            <app-ui-empty-state
              variant="exercise"
              title="{{ 'routines.noExercisesDb' | translate }}"
              message="{{ 'routines.noExercisesDbDesc' | translate }}"
              [primaryAction]="{ label: ('routines.createExercise' | translate), routerLink: '/exercises/new', variant: 'primary' }"
            />
          }

          <!-- Exercises list (only when exercisesStatus is success and exercises loaded) -->
          @if (exercisesStatus() === 'success') {
            @if (exercises().length === 0) {
              <p class="text-sm text-on-surface-muted py-4 text-center">{{ 'routines.noExercisesAdded' | translate }}</p>
            }

            @for (ex of exercises(); track ex; let i = $index) {
              <div class="flex items-start gap-3 p-3 rounded-xl bg-surface-hover">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">{{ ex.exerciseName }}</p>
                  <div class="flex items-center gap-2 mt-1.5">
                    <input
                      type="number"
                      [value]="ex.sets"
                      (input)="updateExercise(i, 'sets', +$any($event.target).value)"
                      class="w-14 px-2 py-1 rounded-lg bg-surface-input border border-white/10 text-xs text-center text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
                      [placeholder]="'routines.sets' | translate"
                      min="1"
                    />
                    <input
                      type="number"
                      [value]="ex.reps"
                      (input)="updateExercise(i, 'reps', +$any($event.target).value)"
                      class="w-14 px-2 py-1 rounded-lg bg-surface-input border border-white/10 text-xs text-center text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
                      [placeholder]="'routines.reps' | translate"
                      min="1"
                    />
                    <input
                      type="number"
                      [value]="ex.weight"
                      (input)="updateExercise(i, 'weight', +$any($event.target).value)"
                      class="w-16 px-2 py-1 rounded-lg bg-surface-input border border-white/10 text-xs text-center text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
                      [placeholder]="'routines.kg' | translate"
                      min="0"
                      step="0.5"
                    />
                    <input
                      type="number"
                      [value]="ex.restTime"
                      (input)="updateExercise(i, 'restTime', +$any($event.target).value)"
                      class="w-14 px-2 py-1 rounded-lg bg-surface-input border border-white/10 text-xs text-center text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
                      [placeholder]="'common.cancel' | translate"
                      min="0"
                    />
                  </div>
                  <div class="flex items-center gap-2 mt-1.5 text-[10px] text-on-surface-muted">
                    <span>{{ 'routines.sets' | translate }}</span>
                    <span>{{ 'routines.reps' | translate }}</span>
                    <span>{{ 'routines.kg' | translate }}</span>
                    <span>{{ 'common.cancel' | translate }}</span>
                  </div>
                </div>
                <button (click)="removeExercise(i)" class="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors shrink-0">
                  <svg lucideTrash2 class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
                </button>
              </div>
            }

            <!-- Add exercise picker (only when exercises exist) -->
            @if (allExercises().length > 0) {
              <button
                ui-button variant="secondary" size="md" class="w-full"
                (click)="showPicker.set(true)"
              >
                <svg lucidePlus class="w-4 h-4" strokeWidth="2.5" aria-hidden="true"></svg>
                {{ 'routines.selectExercise' | translate }}
              </button>
            }
          }
        </div>
      </app-ui-card>

      <!-- Exercise Picker Modal -->
      <app-exercise-picker
        [isOpen]="showPicker()"
        [excludeIds]="pickerExcludeIds()"
        (selected)="onExercisePicked($event)"
        (closed)="showPicker.set(false)"
      />

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button ui-button variant="ghost" size="md" class="flex-1" (click)="goBack()">{{ 'routines.cancel' | translate }}</button>
        <button
          ui-button variant="primary" size="md" class="flex-1"
          [disabled]="saving() || !name()"
          (click)="save()"
        >
          {{ saving() ? ('routines.saving' | translate) : isEdit() ? ('routines.update' | translate) : ('routines.create_' | translate) }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    input[type="number"]::-webkit-inner-spin-button { opacity: 1; }
  `],
})
export class RoutineFormPage implements OnInit {
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _routines = inject(RoutineService);
  private readonly _exercises = inject(ExerciseService);
  private readonly _supabase = inject(SupabaseService);

  readonly difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

  readonly name = signal('');
  readonly description = signal('');
  readonly difficulty = signal<Difficulty>('beginner');
  readonly duration = signal('');
  readonly exercises = signal<ExerciseEntry[]>([]);
  readonly saving = signal(false);
  readonly allExercises = signal<Exercise[]>([]);
  readonly exercisesStatus = signal<'loading' | 'success' | 'empty' | 'error'>('loading');
  readonly showPicker = signal(false);

  readonly pickerExcludeIds = computed(() =>
    this.exercises().map(e => e.exerciseId)
  );

  readonly availableExercises = computed(() =>
    this.allExercises().filter(ex => !this.exercises().some(e => e.exerciseId === ex.id))
  );

  private _editId: string | null = null;

  readonly isEdit = computed(() => !!this._editId);

  async ngOnInit(): Promise<void> {
    const id = this._route.snapshot.paramMap.get('id');
    if (id) {
      this._editId = id;
      const routine = await this._routines.getById(id);
      if (routine) {
        this.name.set(routine.name);
        this.description.set(routine.description ?? '');
        this.difficulty.set(routine.difficulty);
        this.duration.set(routine.estimated_duration?.toString() ?? '');
        if (routine.routine_exercises) {
          this.exercises.set(routine.routine_exercises.map(re => ({
            exerciseId: re.exercise_id,
            exerciseName: re.exercise?.name ?? 'Unknown',
            sets: re.sets,
            reps: re.reps,
            weight: re.weight,
            restTime: re.rest_time,
          })));
        }
      }
    }
    await this._loadExercises();
  }

  private async _loadExercises(): Promise<void> {
    this.exercisesStatus.set('loading');
    try {
      await this._exercises.fetchAll();
      const list = this._exercises.exercises();
      this.allExercises.set(list);
      this.exercisesStatus.set(list.length === 0 ? 'empty' : 'success');
    } catch {
      this.exercisesStatus.set('error');
    }
  }

  async retryLoadExercises(): Promise<void> {
    await this._loadExercises();
  }

  protected onExercisePicked(ex: Exercise): void {
    this.showPicker.set(false);
    this.addExercise(ex.id);
  }

  addExercise(exerciseId: string): void {
    const exercise = this.allExercises().find(e => e.id === exerciseId);
    if (!exercise) return;
    this.exercises.update(e => [...e, {
      exerciseId,
      exerciseName: exercise.name,
      sets: 3,
      reps: 10,
      weight: null,
      restTime: 60,
    }]);
  }

  removeExercise(index: number): void {
    this.exercises.update(e => e.filter((_, i) => i !== index));
  }

  updateExercise(index: number, field: keyof ExerciseEntry, value: number): void {
    this.exercises.update(e => e.map((ex, i) =>
      i === index ? { ...ex, [field]: isNaN(value) ? 0 : value } : ex
    ));
  }

  async save(): Promise<void> {
    if (!this.name()) return;
    this.saving.set(true);

    try {
      if (this._editId) {
        await this._routines.update(this._editId, {
          name: this.name(),
          description: this.description() || null,
          difficulty: this.difficulty(),
          estimated_duration: this.duration() ? parseInt(this.duration()) : null,
        });
        await this._router.navigate(['/routines', this._editId]);
      } else {
        const routine = await this._routines.create({
          name: this.name(),
          description: this.description() || null,
          difficulty: this.difficulty(),
          estimated_duration: this.duration() ? parseInt(this.duration()) : null,
          is_favorite: false,
          is_template: false,
        });

        if (this.exercises().length > 0) {
          const routineExs = this.exercises().map((ex, i) => ({
            routine_id: routine.id,
            exercise_id: ex.exerciseId,
            sort_order: i,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            rest_time: ex.restTime,
          }));
          await this._supabase.client.from('routine_exercises').insert(routineExs);
        }

        await this._router.navigate(['/routines', routine.id]);
      }
    } catch {
      this.saving.set(false);
    }
  }

  goBack(): void {
    this._router.navigate(['/routines']);
  }
}
