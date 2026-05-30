import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiInput } from '@shared/ui/input';
import { UiBadge } from '@shared/ui/badge';
import { UiModal } from '@shared/ui/modal';
import { UiSkeletonListItem } from '@shared/ui';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { MuscleGroupService } from '@core/services/muscle-group.service';
import { PermissionService } from '@core/services/permission.service';
import { LucidePlus, LucidePencil, LucideToggleLeft, LucideToggleRight, LucideTrash2, LucideSearch, LucideAlertTriangle } from '@lucide/angular';
import type { MuscleGroupEntity } from '@shared/models';

@Component({
  selector: 'app-staff-muscle-groups',
  standalone: true,
  imports: [UiCard, UiButton, UiInput, UiBadge, UiModal, UiSkeletonListItem, TranslatePipe,
    LucidePlus, LucidePencil, LucideToggleLeft, LucideToggleRight, LucideTrash2, LucideSearch, LucideAlertTriangle],
  template: `
    <div class="p-4 space-y-4 max-w-lg mx-auto">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold">{{ 'staff.muscleGroups' | translate }}</h1>
        <button ui-button variant="primary" size="sm" (click)="startAdd()">
          <svg lucidePlus class="w-4 h-4" strokeWidth="2.5" aria-hidden="true"></svg>
          {{ 'staff.add' | translate }}
        </button>
      </div>

      <app-ui-input
        [placeholder]="'common.search' | translate"
        [value]="searchQuery()"
        (valueChange)="searchQuery.set($event)"
        [hasIcon]="true"
      >
        <svg lucideSearch class="w-4 h-4" strokeWidth="2" icon aria-hidden="true"></svg>
      </app-ui-input>

      @if (error()) {
        <p class="text-sm text-error flex items-center gap-1.5">
          <svg lucideAlertTriangle class="w-4 h-4 shrink-0" strokeWidth="2" aria-hidden="true"></svg>
          {{ error() }}
        </p>
      }

      <!-- Inline add form -->
      @if (adding()) {
        <div class="flex items-center gap-2 p-3 rounded-xl bg-surface-elevated">
          <input
            #addInput
            type="text"
            [value]="newName()"
            (input)="newName.set(($any($event.target)).value)"
            (keydown.enter)="saveAdd()"
            (keydown.escape)="cancelAdd()"
            class="flex-1 px-3 py-2 rounded-lg bg-surface-input border border-white/10 text-sm text-on-surface placeholder:text-on-surface-muted/50 focus:outline-none focus:ring-1 focus:ring-brand"
            [placeholder]="'staff.muscleGroupName' | translate"
          />
          <button ui-button variant="primary" size="sm" (click)="saveAdd()" [disabled]="saving() || !newName()">
            {{ 'common.save' | translate }}
          </button>
          <button ui-button variant="ghost" size="sm" (click)="cancelAdd()">
            {{ 'common.cancel' | translate }}
          </button>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (i of [1,2,3,4]; track i) {
            <app-ui-skeleton-list-item height="56px" />
          }
        </div>
      }

      <!-- List -->
      <div class="flex flex-col gap-2">
        @for (mg of filteredGroups(); track mg.id) {
          <app-ui-card variant="glass" [padding]="true">
            <div class="flex items-center gap-3">
              <div class="flex-1 min-w-0">
                @if (editingId() === mg.id) {
                  <input
                    type="text"
                    [value]="editName()"
                    (input)="editName.set(($any($event.target)).value)"
                    (keydown.enter)="saveEdit(mg.id)"
                    (keydown.escape)="cancelEdit()"
                    class="w-full px-3 py-1.5 rounded-lg bg-surface-input border border-white/10 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                } @else {
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium">{{ mg.name }}</p>
                    <app-ui-badge [size]="'sm'" [variant]="mg.is_active ? 'brand' : 'default'">
                      {{ mg.is_active ? ('staff.active' | translate) : ('staff.inactive' | translate) }}
                    </app-ui-badge>
                  </div>
                }
              </div>
              <div class="flex items-center gap-1 shrink-0">
                @if (editingId() === mg.id) {
                  <button ui-button variant="primary" size="sm" (click)="saveEdit(mg.id)" [disabled]="saving() || !editName()">
                    {{ 'common.save' | translate }}
                  </button>
                  <button ui-button variant="ghost" size="sm" (click)="cancelEdit()">
                    {{ 'common.cancel' | translate }}
                  </button>
                } @else {
                  <button ui-button variant="ghost" size="sm" (click)="startEdit(mg)" [title]="'common.edit' | translate">
                    <svg lucidePencil class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
                  </button>
                  <button ui-button variant="ghost" size="sm" (click)="toggleActive(mg.id)" [disabled]="saving()"
                    [title]="mg.is_active ? ('staff.deactivate' | translate) : ('staff.activate' | translate)">
                    @if (mg.is_active) {
                      <svg lucideToggleRight class="w-5 h-5 text-brand" strokeWidth="2" aria-hidden="true"></svg>
                    } @else {
                      <svg lucideToggleLeft class="w-5 h-5 text-on-surface-muted" strokeWidth="2" aria-hidden="true"></svg>
                    }
                  </button>
                  <button ui-button variant="ghost" size="sm" (click)="openDelete(mg)" [disabled]="saving()"
                    [title]="'common.delete' | translate">
                    <svg lucideTrash2 class="w-4 h-4 text-error" strokeWidth="2" aria-hidden="true"></svg>
                  </button>
                }
              </div>
            </div>
          </app-ui-card>
        } @empty {
          <p class="text-center text-on-surface-muted text-sm py-8">{{ 'common.noResults' | translate }}</p>
        }
      </div>
    </div>

    <app-ui-modal [isOpen]="deleteModalOpen()" [title]="'staff.deleteMuscleGroup' | translate" (closed)="cancelDelete()">
      <p class="text-sm text-on-surface-secondary mb-4">
        {{ 'staff.deleteMuscleGroupMessage' | translate: { name: deleteTarget()?.name ?? '' } }}
      </p>
      <div class="flex gap-2">
        <button ui-button variant="danger" class="flex-1" (click)="confirmDelete()" [disabled]="saving()">
          {{ 'common.delete' | translate }}
        </button>
        <button ui-button variant="secondary" class="flex-1" (click)="cancelDelete()" [disabled]="saving()">
          {{ 'common.cancel' | translate }}
        </button>
      </div>
    </app-ui-modal>
  `,
})
export class StaffMuscleGroupsPage implements OnInit {
  private readonly _service = inject(MuscleGroupService);
  protected readonly perm = inject(PermissionService);

