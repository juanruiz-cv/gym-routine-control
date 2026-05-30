import { Component, OnInit, inject, signal } from '@angular/core';
import { RoutineAssignmentService } from '@core/services/routine-assignment.service';
import type { RoutineAssignment } from '@shared/models';
import { UiCard } from '@shared/ui/card';
import { UiBadge } from '@shared/ui/badge';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { DatePipe } from '@angular/common';
import { LucideListOrdered, LucideUser } from '@lucide/angular';

@Component({
  selector: 'app-staff-routines',
  standalone: true,
  imports: [UiCard, UiBadge, TranslatePipe, DatePipe, LucideListOrdered, LucideUser],
  template: `
    <div class="p-4 space-y-4 max-w-lg mx-auto">
      <h1 class="text-xl font-bold">{{ 'staff.assignedRoutines' | translate }}</h1>

      <div class="flex flex-col gap-2">
        @for (ra of assignments(); track ra.id) {
          <app-ui-card>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <svg lucideListOrdered class="w-5 h-5 text-accent" strokeWidth="1.5" aria-hidden="true"></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ ra.routine?.name ?? '—' }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <svg lucideUser class="w-3 h-3 text-on-surface-muted" strokeWidth="2" aria-hidden="true"></svg>
                  <span class="text-xs text-on-surface-muted">{{ ra.user?.display_name ?? '—' }}</span>
                  <app-ui-badge [size]="'sm'">
                    {{ 'assignment.' + ra.status | translate }}
                  </app-ui-badge>
                </div>
              </div>
              <span class="text-xs text-on-surface-muted shrink-0">{{ ra.assigned_at | date:'shortDate' }}</span>
            </div>
          </app-ui-card>
        } @empty {
          <p class="text-center text-on-surface-muted text-sm py-8">{{ 'staff.noAssignments' | translate }}</p>
        }
      </div>
    </div>
  `,
})
export class StaffRoutinesPage implements OnInit {
  private readonly _ra = inject(RoutineAssignmentService);

  protected readonly assignments = signal<RoutineAssignment[]>([]);

  async ngOnInit(): Promise<void> {
    this.assignments.set(await this._ra.getAllAssignments());
  }
}
