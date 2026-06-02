import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiSkeletonListItem } from '@shared/ui';
import { UiEmptyState } from '@shared/ui/empty-state';
import { UiBadge } from '@shared/ui/badge';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { WorkoutService } from '@core/services/workout.service';
import { DurationPipe } from '@shared/pipes/duration';
import { RelativeDatePipe } from '@shared/pipes/relative-date';
import {
  LucideDumbbell, LucideClock, LucideSearch,
  LucideBarChart3, LucideChevronDown, LucideArrowRight,
} from '@lucide/angular';
import type { WorkoutSession, WorkoutSet } from '@shared/models';

interface ExerciseGroup {
  routineExerciseId: string;
  name: string;
  muscleGroup: string;
  sets: WorkoutSet[];
}

@Component({
  selector: 'app-history-page',
  standalone: true,
  imports: [
    RouterLink, UiCard, UiButton, UiSkeletonListItem, UiEmptyState, UiBadge,
    DurationPipe, RelativeDatePipe, TranslatePipe,
    LucideDumbbell, LucideClock, LucideSearch, LucideBarChart3, LucideChevronDown, LucideArrowRight,
  ],
  template: `
    <div class="p-4 flex flex-col gap-5 max-w-lg mx-auto md:max-w-4xl lg:max-w-none lg:mx-0 lg:px-6 lg:gap-6">
      <div>
        <h1 class="text-xl font-bold">{{ 'history.title' | translate }}</h1>
        <p class="text-sm text-on-surface-muted mt-0.5">{{ 'history.subtitle' | translate }}</p>
      </div>

      @if (loading()) {
        <div class="flex flex-col gap-3">
          @for (i of [1,2,3,4,5]; track i) {
            <app-ui-skeleton-list-item height="88px" />
          }
        </div>
      } @else if (sessions().length === 0) {
        <app-ui-empty-state
          variant="workout"
          title="{{ 'history.empty' | translate }}"
          message="{{ 'history.emptyDesc' | translate }}"
          [primaryAction]="{ label: ('dashboard.startWorkout' | translate), routerLink: '/routines', variant: 'primary' }"
        />
      } @else {
        <div class="relative">
          <svg lucideSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-muted pointer-events-none" strokeWidth="1.5" aria-hidden="true"></svg>
          <input
            type="text"
            [value]="searchQuery()"
            (input)="searchQuery.set($any($event.target).value)"
            class="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-card border border-white/5 text-sm text-on-surface placeholder-on-surface-muted focus:outline-none focus:ring-1 focus:ring-brand transition-colors"
            [placeholder]="'history.search' | translate"
          />
        </div>

        @if (filteredSessions().length === 0) {
          <app-ui-empty-state
            variant="workout"
            title="{{ 'history.notFound' | translate }}"
            message="{{ 'history.notFoundDesc' | translate }}"
          />
        } @else {
          <div class="flex flex-col gap-3">
            @for (session of filteredSessions(); track session.id) {
              @let isExpanded = expanded.has(session.id);

              <div class="rounded-2xl border border-border glass overflow-hidden">
                <button
                  class="w-full text-left p-4 flex items-start gap-3"
                  (click)="toggleExpand(session.id)"
                >
                  <div class="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                    <svg lucideDumbbell class="w-5 h-5 text-brand" strokeWidth="1.5" aria-hidden="true"></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                      <p class="text-sm font-medium truncate">{{ session.routine?.name ?? session.routine_name ?? ('history.noName' | translate) }}</p>
                      <app-ui-badge variant="success" size="sm">{{ 'history.completed' | translate }}</app-ui-badge>
                    </div>
                    <div class="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-1 text-xs text-on-surface-muted">
                      <span>{{ session.completed_at | relativeDate }}</span>
                      @if (session.duration) {
                        <span class="flex items-center gap-1">
                          <svg lucideClock class="w-3 h-3" strokeWidth="2" aria-hidden="true"></svg>
                          {{ session.duration | duration }}
                        </span>
                      }
                    </div>
                    <div class="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-on-surface-muted">
                      @if (sessionVolume(session) > 0) {
                        <span class="flex items-center gap-1">
                          <svg lucideBarChart3 class="w-3 h-3" strokeWidth="2" aria-hidden="true"></svg>
                          {{ sessionVolume(session).toLocaleString() }} kg
                        </span>
                      }
                      <span>
                        {{ exerciseCount(session) }} {{ 'history.exercises' | translate }}
                      </span>
                    </div>
                  </div>
                  <svg lucideChevronDown
                    class="w-4 h-4 text-on-surface-muted shrink-0 mt-1 transition-transform duration-200"
                    [class.rotate-180]="isExpanded"
                    strokeWidth="2"
                    aria-hidden="true">
                  </svg>
                </button>

                @if (isExpanded) {
                  @let groups = groupExercises(session);
                  <div class="px-4 pb-4 border-t border-border">
                    @for (group of groups; track group.routineExerciseId; let last = $last) {
                      <div class="py-3" [class.border-b]="!last" [class.border-border]="!last">
                        <div class="flex items-center gap-2 mb-2">
                          <div class="w-6 h-6 rounded-md bg-surface-hover flex items-center justify-center text-xs font-bold text-on-surface-muted">
                            {{ $index + 1 }}
                          </div>
                          <p class="text-sm font-medium text-on-surface">{{ group.name }}</p>
                          @if (group.muscleGroup) {
                            <app-ui-badge variant="brand" size="sm" class="ml-1">
                              {{ 'muscleGroup.' + group.muscleGroup | translate }}
                            </app-ui-badge>
                          }
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                          @for (set of group.sets; track set.id) {
                            <div class="px-2.5 py-1 rounded-lg bg-surface-hover text-xs flex items-center gap-1.5">
                              <span class="text-on-surface-muted font-medium">{{ set.set_number }}</span>
                              @if (set.is_completed && set.weight && set.reps) {
                                <span class="text-on-surface">{{ set.weight }} kg &times; {{ set.reps }}</span>
                              } @else if (set.is_completed) {
                                <span class="text-on-surface-muted">&mdash;</span>
                              } @else {
                                <span class="text-on-surface-muted/50">—</span>
                              }
                            </div>
                          }
                        </div>
                      </div>
                    }
                    <div class="pt-2">
                      <a
                        ui-button variant="secondary" size="sm" class="w-full"
                        routerLink="/workout/{{ session.id }}/summary"
                      >
                        <svg lucideArrowRight class="w-3.5 h-3.5" strokeWidth="2" aria-hidden="true"></svg>
                        {{ 'history.viewDetail' | translate }}
                      </a>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class HistoryPage implements OnInit {
  private readonly _workout = inject(WorkoutService);

  readonly sessions = signal<WorkoutSession[]>([]);
  readonly loading = signal(true);
  readonly searchQuery = signal('');
  readonly expanded = new Set<string>();

  readonly filteredSessions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const list = this.sessions();
    if (!query) return list;
    return list.filter(s =>
      (s.routine?.name ?? '').toLowerCase().includes(query)
    );
  });

  async ngOnInit(): Promise<void> {
    try {
      const data = await this._workout.getSessionHistory(100);
      this.sessions.set(data);
    } catch {
      this.sessions.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  toggleExpand(sessionId: string): void {
    if (this.expanded.has(sessionId)) {
      this.expanded.delete(sessionId);
    } else {
      this.expanded.add(sessionId);
    }
  }

  groupExercises(session: WorkoutSession): ExerciseGroup[] {
    const sets = session.sets ?? [];
    const map = new Map<string, ExerciseGroup>();

    for (const set of sets) {
      const reId = set.routine_exercise_id;
      if (!map.has(reId)) {
        const ex = set.routine_exercise?.exercise;
        map.set(reId, {
          routineExerciseId: reId,
          name: ex?.name ?? 'Unknown',
          muscleGroup: ex?.muscle_group ?? '',
          sets: [],
        });
      }
      map.get(reId)!.sets.push(set);
    }

    return Array.from(map.values());
  }

  sessionVolume(session: WorkoutSession): number {
    return (session.sets ?? []).reduce((sum, s) => sum + ((s.weight ?? 0) * (s.reps ?? 0)), 0);
  }

  exerciseCount(session: WorkoutSession): number {
    const ids = new Set((session.sets ?? []).map(s => s.routine_exercise_id));
    return ids.size;
  }
}
