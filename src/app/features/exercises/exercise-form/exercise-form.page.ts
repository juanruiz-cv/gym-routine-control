import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UiButton } from '@shared/ui/button';
import { UiInput } from '@shared/ui/input';
import { ExerciseService } from '@core/services/exercise.service';
import { LucideArrowLeft } from '@lucide/angular';
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@shared/models';

@Component({
  selector: 'app-exercise-form-page',
  standalone: true,
  imports: [UiButton, UiInput, LucideArrowLeft],
  template: `
    <div class="p-4 space-y-4 max-w-lg mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button (click)="goBack()" class="p-2 rounded-xl hover:bg-surface-hover transition-colors">
          <svg lucideArrowLeft class="w-5 h-5" strokeWidth="2"></svg>
        </button>
        <h1 class="text-xl font-bold">{{ isEdit() ? 'Edit Exercise' : 'New Exercise' }}</h1>
      </div>

      <!-- Form -->
      <div class="space-y-4">
        <app-ui-input label="Name" [value]="name()" (valueChange)="name.set($event)" placeholder="e.g., Bench Press" />

        <div class="flex flex-col gap-1.5">
          <label for="muscleGroup" class="text-sm font-medium text-on-surface">Muscle Group</label>
          <select
            id="muscleGroup"
            [value]="muscleGroup()"
            (change)="muscleGroup.set(($any($event.target)).value)"
            class="w-full px-4 py-3 rounded-xl bg-surface-input border border-white/10 text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="" disabled>Select muscle group...</option>
            @for (mg of muscleGroups; track mg) {
              <option [value]="mg">{{ mg }}</option>
            }
          </select>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="equipment" class="text-sm font-medium text-on-surface">Equipment (optional)</label>
          <select
            id="equipment"
            [value]="equipment()"
            (change)="equipment.set(($any($event.target)).value)"
            class="w-full px-4 py-3 rounded-xl bg-surface-input border border-white/10 text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="">None</option>
            @for (eq of equipmentTypes; track eq) {
              <option [value]="eq">{{ eq }}</option>
            }
          </select>
        </div>

        <app-ui-input label="Category (optional)" [value]="category()" (valueChange)="category.set($event)" placeholder="e.g., Strength, Hypertrophy" />

        <div class="flex flex-col gap-1.5">
          <label for="instructions" class="text-sm font-medium text-on-surface">Instructions (optional)</label>
          <textarea
            id="instructions"
            [value]="instructions()"
            (input)="instructions.set(($any($event.target)).value)"
            rows="4"
            class="w-full px-4 py-3 rounded-xl bg-surface-input border border-white/10 text-on-surface placeholder:text-on-surface-muted/50 focus:outline-none focus:ring-1 focus:ring-brand resize-none"
            placeholder="Describe how to perform this exercise..."
          ></textarea>
        </div>

        <div class="flex gap-3 pt-2">
          <button ui-button variant="ghost" size="md" class="flex-1" (click)="goBack()">Cancel</button>
          <button
            ui-button variant="primary" size="md" class="flex-1"
            [disabled]="saving() || !name() || !muscleGroup()"
            (click)="save()"
          >
            {{ saving() ? 'Saving...' : isEdit() ? 'Update' : 'Create' }}
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

  readonly muscleGroups = MUSCLE_GROUPS;
  readonly equipmentTypes = EQUIPMENT_TYPES;

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
