import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiBadge } from '@shared/ui/badge';
import { UiSkeletonListItem } from '@shared/ui';
import { UiInput } from '@shared/ui/input';
import { UiEmptyState } from '@shared/ui/empty-state';
import { DifficultyPipe } from '@shared/pipes/difficulty';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { RoutineService } from '@core/services/routine.service';
import { RoutineAssignmentService } from '@core/services/routine-assignment.service';
import { PermissionService } from '@core/services/permission.service';
import { LucidePlus, LucideHeart, LucideSearch, LucideClock, LucideStar, LucideUserPlus } from '@lucide/angular';

@Component({
  selector: 'app-routines-page',
  standalone: true,
  imports: [
    RouterLink, UiCard, UiButton, UiBadge, UiSkeletonListItem, UiInput, UiEmptyState,
    DifficultyPipe, TranslatePipe,
    LucidePlus, LucideHeart, LucideSearch, LucideClock, LucideStar, LucideUserPlus,
  ],
  template: `
    <div class="p-4 flex flex-col gap-4 max-w-lg mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold">{{ assignUserId() ? ('staff.selectRoutine' | translate) : ('routines.title' | translate) }}</h1>
        @if (!assignUserId()) {
          <a ui-button variant="primary" size="sm" routerLink="/routines/new">
            <svg lucidePlus class="w-4 h-4" strokeWidth="2.5" aria-hidden="true"></svg>
            {{ 'routines.new' | translate }}
          </a>
        }
      </div>

      <!-- Search -->
      <app-ui-input
        [placeholder]="'routines.search' | translate"
        [value]="searchQuery()"
        (valueChange)="searchQuery.set($event)"
        [hasIcon]="true"
      >
        <svg lucideSearch class="w-4 h-4" strokeWidth="2" icon aria-hidden="true"></svg>
      </app-ui-input>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (i of [1,2,3]; track i) {
            <app-ui-skeleton-list-item height="88px" />
          }
        </div>
      }

      <!-- Assign Banner -->
      @if (assignUserId()) {
        <div class="flex items-center gap-3 p-3 rounded-xl bg-accent/10">
          <svg lucideUserPlus class="w-5 h-5 text-accent shrink-0" strokeWidth="1.5" aria-hidden="true"></svg>
          <p class="text-sm flex-1">{{ 'staff.assignInstructions' | translate }}</p>
          <button ui-button variant="ghost" size="sm" (click)="cancelAssign()">{{ 'common.cancel' | translate }}</button>
        </div>
      }

      <!-- Empty -->
      @if (!loading() && filteredRoutines().length === 0 && !searchQuery()) {
        <app-ui-empty-state title="{{ 'routines.empty' | translate }}" message="{{ 'routines.emptyDesc' | translate }}">
          <a ui-button variant="primary" routerLink="/routines/new">
            <svg lucidePlus class="w-4 h-4" strokeWidth="2.5" aria-hidden="true"></svg>
            {{ 'routines.create' | translate }}
          </a>
        </app-ui-empty-state>
      }

      <!-- No results -->
      @if (!loading() && filteredRoutines().length === 0 && searchQuery()) {
        <app-ui-empty-state title="{{ 'routines.noResults' | translate }}" message="{{ 'routines.noResultsDesc' | translate }}" />
      }

      <!-- Routine List -->
      <div class="space-y-3">
        @for (routine of filteredRoutines(); track routine.id) {
          <app-ui-card variant="glass" [padding]="true">
            <button (click)="assignUserId() ? assignRoutine(routine.id, routine.name) : null" class="block w-full text-left">
              <a [routerLink]="assignUserId() ? null : '/routines/' + routine.id" class="block">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h3 class="font-semibold truncate">{{ routine.name }}</h3>
                      @if (routine.is_favorite) {
                        <svg lucideStar class="w-4 h-4 shrink-0 text-yellow-400" strokeWidth="2" fill="currentColor" aria-hidden="true"></svg>
                      }
                    </div>
                    @if (routine.description) {
                      <p class="text-sm text-on-surface-muted mt-0.5 line-clamp-1">{{ routine.description }}</p>
                    }
                    <div class="flex items-center gap-2 mt-2">
                      <app-ui-badge [variant]="routine.difficulty === 'beginner' ? 'success' : routine.difficulty === 'intermediate' ? 'warning' : 'error'" size="sm">
                        {{ routine.difficulty | difficulty }}
                      </app-ui-badge>
                      @let exCount = routine.routine_exercises?.length ?? 0;
                      @if (exCount > 0) {
                        <span class="text-xs text-on-surface-muted">{{ exCount }} {{ 'routines.exercises' | translate }}</span>
                      }
                      @if (routine.estimated_duration) {
                        <span class="text-xs text-on-surface-muted flex items-center gap-1">
                          <svg lucideClock class="w-3 h-3" strokeWidth="2" aria-hidden="true"></svg>
                          {{ routine.estimated_duration }}min
                        </span>
                      }
                    </div>
                  </div>

                  @if (!assignUserId()) {
                    <button
                      (click)="$event.preventDefault(); toggleFavorite(routine.id)"
                      class="p-2 rounded-lg hover:bg-surface-hover transition-colors"
                      [class.text-yellow-400]="routine.is_favorite"
                      [class.text-on-surface-muted]="!routine.is_favorite"
                      [attr.aria-label]="routine.is_favorite ? ('routines.removeFavorite' | translate) : ('routines.addFavorite' | translate)"
                    >
                      <svg lucideHeart class="w-5 h-5" strokeWidth="1.5" [attr.fill]="routine.is_favorite ? 'currentColor' : 'none'" aria-hidden="true"></svg>
                    </button>
                  }
                </div>
              </a>
            </button>
          </app-ui-card>
        }
      </div>
    </div>
  `,
})
export class RoutinesPage implements OnInit {
  private readonly _routines = inject(RoutineService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _assignments = inject(RoutineAssignmentService);
  protected readonly perm = inject(PermissionService);

  readonly routines = this._routines.routines;
  readonly loading = this._routines.loading;
  readonly searchQuery = signal('');
  readonly assignUserId = signal<string | null>(null);

  readonly filteredRoutines = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.routines().filter(r =>
      !q || r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
    );
  });

  async ngOnInit(): Promise<void> {
    await this._routines.fetchAll();
    const assignTo = this._route.snapshot.queryParamMap.get('assignTo');
    if (assignTo) {
      this.assignUserId.set(assignTo);
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    await this._routines.toggleFavorite(id);
  }

  async assignRoutine(routineId: string, routineName: string): Promise<void> {
    const userId = this.assignUserId();
    if (!userId) return;
    const result = await this._assignments.assignRoutine(routineId, userId);
    if (result.error) return;
    this.assignUserId.set(null);
    await this._router.navigate(['/staff/routines']);
  }

  cancelAssign(): void {
    this.assignUserId.set(null);
    this._router.navigate([], { queryParams: { assignTo: null }, queryParamsHandling: 'merge' });
  }
}
