import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService, type UserWithProfile } from '@core/services/admin.service';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiBadge } from '@shared/ui/badge';
import { UiInput } from '@shared/ui/input';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { LucideUser, LucideSearch, LucideListOrdered } from '@lucide/angular';

@Component({
  selector: 'app-staff-users',
  standalone: true,
  imports: [UiCard, UiButton, UiBadge, UiInput, TranslatePipe,
    LucideUser, LucideSearch, LucideListOrdered],
  template: `
    <div class="p-4 space-y-4 max-w-lg mx-auto">
      <h1 class="text-xl font-bold">{{ 'staff.viewUsers' | translate }}</h1>

      <app-ui-input
        [placeholder]="'common.search' | translate"
        [value]="searchQuery()"
        (valueChange)="searchQuery.set($event)"
        [hasIcon]="true"
      >
        <svg lucideSearch class="w-4 h-4" strokeWidth="2" icon aria-hidden="true"></svg>
      </app-ui-input>

      <div class="flex flex-col gap-2">
        @for (user of filteredUsers(); track user.id) {
          <app-ui-card>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <svg lucideUser class="w-5 h-5 text-accent" strokeWidth="1.5" aria-hidden="true"></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ user.display_name ?? '—' }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <app-ui-badge [size]="'sm'">
                    {{ 'role.' + user.role | translate }}
                  </app-ui-badge>
                </div>
              </div>
              <button ui-button size="sm" variant="primary"
                (click)="assignRoutine(user.id)">
                <svg lucideListOrdered class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
                {{ 'staff.assignRoutine' | translate }}
              </button>
            </div>
          </app-ui-card>
        } @empty {
          <p class="text-center text-on-surface-muted text-sm py-8">{{ 'common.noResults' | translate }}</p>
        }
      </div>
    </div>
  `,
})
export class StaffUsersPage implements OnInit {
  private readonly _admin = inject(AdminService);
  private readonly _router = inject(Router);

  protected readonly users = signal<UserWithProfile[]>([]);
  protected readonly searchQuery = signal('');

  protected readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.users();
    return this.users().filter(u =>
      u.display_name?.toLowerCase().includes(q) ||
      u.role.includes(q)
    );
  });

  async ngOnInit(): Promise<void> {
    this.users.set(await this._admin.getUsers());
  }

  assignRoutine(userId: string): void {
    this._router.navigate(['/routines'], { queryParams: { assignTo: userId } });
  }
}
