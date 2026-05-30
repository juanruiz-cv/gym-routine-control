import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UiButton } from '@shared/ui/button';
import { UiInput } from '@shared/ui/input';
import { UiSelect, type SelectOption } from '@shared/ui/select';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { I18nService } from '@shared/i18n/i18n.service';
import { ExerciseService } from '@core/services/exercise.service';
import { MuscleGroupService } from '@core/services/muscle-group.service';
import { EquipmentService } from '@core/services/equipment.service';
import { PermissionService } from '@core/services/permission.service';
import { LucideArrowLeft, LucideGlobe } from '@lucide/angular';

@Component({
  selector: 'app-exercise-form-page',
  standalone: true,
  imports: [UiButton, UiInput, UiSelect, TranslatePipe, LucideArrowLeft, LucideGlobe],
  template: `
    <div class="p-4 space-y-4 max-w-lg mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button (click)="goBack()" class="p-2 rounded-xl hover:bg-surface-hover transition-colors">
          <svg lucideArrowLeft class="w-5 h-5" strokeWidth="2" aria-hidden="true"></svg>
        </button>
        <h1 class="text-xl font-bold">{{ isEdit() ? ('exercises.editExercise' | translate) : ('exercises.newExercise' | translate) }}</h1>
      </div>

      <!-- Form -->
      <div class="space-y-4">
        <app-ui-input [label]="'exercises.name' | translate" [value]="name()" (valueChange)="name.set($event)" [placeholder]="'exercises.namePlaceholder' | translate" />

        <app-ui-select
          [label]="'exercises.muscleGroup' | translate"
          [placeholder]="'exercises.muscleGroupPlaceholder' | translate"
          [options]="muscleGroupOptions()"
          [(value)]="muscleGroup"
        />

        <app-ui-select
          [label]="'exercises.equipment' | translate"
          [placeholder]="'exercises.equipmentNone' | translate"
          [options]="equipmentOptions()"
          [(value)]="equipment"
        />

        <app-ui-input [label]="'exercises.category' | translate" [value]="category()" (valueChange)="category.set($event)" [placeholder]="'exercises.categoryPlaceholder' | translate" />

        @if (perm.canCreateGlobalExercises()) {
          <div class="flex items-center gap-3 p-3 rounded-xl bg-surface-hover cursor-pointer select-none" role="group" [attr.aria-label]="'exercises.isGlobal' | translate">
            <div class="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <svg lucideGlobe class="w-5 h-5 text-accent" strokeWidth="1.5" aria-hidden="true"></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium">{{ 'exercises.isGlobal' | translate }}</p>
              <p class="text-xs text-on-surface-muted">{{ 'exercises.isGlobalDesc' | translate }}</p>
            </div>
            <button
              type="button" role="switch"
              [attr.aria-checked]="isGlobal()"
              (click)="isGlobal.set(!isGlobal())"
              class="relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0"
              [class.bg-brand]="isGlobal()"
              [class.bg-white/10]="!isGlobal()"
            >
              <div
                class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                [style.transform]="isGlobal() ? 'translateX(24px)' : 'translateX(0)'"
              ></div>
            </button>
          </div>
        }

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
  private readonly _muscleGroups = inject(MuscleGroupService);
  private readonly _equipment = inject(EquipmentService);
  private readonly _i18n = inject(I18nService);
  protected readonly perm = inject(PermissionService);

  readonly muscleGroupOptions = computed<SelectOption[]>(() =>
    this._muscleGroups.groups().filter(g => g.is_active).map(mg => ({ value: mg.name, label: this._i18n.t('muscleGroup.' + mg.name) }))
  );
  readonly equipmentOptions = computed<SelectOption[]>(() =>
    this._equipment.types().filter(t => t.is_active).map(eq => ({ value: eq.name, label: this._i18n.t('equipment.' + eq.name) }))
  );

  readonly name = signal('');
  readonly muscleGroup = signal('');
  readonly equipment = signal('');
  readonly category = signal('');
  readonly instructions = signal('');
  readonly isGlobal = signal(false);
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
        this.isGlobal.set(ex.is_global);
      }
    }
    await Promise.all([
      this._muscleGroups.fetchAll(),
      this._equipment.fetchAll(),
    ]);
  }

  async save(): Promise<void> {
    if (!this.name() || !this.muscleGroup()) return;
    this.saving.set(true);

    try {
      const payload: Record<string, unknown> = {
        name: this.name(),
        muscle_group: this.muscleGroup(),
        equipment: this.equipment() || null,
        category: this.category() || null,
        instructions: this.instructions() || null,
      };
      if (this.perm.canCreateGlobalExercises()) {
        payload['is_global'] = this.isGlobal();
      }

      if (this._editId) {
        await this._exercises.update(this._editId, payload);
        await this._router.navigate(['/exercises', this._editId]);
      } else {
        const ex = await this._exercises.create(payload as unknown as Parameters<typeof this._exercises.create>[0]);
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
