import { Component, inject, input, output, signal, computed, OnInit } from '@angular/core';
import { UiModal } from '@shared/ui/modal';
import { UiInput } from '@shared/ui/input';
import { UiButton } from '@shared/ui/button';
import { UiCard } from '@shared/ui/card';
import { UiBadge } from '@shared/ui/badge';
import { UiEmptyState } from '@shared/ui/empty-state';
import { UiSkeletonCard } from '@shared/ui';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { ExerciseService } from '@core/services/exercise.service';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@shared/models';
import { LucideSearch, LucideDumbbell } from '@lucide/angular';
import type { Exercise } from '@shared/models';

@Component({
  selector: 'app-exercise-picker',
  standalone: true,
  imports: [
    UiModal, UiInput, UiButton, UiCard, UiBadge, UiEmptyState, UiSkeletonCard,
    TranslatePipe,
    LucideSearch, LucideDumbbell,
  ],
  template: `
    <app-ui-modal [isOpen]="isOpen()" [title]="'routines.selectExercise' | translate" (closed)="closed.emit()">
      <!-- Search -->
      <app-ui-input
        [placeholder]="'exercises.search' | translate"
        [value]="searchQuery()"
        (valueChange)="searchQuery.set($event)"
        [hasIcon]="true"
      >
        <svg lucideSearch class="w-4 h-4" strokeWidth="2" icon aria-hidden="true"></svg>
      </app-ui-input>

      <!-- Muscle Group Filter -->
      <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none mt-3">
        <button
          ui-button [variant]="selectedMuscle() === '' ? 'primary' : 'secondary'" size="sm"
          class="shrink-0" (click)="selectedMuscle.set('')"
        >{{ 'exercises.all' | translate }}</button>
        @for (mg of muscleGroups; track mg) {
          <button
            ui-button [variant]="selectedMuscle() === mg ? 'primary' : 'secondary'" size="sm"
            class="shrink-0" (click)="selectedMuscle.set(mg)"
          >{{ mg }}</button>
        }
      </div>

      <!-- Equipment Filter -->
      <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none mt-2">
        @for (eq of equipmentTypes; track eq) {
          <button
            ui-button [variant]="selectedEquipment() === eq ? 'primary' : 'secondary'" size="sm"
            class="shrink-0" (click)="selectedEquipment.set(eq)"
          >{{ eq }}</button>
        }
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex flex-col gap-3 mt-4">
          @for (i of [1,2,3]; track i) {
            <app-ui-skeleton-card height="64px" />
          }
        </div>
      }

      <!-- Empty -->
      @if (!loading() && filteredExercises().length === 0) {
        <div class="mt-4">
          <app-ui-empty-state
            variant="search"
            [title]="(searchQuery() || selectedMuscle() || selectedEquipment()) ? ('common.noResults' | translate) : ('exercises.empty' | translate)"
            [message]="(searchQuery() || selectedMuscle() || selectedEquipment()) ? ('exercises.noResultsDesc' | translate) : ('exercises.emptyDesc' | translate)"
          />
        </div>
      }

      <!-- Exercise List -->
      @if (!loading() && filteredExercises().length > 0) {
        <div class="flex flex-col gap-2 mt-4 max-h-72 overflow-y-auto">
          @for (ex of filteredExercises(); track ex.id) {
            <button class="w-full text-left" (click)="selectExercise(ex)">
              <app-ui-card variant="glass" [padding]="true">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center shrink-0">
                    <svg lucideDumbbell class="w-5 h-5 text-on-surface-muted" strokeWidth="1.5" aria-hidden="true"></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ ex.name }}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                      <app-ui-badge size="sm">{{ ex.muscle_group }}</app-ui-badge>
                      @if (ex.equipment) {
                        <span class="text-xs text-on-surface-muted">{{ ex.equipment }}</span>
                      }
                    </div>
                  </div>
                </div>
              </app-ui-card>
            </button>
          }
        </div>
      }
    </app-ui-modal>
  `,
})
export class ExercisePicker implements OnInit {
  private readonly _exercises = inject(ExerciseService);

  readonly isOpen = input(false);
  readonly excludeIds = input<string[]>([]);

  readonly selected = output<Exercise>();
  readonly closed = output<void>();

  readonly muscleGroups = MUSCLE_GROUPS;
  readonly equipmentTypes = EQUIPMENT_TYPES;

  readonly searchQuery = signal('');
  readonly selectedMuscle = signal('');
  readonly selectedEquipment = signal('');
  readonly loading = signal(false);

  private readonly _allExercises = signal<Exercise[]>([]);

  readonly filteredExercises = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const muscle = this.selectedMuscle();
    const equipment = this.selectedEquipment();
    const exclude = this.excludeIds();
    return this._allExercises().filter(ex => {
      if (exclude.includes(ex.id)) return false;
      if (muscle && ex.muscle_group !== muscle) return false;
      if (equipment && (ex.equipment ?? '') !== equipment) return false;
      if (q && !ex.name.toLowerCase().includes(q) && !ex.muscle_group.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      await this._exercises.fetchAll();
      this._allExercises.set(this._exercises.exercises());
    } catch {
      this._allExercises.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  protected selectExercise(ex: Exercise): void {
    this.selected.emit(ex);
  }
}
