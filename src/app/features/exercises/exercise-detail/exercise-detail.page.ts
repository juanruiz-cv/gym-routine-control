import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiBadge } from '@shared/ui/badge';
import { UiSkeletonCard } from '@shared/ui';
import { UiModal } from '@shared/ui/modal';
import { UiEmptyState } from '@shared/ui/empty-state';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { MetricsService } from '@core/services/metrics.service';
import { ExerciseService } from '@core/services/exercise.service';
import { LucideArrowLeft, LucidePencil, LucideTrash2, LucideTrophy } from '@lucide/angular';
import { RelativeDatePipe } from '@shared/pipes/relative-date';
import type { Exercise, PersonalRecord } from '@shared/models';

@Component({
  selector: 'app-exercise-detail-page',
  standalone: true,
  imports: [
    RouterLink, UiCard, UiButton, UiBadge, UiSkeletonCard, UiModal, UiEmptyState,
    RelativeDatePipe, TranslatePipe,
    LucideArrowLeft, LucidePencil, LucideTrash2, LucideTrophy,
  ],
  template: `
    <div class="p-4 flex flex-col gap-4 max-w-lg mx-auto">
      <!-- Loading -->
      @if (loading()) {
        <div class="flex flex-col gap-4">
          @for (i of [1,2,3]; track i) {
            <app-ui-skeleton-card height="80px" />
          }
        </div>
      }

      @if (exercise(); as ex) {
        <!-- Header -->
        <div>
          <button (click)="goBack()" class="p-2 rounded-xl hover:bg-surface-hover transition-colors mb-3">
            <svg lucideArrowLeft class="w-5 h-5" strokeWidth="2"></svg>
          </button>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h1 class="text-xl font-bold">{{ ex.name }}</h1>
              <div class="flex items-center gap-2 mt-2">
                <app-ui-badge variant="brand" size="sm">{{ ex.muscle_group }}</app-ui-badge>
                @if (ex.equipment) {
                  <app-ui-badge size="sm">{{ ex.equipment }}</app-ui-badge>
                }
                @if (ex.category) {
                  <app-ui-badge size="sm">{{ ex.category }}</app-ui-badge>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button ui-button variant="secondary" size="sm" class="flex-1" routerLink="/exercises/{{ ex.id }}/edit">
            <svg lucidePencil class="w-4 h-4" strokeWidth="2"></svg>
            {{ 'common.edit' | translate }}
          </button>
          <button ui-button variant="danger" size="sm" class="flex-1" (click)="showDeleteModal.set(true)">
            <svg lucideTrash2 class="w-4 h-4" strokeWidth="2"></svg>
            {{ 'common.delete' | translate }}
          </button>
        </div>

        <!-- Instructions -->
        @if (ex.instructions) {
          <app-ui-card variant="glass" [title]="'exercises.instructions' | translate">
            <p class="text-sm text-on-surface-secondary whitespace-pre-line">{{ ex.instructions }}</p>
          </app-ui-card>
        }

        <!-- Personal Records -->
        <div>
          <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">{{ 'exercises.personalRecords' | translate }}</h2>
          @if (loadingPRs()) {
            <app-ui-skeleton-card height="120px" />
          } @else if (personalRecords().length === 0) {
            <app-ui-empty-state variant="exercise" title="{{ 'exercises.noRecords' | translate }}" message="{{ 'exercises.noRecordsDesc' | translate }}" />
          } @else {
            <div class="flex flex-col gap-2">
              @for (pr of personalRecords(); track pr.id) {
                <app-ui-card variant="glass" [padding]="true">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                      <svg lucideTrophy class="w-5 h-5 text-warning" strokeWidth="1.5"></svg>
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-sm">{{ pr.weight }} kg</span>
                        <span class="text-on-surface-muted text-xs">×</span>
                        <span class="text-sm">{{ pr.reps }} reps</span>
                      </div>
                      @if (pr.estimated_one_rm) {
                        <p class="text-xs text-on-surface-muted mt-0.5">{{ 'exercises.e1rm' | translate }} {{ pr.estimated_one_rm }} kg</p>
                      }
                    </div>
                    <span class="text-xs text-on-surface-muted">{{ pr.achieved_at | relativeDate }}</span>
                  </div>
                </app-ui-card>
              }
            </div>
          }
        </div>
      }

      <!-- Delete Modal -->
      <app-ui-modal [isOpen]="showDeleteModal()" [title]="'exercises.deleteTitle' | translate" (closed)="showDeleteModal.set(false)">
        <p class="text-sm text-on-surface-muted mb-4">
          {{ 'exercises.deleteConfirm' | translate }}
        </p>
        <div class="flex gap-3">
          <button ui-button variant="ghost" size="md" class="flex-1" (click)="showDeleteModal.set(false)">{{ 'common.cancel' | translate }}</button>
          <button ui-button variant="danger" size="md" class="flex-1" (click)="deleteExercise()">{{ 'common.delete' | translate }}</button>
        </div>
      </app-ui-modal>
    </div>
  `,
})
export class ExerciseDetailPage implements OnInit {
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);
  private readonly _exercises = inject(ExerciseService);
  private readonly _metrics = inject(MetricsService);

  readonly exercise = signal<Exercise | null>(null);
  readonly personalRecords = signal<PersonalRecord[]>([]);
  readonly loading = signal(true);
  readonly loadingPRs = signal(true);
  readonly showDeleteModal = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this._route.snapshot.paramMap.get('id');
    if (!id) {
      this.goBack();
      return;
    }
    try {
      const [ex, prs] = await Promise.all([
        this._exercises.getById(id),
        this._metrics.getPersonalRecords(),
      ]);
      this.exercise.set(ex);
      this.personalRecords.set(prs.filter((pr: PersonalRecord) => pr.exercise_id === id));
    } catch {
      this.goBack();
    } finally {
      this.loading.set(false);
      this.loadingPRs.set(false);
    }
  }

  async deleteExercise(): Promise<void> {
    const ex = this.exercise();
    if (!ex) return;
    await this._exercises.delete(ex.id);
    this.showDeleteModal.set(false);
    await this._router.navigate(['/exercises']);
  }

  goBack(): void {
    this._router.navigate(['/exercises']);
  }
}
