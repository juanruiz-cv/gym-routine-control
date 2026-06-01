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
import { AuthService } from '@core/auth/auth.service';
import { DIFFICULTIES } from '@shared/models';
import { LucidePlus, LucideHeart, LucideSearch, LucideClock, LucideStar, LucideUserPlus, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-routines-page',
  standalone: true,
  imports: [
    RouterLink, UiCard, UiButton, UiBadge, UiSkeletonListItem, UiInput, UiEmptyState,
    DifficultyPipe, TranslatePipe,
    LucidePlus, LucideHeart, LucideSearch, LucideClock, LucideStar, LucideUserPlus, LucideX,
  ],
  template: `
    <div class="p-4 flex flex-col gap-4 max-w-lg mx-auto md:max-w-4xl lg:max-w-none lg:mx-0 lg:px-6">
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

      <!-- Assign Banner -->
      @if (assignUserId()) {
        <div class="flex items-center gap-3 p-3 rounded-xl bg-accent/10">
          <svg lucideUserPlus class="w-5 h-5 text-accent shrink-0" strokeWidth="1.5" aria-hidden="true"></svg>
          <p class="text-sm flex-1">{{ 'staff.assignInstructions' | translate }}</p>
          <button ui-button variant="ghost" size="sm" (click)="cancelAssign()">{{ 'common.cancel' | translate }}</button>
        </div>
      }

      <!-- Tabs: Personal / Assigned -->
      @if (hasAssigned() && !assignUserId()) {
        <div class="flex gap-1 p-1 rounded-xl bg-surface-elevated border border-border w-fit" role="tablist" aria-label="Tipo de rutina">
          <button
            role="tab"
            [attr.aria-selected]="tab() === 'personal'"
            [class]="tab() === 'personal' ? 'bg-surface-card text-on-surface shadow-sm' : 'text-on-surface-muted hover:text-on-surface'"
            class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            (click)="tab.set('personal')"
          >{{ 'routines.personal' | translate }}</button>
          <button
            role="tab"
            [attr.aria-selected]="tab() === 'assigned'"
            [class]="tab() === 'assigned' ? 'bg-surface-card text-on-surface shadow-sm' : 'text-on-surface-muted hover:text-on-surface'"
            class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            (click)="tab.set('assigned')"
          >{{ 'routines.assigned' | translate }}</button>
        </div>
      }

      <!-- Desktop: Filters + Grid -->
      <div class="lg:flex lg:gap-6 lg:items-start">
        <!-- Filters Panel -->
        @if (!assignUserId()) {
        <div class="lg:w-52 lg:shrink-0 lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
          <!-- Search -->
          <app-ui-input
            [placeholder]="'routines.search' | translate"
            [value]="searchQuery()"
            (valueChange)="searchQuery.set($event)"
            [hasIcon]="true"
          >
            <svg lucideSearch class="w-4 h-4" strokeWidth="2" icon aria-hidden="true"></svg>
          </app-ui-input>

          <!-- Difficulty Filter -->
          <div class="mt-3">
            <h3 class="text-xs font-semibold text-on-surface-muted mb-2 hidden lg:block">{{ 'routines.filterByDifficulty' | translate }}</h3>
            <div class="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-x-visible">
              <button
                ui-button [variant]="selectedDifficulty() === '' ? 'primary' : 'secondary'" size="sm"
                class="shrink-0" (click)="selectedDifficulty.set('')"
              >{{ 'routines.all' | translate }}</button>
              @for (d of difficulties; track d) {
                <button
                  ui-button [variant]="selectedDifficulty() === d ? 'primary' : 'secondary'" size="sm"
                  class="shrink-0" (click)="selectedDifficulty.set(d)"
                >{{ d | difficulty }}</button>
              }
            </div>
          </div>

          <!-- Clear Filters -->
          @if (hasActiveFilters()) {
            <button
              ui-button variant="ghost" size="sm" class="mt-3"
              (click)="clearFilters()"
            >
              <svg lucideX class="w-3.5 h-3.5" strokeWidth="2" aria-hidden="true"></svg>
              {{ 'routines.clearFilters' | translate }}
            </button>
          }
        </div>
        }

        <!-- Content Area -->
        <div class="flex-1 min-w-0 mt-4 lg:mt-0">
          <!-- Results Counter -->
          @if (!assignUserId()) {
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs text-on-surface-muted">
                @if (filteredRoutines().length === 1) {
                  {{ 'routines.oneResult' | translate }}
                } @else {
                  {{ filteredRoutines().length }} {{ 'routines.results' | translate }}
                }
              </p>
            </div>
          }

          <!-- Loading -->
          @if (loading()) {
            <div class="flex flex-col gap-3">
              @for (i of [1,2,3]; track i) {
                <app-ui-skeleton-list-item height="88px" />
              }
            </div>
          }

          <!-- Empty -->
          @if (!loading() && filteredRoutines().length === 0 && !searchQuery() && !selectedDifficulty()) {
            <app-ui-empty-state title="{{ 'routines.empty' | translate }}" message="{{ 'routines.emptyDesc' | translate }}">
              <a ui-button variant="primary" routerLink="/routines/new">
                <svg lucidePlus class="w-4 h-4" strokeWidth="2.5" aria-hidden="true"></svg>
                {{ 'routines.create' | translate }}
              </a>
            </app-ui-empty-state>
          }

          <!-- No results -->
          @if (!loading() && filteredRoutines().length === 0 && (searchQuery() || selectedDifficulty())) {
            <app-ui-empty-state title="{{ 'routines.noResults' | translate }}" message="{{ 'routines.noResultsDesc' | translate }}" />
          }

          <!-- Routine Grid -->
          @if (!loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
                        <div class="flex items-center gap-2 mt-2 flex-wrap">
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
                          class="p-2 rounded-lg hover:bg-surface-hover transition-colors shrink-0"
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
          }
        </div>
      </div>
    </div>
  `,
})
export class RoutinesPage implements OnInit {
  private readonly _routines = inject(RoutineService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _assignments = inject(RoutineAssignmentService);
  private readonly _auth = inject(AuthService);
  protected readonly perm = inject(PermissionService);

  readonly routines = this._routines.routines;
  readonly loading = this._routines.loading;
  readonly searchQuery = signal('');
  readonly assignUserId = signal<string | null>(null);
  readonly tab = signal<'personal' | 'assigned'>('personal');
  readonly selectedDifficulty = signal('');
  readonly difficulties = DIFFICULTIES;

  readonly currentUserId = computed(() => this._auth.user()?.id ?? '');

  readonly personalRoutines = computed(() =>
    this.routines().filter(r => r.user_id === this.currentUserId())
  );

  readonly assignedRoutines = computed(() =>
    this.routines().filter(r => r.user_id !== this.currentUserId())
  );

  readonly hasAssigned = computed(() => this.assignedRoutines().length > 0);

  readonly activeList = computed(() =>
    this.tab() === 'personal' ? this.personalRoutines() : this.assignedRoutines()
  );

  readonly hasActiveFilters = computed(() =>
    !!this.searchQuery() || !!this.selectedDifficulty()
  );

  readonly filteredRoutines = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const difficulty = this.selectedDifficulty();
    return this.activeList().filter(r => {
      if (difficulty && r.difficulty !== difficulty) return false;
      if (q && !r.name.toLowerCase().includes(q) && !(r.description?.toLowerCase().includes(q) ?? false)) return false;
      return true;
    });
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
    void routineName;
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

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedDifficulty.set('');
  }
}
