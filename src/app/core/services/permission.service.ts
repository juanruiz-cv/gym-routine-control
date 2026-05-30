import { Injectable, signal, computed, inject, effect, DestroyRef } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from '../auth/auth.service';

export type UserRole = 'admin' | 'staff' | 'user';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly _supabase = inject(SupabaseService);
  private readonly _auth = inject(AuthService);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _role = signal<UserRole>('user');

  readonly role = this._role.asReadonly();
  readonly isAdmin = computed(() => this._role() === 'admin');
  readonly isStaff = computed(() => this._role() === 'staff');
  readonly isUser = computed(() => this._role() === 'user');
  readonly isStaffOrAbove = computed(() => this._role() === 'admin' || this._role() === 'staff');

  readonly canManageUsers = computed(() => this.isAdmin());
  readonly canManageRoles = computed(() => this.isAdmin());
  readonly canAssignRoutines = computed(() => this.isStaffOrAbove());
  readonly canCreateGlobalExercises = computed(() => this.isStaffOrAbove());
  readonly canViewAllUsers = computed(() => this.isStaffOrAbove());
  readonly canViewAdminPanel = computed(() => this.isAdmin());
  readonly canViewStaffPanel = computed(() => this.isStaffOrAbove());

  constructor() {
    const e = effect(() => {
      const user = this._auth.user();
      if (user && !this._auth.loading()) {
        this._loadProfile(user.id);
      } else if (!user && !this._auth.loading()) {
        this._role.set('user');
      }
    });
    this._destroyRef.onDestroy(() => e.destroy());
  }

  private async _loadProfile(userId: string): Promise<void> {
    const { data, error } = await this._supabase.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single<{ role: UserRole }>();
    if (error) {
      console.error('[PermissionService] Failed to load role:', error.message);
    }
    this._role.set(data?.role ?? 'user');
  }

  setRole(role: UserRole): void {
    this._role.set(role);
  }
}
