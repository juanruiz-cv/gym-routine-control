import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuditService } from './audit.service';
import type { RoutineAssignment } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class RoutineAssignmentService {
  private readonly _supabase = inject(SupabaseService);
  private readonly _audit = inject(AuditService);

  async getAssignmentsForUser(userId: string): Promise<RoutineAssignment[]> {
    const { data } = await this._supabase.client
      .from('routine_assignments')
      .select('*, routine:routines(name), user:profiles!routine_assignments_user_id_fkey(display_name)')
      .eq('user_id', userId)
      .order('assigned_at', { ascending: false });
    return (data ?? []) as unknown as RoutineAssignment[];
  }

  async getAllAssignments(): Promise<RoutineAssignment[]> {
    const { data } = await this._supabase.client
      .from('routine_assignments')
      .select('*, routine:routines(name), user:profiles!routine_assignments_user_id_fkey(display_name)')
      .order('assigned_at', { ascending: false });
    return (data ?? []) as unknown as RoutineAssignment[];
  }

  async assignRoutine(routineId: string, userId: string): Promise<{ error?: string }> {
    const { data: { user } } = await this._supabase.client.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await this._supabase.client
      .from('routine_assignments')
      .insert({
        routine_id: routineId,
        user_id: userId,
        assigned_by: user.id,
      });

    if (!error) {
      await this._audit.log({
        action: 'routine_assignment',
        entityType: 'routine_assignment',
        entityId: routineId,
        targetId: userId,
        metadata: { routine_id: routineId },
      });
    }

    return { error: error?.message };
  }

  async updateStatus(id: string, status: RoutineAssignment['status']): Promise<void> {
    await this._supabase.client
      .from('routine_assignments')
      .update({ status })
      .eq('id', id);
  }
}
