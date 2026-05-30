import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from '@core/auth/auth.service';

export interface StaffMetrics {
  totalAssignments: number;
  activeAssignments: number;
  completedAssignments: number;
  completionPercentage: number;
  totalUsers: number;
}

@Injectable({ providedIn: 'root' })
export class StaffMetricsService {
  private readonly _supabase = inject(SupabaseService);
  private readonly _auth = inject(AuthService);

  private readonly _metrics = signal<StaffMetrics>({
    totalAssignments: 0,
    activeAssignments: 0,
    completedAssignments: 0,
    completionPercentage: 0,
    totalUsers: 0,
  });
  private readonly _loading = signal(false);

  readonly metrics = this._metrics.asReadonly();
  readonly loading = this._loading.asReadonly();

  async loadMetrics(): Promise<void> {
    this._loading.set(true);
    try {
      const userId = this._auth.user()?.id;
      if (!userId) return;

      const { data: assignments } = await this._supabase.client
        .from('routine_assignments')
        .select('status')
        .eq('assigned_by', userId);

      const total = assignments?.length ?? 0;
      const active = assignments?.filter(a => a.status === 'active' || a.status === 'assigned').length ?? 0;
      const completed = assignments?.filter(a => a.status === 'completed').length ?? 0;

      const { count: userCount } = await this._supabase.client
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .neq('role', 'admin');

      this._metrics.set({
        totalAssignments: total,
        activeAssignments: active,
        completedAssignments: completed,
        completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        totalUsers: userCount ?? 0,
      });
    } finally {
      this._loading.set(false);
    }
  }
}