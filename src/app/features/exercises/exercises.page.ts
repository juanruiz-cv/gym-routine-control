import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiBadge } from '@shared/ui/badge';
import { UiSkeletonListItem } from '@shared/ui';
import { UiInput } from '@shared/ui/input';
import { UiEmptyState } from '@shared/ui/empty-state';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { ExerciseService } from '@core/services/exercise.service';
import { LucidePlus, LucideDumbbell, LucideSearch } from '@lucide/angular';
import { MUSCLE_GROUPS } from '@shared/models';

@Component({
  selector: 'app-exercises-page',
  standalone: true,
  imports: [
    RouterLink, UiCard, UiButton, UiBadge, UiSkeletonListItem, UiInput, UiEmptyState, TranslatePipe,
    LucidePlus, LucideDumbbell, LucideSearch,
  ],
  template: `
    <div class="p-4 flex flex-col gap-4 max-w-lg mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold">{{ 'exercises.title' | translate }}</h1>
        <a ui-button variant="primary" size="sm" routerLink="/exercises/new">
          <svg lucidePlus class="w-4 h-4" strokeWidth="2.5"></svg>
          {{ 'exercises.new' | translate }}
        </a>
      </div>

      <!-- Search -->
      <app-ui-input
        [placeholder]="'exercises.search' | translate"
        [value]="searchQuery()"
        (valueChange)="searchQuery.set($event)"
        [hasIcon]="true"
      >
        <svg lucideSearch class="w-4 h-4" strokeWidth="2" icon></svg>
      </app-ui-input>

      <!-- Muscle Group Filter -->
      <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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

      <!-- Loading -->
      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (i of [1,2,3,4]; track i) {
            <app-ui-skeleton-list-item height="72px" />
          }
        </div>
      }

      <!-- Empty -->
      @if (!loading() && filteredExercises().length === 0 && !searchQuery() && !selectedMuscle()) {
        <app-ui-empty-state title="{{ 'exercises.empty' | translate }}" message="{{ 'exercises.emptyDesc' | translate }}">
          <a ui-button variant="primary" routerLink="/exercises/new">
            <svg lucidePlus class="w-4 h-4" strokeWidth="2.5"></svg>
            {{ 'exercises.create' | translate }}
          </a>
        </app-ui-empty-state>
      }

      <!-- No Results -->
      @if (!loading() && filteredExercises().length === 0 && (searchQuery() || selectedMuscle())) {
        <app-ui-empty-state title="{{ 'exercises.noResults' | translate }}" message="{{ 'exercises.noResultsDesc' | translate }}" />
      }

      <!-- Exercise List -->
      <div class="flex flex-col gap-2">
        @for (ex of filteredExercises(); track ex.id) {
          <a routerLink="/exercises/{{ ex.id }}">
            <app-ui-card variant="glass" [padding]="true">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center shrink-0">
                  <svg lucideDumbbell class="w-5 h-5 text-on-surface-muted" strokeWidth="1.5"></svg>
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
          </a>
        }
      </div>
    </div>
  `,
})
export class ExercisesPage implements OnInit {
  private readonly _exercises = inject(ExerciseService);

  readonly muscleGroups = MUSCLE_GROUPS;
  readonly searchQuery = signal('');
  readonly selectedMuscle = signal('');

  readonly exercises = this._exercises.exercises;
  readonly loading = this._exercises.loading;

  readonly filteredExercises = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const muscle = this.selectedMuscle();
    return this.exercises().filter(ex => {
      if (muscle && ex.muscle_group !== muscle) return false;
      if (q && !ex.name.toLowerCase().includes(q) && !ex.muscle_group.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  async ngOnInit(): Promise<void> {
    await this._exercises.fetchAll();
  }
}
