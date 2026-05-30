import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService, type UserWithProfile } from '@core/services/admin.service';
import { PermissionService } from '@core/services/permission.service';
import { AuthService } from '@core/auth/auth.service';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiBadge } from '@shared/ui/badge';
import { UiModal } from '@shared/ui/modal';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { LucideUser, LucideChevronUp, LucideChevronDown, LucideSearch, LucideShield, LucideAlertTriangle } from '@lucide/angular';
import { UiInput } from '@shared/ui/input';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [DatePipe, UiCard, UiButton, UiBadge, UiModal, TranslatePipe, UiInput,
    LucideUser, LucideChevronUp, LucideChevronDown, LucideSearch, LucideShield, LucideAlertTriangle],
  template: `
    <div class="p-4 space-y-4 max-w-lg mx-auto">
      <h1 class="text-xl font-bold">{{ 'admin.manageUsers' | translate }}</h1>

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

      <div class="flex flex-col gap-2">
        @for (user of filteredUsers(); track user.id) {
          <app-ui-card>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                <svg lucideUser class="w-5 h-5 text-brand" strokeWidth="1.5" aria-hidden="true"></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ user.display_name ?? '—' }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <app-ui-badge [size]="'sm'" [variant]="badgeVariant(user.role)">
                    {{ 'role.' + user.role | translate }}
                  </app-ui-badge>
                  <span class="text-xs text-on-surface-muted">
                    {{ user.created_at | date:'shortDate' }}
                  </span>
                </div>
              </div>
              @if (perm.isAdmin() && user.role !== 'admin' && user.id !== currentUserId()) {
                <div class="flex gap-1 shrink-0">
                  @if (user.role === 'user') {
                    <button ui-button size="sm" variant="secondary" [title]="'admin.promoteToStaff' | translate"
                      (click)="promote(user.id)" [disabled]="loading()">
                      <svg lucideChevronUp class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
                    </button>
                  }
                  @if (user.role === 'staff') {
                    <button ui-button size="sm" variant="secondary" [title]="'admin.demoteToUser' | translate"
                      (click)="demote(user.id)" [disabled]="loading()">
                      <svg lucideChevronDown class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
                    </button>
                  }
                  <button ui-button size="sm" variant="primary" [title]="'admin.promoteToAdmin' | translate"
                    (click)="openPromoteToAdmin(user)" [disabled]="loading()">
                    <svg lucideShield class="w-4 h-4" strokeWidth="2" aria-hidden="true"></svg>
                  </button>
                </div>
              }
            </div>
          </app-ui-card>
        } @empty {
          <p class="text-center text-on-surface-muted text-sm py-8">{{ 'common.noResults' | translate }}</p>
        }
      </div>
    </div>

    <app-ui-modal [isOpen]="confirmModalOpen()" [title]="'admin.confirmPromoteAdmin' | translate" (closed)="cancelPromote()">
      <p class="text-sm text-on-surface-secondary mb-4">
        {{ 'admin.confirmPromoteAdminMessage' | translate: { name: confirmTarget()?.display_name ?? '' } }}
      </p>
      <div class="flex gap-2">
        <button ui-button variant="danger" class="flex-1" (click)="confirmPromote()" [disabled]="loading()">
          {{ 'admin.promoteToAdmin' | translate }}
        </button>
        <button ui-button variant="secondary" class="flex-1" (click)="cancelPromote()" [disabled]="loading()">
          {{ 'common.cancel' | translate }}
        </button>
      </div>
    </app-ui-modal>
  `,
})
export class AdminUsersPage implements OnInit {
  private readonly _admin = inject(AdminService);
  private readonly _auth = inject(AuthService);
  protected readonly perm = inject(PermissionService);

  protected readonly users = signal<UserWithProfile[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly currentUserId = computed(() => this._auth.user()?.id ?? '');

  protected readonly confirmModalOpen = signal(false);
  protected readonly confirmTarget = signal<UserWithProfile | null>(null);

  protected readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.users();
    return this.users().filter(u =>
      u.display_name?.toLowerCase().includes(q) ||
      u.role.includes(q)
    );
  });

  protected badgeVariant(role: string): 'brand' | 'warning' | 'default' {
    return role === 'admin' ? 'brand' : role === 'staff' ? 'warning' : 'default';
  }

  async ngOnInit(): Promise<void> {
    this.users.set(await this._admin.getUsers());
  }

  protected openPromoteToAdmin(user: UserWithProfile): void {
    this.confirmTarget.set(user);
    this.confirmModalOpen.set(true);
  }

  protected cancelPromote(): void {
    this.confirmModalOpen.set(false);
    this.confirmTarget.set(null);
  }

  protected async confirmPromote(): Promise<void> {
    const target = this.confirmTarget();
    if (!target) return;
    this.confirmModalOpen.set(false);
    this.confirmTarget.set(null);
    await this._changeRole(target.id, 'admin');
  }

  async promote(userId: string): Promise<void> {
    await this._changeRole(userId, 'staff');
  }

  async demote(userId: string): Promise<void> {
    await this._changeRole(userId, 'user');
  }

  private async _changeRole(userId: string, role: 'admin' | 'staff' | 'user'): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    let result: { error?: string };
    if (role === 'admin') {
      result = await this._admin.promoteToAdmin(userId);
    } else if (role === 'staff') {
      result = await this._admin.promoteToStaff(userId);
    } else {
      result = await this._admin.demoteToUser(userId);
    }

    if (result.error) {
      this.error.set(result.error);
    } else {
      this.users.update(users =>
        users.map(u => u.id === userId ? { ...u, role } : u)
      );
    }
    this.loading.set(false);
  }
}
