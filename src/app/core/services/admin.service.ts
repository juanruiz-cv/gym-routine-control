import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuditService } from './audit.service';
import { environment } from '@env/environment';
import type { Profile, UserRole } from '@shared/models';

export interface UserWithProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface AdminMetrics {
  totalUsers: number;
  totalStaff: number;
  totalRoutines: number;
  totalWorkouts: number;
  activeUsers: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly _supabase = inject(SupabaseService);
  private readonly _audit = inject(AuditService);

  async getUsers(): Promise<UserWithProfile[]> {
    const { data } = await this._supabase.client
      .from('profiles')
      .select('id, display_name, role, created_at, updated_at')
      .order('created_at', { ascending: false });
    return (data ?? []).map(p => ({
      ...p,
      email: null,
      last_sign_in_at: null,
    })) as UserWithProfile[];
  }

  async promoteToStaff(userId: string): Promise<{ error?: string }> {
    return this._callManageRole(userId, 'staff');
  }

  async demoteToUser(userId: string): Promise<{ error?: string }> {
    return this._callManageRole(userId, 'user');
  }

  async promoteToAdmin(userId: string): Promise<{ error?: string }> {
    return this._callManageRole(userId, 'admin');
  }

  private async _callManageRole(userId: string, role: 'staff' | 'user' | 'admin'): Promise<{ error?: string }> {
    const { data: { session } } = await this._supabase.client.auth.getSession();
    const token = session?.access_token;
    if (!token) return { error: 'Not authenticated' };

    try {
      const res = await fetch(
        `${environment.supabaseUrl}/functions/v1/manage-role`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id: userId, role }),
        },
      );
      const body = await res.json();
      if (!res.ok) return { error: body.error ?? 'Failed to update role' };
      return {};
    } catch {
      return { error: 'Network error' };
    }
  }

  async getMetrics(): Promise<AdminMetrics> {
    const [users, routines, workouts] = await Promise.all([
      this._supabase.client.from('profiles').select('role', { count: 'exact', head: false }),
      this._supabase.client.from('routines').select('id', { count: 'exact', head: false }),
      this._supabase.client.from('workout_sessions').select('id', { count: 'exact', head: false }),
    ]);

    const profiles = users.data ?? [];
    return {
      totalUsers: profiles.length,
      totalStaff: profiles.filter(p => p.role === 'staff').length,
      totalRoutines: routines.count ?? 0,
      totalWorkouts: workouts.count ?? 0,
      activeUsers: profiles.filter(p => p.role === 'user').length,
    };
  }
}
