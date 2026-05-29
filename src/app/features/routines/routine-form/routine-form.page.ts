import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiInput } from '@shared/ui/input';
import { RoutineService } from '@core/services/routine.service';
import { ExerciseService } from '@core/services/exercise.service';
import { SupabaseService } from '@core/services/supabase.service';
import { LucideArrowLeft, LucidePlus, LucideTrash2 } from '@lucide/angular';
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
    UiCard, UiButton, UiInput,
    LucideArrowLeft, LucidePlus, LucideTrash2,
  ],
  template: `
    <div class="p-4 space-y-4 max-w-lg mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button (click)="goBack()" class="p-2 rounded-xl hover:bg-surface-hover transition-colors">
          <svg lucideArrowLeft class="w-5 h-5" strokeWidth="2"></svg>
        </button>
        <h1 class="text-xl font-bold">{{ isEdit() ? 'Edit Routine' : 'New Routine' }}</h1>
      </div>

      <!-- Basic Info Card -->
      <app-ui-card variant="glass" title="Basic Info">
        <div class="space-y-4">
          <app-ui-input label="Name" [value]="name()" (valueChange)="name.set($event)" placeholder="e.g., Push Day" />
          <app-ui-input label="Description (optional)" [value]="description()" (valueChange)="description.set($event)" placeholder="Chest, shoulders, triceps" />
          <fieldset class="flex flex-col gap-1.5 border-0 p-0 m-0">
            <legend class="text-sm font-medium text-on-surface">Difficulty</legend>
            <div class="flex gap-2">
              @for (diff of difficulties; track diff) {
                <button
                  ui-button
                  [variant]="difficulty() === diff ? 'primary' : 'secondary'"
                  size="sm"
                  (click)="difficulty.set(diff)"
                >
                  {{ diff }}
                </button>
              }
            </div>
          </fieldset>
          <app-ui-input label="Estimated duration (min)" type="number" [value]="duration()" (valueChange)="duration.set($event)" placeholder="45" />
        </div>
      </app-ui-card>

      <!-- Exercises Card -->
      <app-ui-card variant="glass" title="Exercises">
        <div class="space-y-3">
          @if (exercises().length === 0) {
            <p class="text-sm text-on-surface-muted py-4 text-center">No exercises added yet. Pick from your list.</p>
          }

          @for (ex of exercises(); track ex; let i = $index) {
            <div class="flex items-start gap-3 p-3 rounded-xl bg-surface-hover">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium">{{ ex.exerciseName }}</p>
                <div class="flex items-center gap-2 mt-1.5">
                  <input
                    type="number"
                    [value]="ex.sets"
                    (input)="updateExercise(i, 'sets', +$event.target.value)"
                    class="w-14 px-2 py-1 rounded-lg bg-surface-input border border-white/10 text-xs text-center text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder="Sets"
                    min="1"
                  />
                  <input
                    type="number"
                    [value]="ex.reps"
                    (input)="updateExercise(i, 'reps', +$event.target.value)"
                    class="w-14 px-2 py-1 rounded-lg bg-surface-input border border-white/10 text-xs text-center text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder="Reps"
                    min="1"
                  />
                  <input
                    type="number"
                    [value]="ex.weight"
                    (input)="updateExercise(i, 'weight', +$event.target.value)"
                    class="w-16 px-2 py-1 rounded-lg bg-surface-input border border-white/10 text-xs text-center text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder="Kg"
                    min="0"
                    step="0.5"
                  />
                  <input
                    type="number"
                    [value]="ex.restTime"
                    (input)="updateExercise(i, 'restTime', +$event.target.value)"
                    class="w-14 px-2 py-1 rounded-lg bg-surface-input border border-white/10 text-xs text-center text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder="Rest"
                    min="0"
                  />
                </div>
                <div class="flex items-center gap-2 mt-1.5 text-[10px] text-on-surface-muted">
                  <span>Sets</span>
                  <span>Reps</span>
                  <span>Weight</span>
                  <span>Rest(s)</span>
                </div>
              </div>
              <button (click)="removeExercise(i)" class="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors shrink-0">
                <svg lucideTrash2 class="w-4 h-4" strokeWidth="2"></svg>
              </button>
            </div>
          }

          <!-- Add exercise picker -->
          <div class="flex gap-2">
            <select
              #exerciseSelect
              class="flex-1 px-3 py-2 rounded-xl bg-surface-input border border-white/10 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="" disabled selected>Select exercise...</option>
              @for (ex of availableExercises(); track ex.id) {
                <option [value]="ex.id">{{ ex.name }} ({{ ex.muscle_group }})</option>
              }
            </select>
            <button
              ui-button variant="secondary" size="sm"
              (click)="addExercise(exerciseSelect.value); exerciseSelect.value = ''"
              [disabled]="!exerciseSelect.value"
            >
              <svg lucidePlus class="w-4 h-4" strokeWidth="2.5"></svg>
            </button>
          </div>
        </div>
      </app-ui-card>

      <!-- Action Buttons -->
      <div class="flex gap-3">
        <button ui-button variant="ghost" size="md" class="flex-1" (click)="goBack()">Cancel</button>
        <button
          ui-button variant="primary" size="md" class="flex-1"
          [disabled]="saving() || !name()"
          (click)="save()"
        >
          {{ saving() ? 'Saving...' : isEdit() ? 'Update' : 'Create' }}
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
    await this._exercises.fetchAll();
    this.allExercises.set(this._exercises.exercises());
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