  readonly searchQuery = signal('');
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);

  readonly adding = signal(false);
  readonly newName = signal('');

  readonly editingId = signal<string | null>(null);
  readonly editName = signal('');

  readonly deleteModalOpen = signal(false);
  readonly deleteTarget = signal<MuscleGroupEntity | null>(null);

  readonly groups = this._service.groups;
  readonly loading = this._service.loading;

  readonly filteredGroups = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.groups();
    return this.groups().filter(g => g.name.toLowerCase().includes(q));
  });

  async ngOnInit(): Promise<void> {
    await this._service.fetchAll();
  }

  async toggleActive(id: string): Promise<void> {
    this.error.set(null);
    this.saving.set(true);
    try {
      await this._service.toggleActive(id);
    } catch {
      this.error.set('staff.toggleError' in {} ? 'Failed to toggle' : 'Failed to toggle');
    } finally {
      this.saving.set(false);
    }
  }

  startAdd(): void {
    this.adding.set(true);
    this.newName.set('');
  }

  cancelAdd(): void {
    this.adding.set(false);
    this.newName.set('');
  }

  async saveAdd(): Promise<void> {
    if (!this.newName()) return;
    this.error.set(null);
    this.saving.set(true);
    try {
      await this._service.create(this.newName());
      this.adding.set(false);
      this.newName.set('');
    } catch {
      this.error.set('Failed to create');
    } finally {
      this.saving.set(false);
    }
  }

  startEdit(mg: MuscleGroupEntity): void {
    this.editingId.set(mg.id);
    this.editName.set(mg.name);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editName.set('');
  }

  async saveEdit(id: string): Promise<void> {
    if (!this.editName()) return;
    this.error.set(null);
    this.saving.set(true);
    try {
      await this._service.updateName(id, this.editName());
      this.editingId.set(null);
      this.editName.set('');
    } catch {
      this.error.set('Failed to update');
    } finally {
      this.saving.set(false);
    }
  }

  openDelete(mg: MuscleGroupEntity): void {
    this.deleteTarget.set(mg);
    this.deleteModalOpen.set(true);
  }

  cancelDelete(): void {
    this.deleteModalOpen.set(false);
    this.deleteTarget.set(null);
  }

  async confirmDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleteModalOpen.set(false);
    this.deleteTarget.set(null);
    this.error.set(null);
    this.saving.set(true);
    try {
      await this._service.delete(target.id);
    } catch {
      this.error.set('Failed to delete');
    } finally {
      this.saving.set(false);
    }
  }
}
