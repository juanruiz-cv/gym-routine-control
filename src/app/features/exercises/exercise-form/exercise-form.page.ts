import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UiButton } from '@shared/ui/button';
import { UiInput } from '@shared/ui/input';
import { UiSelect, type SelectOption } from '@shared/ui/select';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { ExerciseService } from '@core/services/exercise.service';
import { LucideArrowLeft } from '@lucide/angular';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@shared/models';

@Component({
  selector: 'app-exercise-form-page',
  standalone: true,
  imports: [UiButton, UiInput, UiSelect, TranslatePipe, LucideArrowLeft],
  template: `
    <div class="p-4 space-y-4 max-w-lg mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button (click)="goBack()" class="p-2 rounded-xl hover:bg-surface-hover transition-colors">
          <svg lucideArrowLeft class="w-5 h-5" strokeWidth="2"></svg>
        </button>
        <h1 class="text-xl font-bold">{{ isEdit() ? ('exercises.editExercise' | translate) : ('exercises.newExercise' | translate) }}</h1>
      </div>

      <!-- Form -->
      <div class="space-y-4">
        <app-ui-input [label]="'exercises.name' | translate" [value]="name()" (valueChange)="name.set($event)" [placeholder]="'exercises.namePlaceholder' | translate" />

        <app-ui-select
          [label]="'exercises.muscleGroup' | translate"
          [placeholder]="'exercises.muscleGroupPlaceholder' | translate"
          [options]="muscleGroupOptions"
          [(value)]="muscleGroup"
        />

        <app-ui-select
          [label]="'exercises.equipment' | translate"
          [placeholder]="'exercises.equipmentNone' | translate"
          [options]="equipmentOptions"
          [(value)]="equipment"
        />

        <app-ui-input [label]="'exercises.category' | translate" [value]="category()" (valueChange)="category.set($event)" [placeholder]="'exercises.categoryPlaceholder' | translate" />

        <div class="flex flex-col gap-1.5">
          <label for="instructions" class="text-sm font-medium text-on-surface">{{ 'exercises.instructionsLabel' | translate }}</label>
          <textarea
            id="instructions"
            [value]="instructions()"
            (input)="instructions.set(($any($event.target)).value)"
            rows="4"
            class="w-full px-4 py-3 rounded-xl bg-surface-input border border-white/10 text-on-surface placeholder:text-on-surface-muted/50 focus:outline-none focus:ring-1 focus:ring-brand resize-none"
            [placeholder]="'exercises.instructionsPlaceholder' | translate"
          ></textarea>
        </div>

        <div class="flex gap-3 pt-2">
          <button ui-button variant="ghost" size="md" class="flex-1" (click)="goBack()">{{ 'common.cancel' | translate }}</button>
          <button
            ui-button variant="primary" size="md" class="flex-1"
            [disabled]="saving() || !name() || !muscleGroup()"
            (click)="save()"
          >
            {{ saving() ? ('common.saving' | translate) : isEdit() ? ('common.save' | translate) : ('exercises.create' | translate) }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ExerciseFormPage implements OnInit {
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _exercises = inject(ExerciseService);

  readonly muscleGroupOptions: SelectOption[] = MUSCLE_GROUPS.map(mg => ({ value: mg, label: mg }));
  readonly equipmentOptions: SelectOption[] = EQUIPMENT_TYPES.map(eq => ({ value: eq, label: eq }));

  readonly name = signal('');
  readonly muscleGroup = signal('');
  readonly equipment = signal('');
  readonly category = signal('');
  readonly instructions = signal('');
  readonly saving = signal(false);

  private _editId: string | null = null;

  readonly isEdit = computed(() => !!this._editId);

  async ngOnInit(): Promise<void> {
    const id = this._route.snapshot.paramMap.get('id');
    if (id) {
      this._editId = id;
      const ex = await this._exercises.getById(id);
      if (ex) {
        this.name.set(ex.name);
        this.muscleGroup.set(ex.muscle_group);
        this.equipment.set(ex.equipment ?? '');
        this.category.set(ex.category ?? '');
        this.instructions.set(ex.instructions ?? '');
      }
    }
  }

  async save(): Promise<void> {
    if (!this.name() || !this.muscleGroup()) return;
    this.saving.set(true);

    try {
      const payload = {
        name: this.name(),
        muscle_group: this.muscleGroup(),
        equipment: this.equipment() || null,
        category: this.category() || null,
        instructions: this.instructions() || null,
      };

      if (this._editId) {
        await this._exercises.update(this._editId, payload);
        await this._router.navigate(['/exercises', this._editId]);
      } else {
        const ex = await this._exercises.create(payload as Parameters<typeof this._exercises.create>[0]);
        await this._router.navigate(['/exercises', ex.id]);
      }
    } catch {
      this.saving.set(false);
    }
  }

  goBack(): void {
    this._router.navigate(['/exercises']);
  }
}
