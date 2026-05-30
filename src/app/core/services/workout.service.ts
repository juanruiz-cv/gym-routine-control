import { Injectable, signal } from '@angular/core';
import type { WorkoutSession } from '@shared/models';
import { DataService } from './data.service';

export interface ActiveWorkout {
  session: WorkoutSession;
  currentExerciseIndex: number;
  currentSetIndex: number;
}

@Injectable({ providedIn: 'root' })
export class WorkoutService extends DataService {
  private readonly _activeWorkout = signal<ActiveWorkout | null>(null);
  private readonly _sessions = signal<WorkoutSession[]>([]);

  readonly activeWorkout = this._activeWorkout.asReadonly();
  readonly sessions = this._sessions.asReadonly();

  async startSession(routineId: string, routineExercises: { id: string; sets: number }[]): Promise<WorkoutSession> {
    const userId = await this.checkUserId();

    const { data: session, error } = await this.client
      .from('workout_sessions')
      .insert({
        user_id: userId,
        routine_id: routineId,
        status: 'in_progress',
      })
      .select()
      .single();

    if (error) throw error;

    const sets = routineExercises.flatMap(re =>
      Array.from({ length: re.sets }, (_, i) => ({
        session_id: session.id,
        routine_exercise_id: re.id,
        set_number: i + 1,
        is_completed: false,
      }))
    );

    if (sets.length > 0) {
      const { error: setsError } = await this.client
        .from('workout_sets')
        .insert(sets);

      if (setsError) throw setsError;
    }

    const fullSession = await this.getSessionWithSets(session.id);
    if (fullSession) {
      this._activeWorkout.set({
        session: fullSession,
        currentExerciseIndex: 0,
        currentSetIndex: 0,
      });
    }

    return session;
  }

  async completeSet(setId: string, data: { reps?: number; weight?: number; rpe?: number }): Promise<void> {
    const { error } = await this.client
      .from('workout_sets')
      .update({
        ...data,
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', setId);

    if (error) throw error;

    await this._refreshActiveWorkout();
  }

  async completeSession(sessionId: string): Promise<void> {
    const session = this._activeWorkout()?.session;
    const duration = session ? Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000) : null;

    const { error } = await this.client
      .from('workout_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration,
      })
      .eq('id', sessionId);

    if (error) throw error;

    await this._checkPersonalRecords(sessionId);
    this._activeWorkout.set(null);
  }

  async cancelSession(sessionId: string): Promise<void> {
    const { error } = await this.client
      .from('workout_sessions')
      .update({ status: 'cancelled' })
      .eq('id', sessionId);

    if (error) throw error;
    this._activeWorkout.set(null);
  }

  private async _refreshActiveWorkout(): Promise<void> {
    const current = this._activeWorkout();
    if (!current) return;
    const session = await this.getSessionWithSets(current.session.id);
    if (session) {
      this._activeWorkout.update(a => a ? { ...a, session } : null);
    }
  }

  async getSessionWithSets(sessionId: string): Promise<WorkoutSession | null> {
    const { data, error } = await this.client
      .from('workout_sessions')
      .select('*, routine:routines(*), sets:workout_sets(*, routine_exercises(*, exercise:exercises(*)))')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data;
  }

  navigateToExercise(exerciseIndex: number, setIndex: number): void {
    const current = this._activeWorkout();
    if (!current) return;
    this._activeWorkout.set({
      ...current,
      currentExerciseIndex: exerciseIndex,
      currentSetIndex: setIndex,
    });
  }

  async getUnfinishedSessions(): Promise<WorkoutSession[]> {
    const userId = await this.checkUserId();
    const { data, error } = await this.client
      .from('workout_sessions')
      .select('*, routine(id, name)')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async resumeSession(sessionId: string): Promise<void> {
    const session = await this.getSessionWithSets(sessionId);
    if (!session || !session.sets?.length) return;

    const sets = session.sets;
    const firstIncomplete = sets.find(s => !s.is_completed);
    const currentSetIndex = firstIncomplete ? sets.indexOf(firstIncomplete) : sets.length - 1;

    const exerciseIds = [...new Set(sets.map(s => s.routine_exercise_id))];
    const currentExerciseIndex = firstIncomplete
      ? exerciseIds.indexOf(firstIncomplete.routine_exercise_id)
      : 0;

    this._activeWorkout.set({
      session,
      currentExerciseIndex: Math.max(0, currentExerciseIndex),
      currentSetIndex,
    });
  }

  async getSessionHistory(limit = 20): Promise<WorkoutSession[]> {
    const userId = await this.checkUserId();
    const { data, error } = await this.client
      .from('workout_sessions')
      .select('*, routine:routines(id, name), sets:workout_sets(count)')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }

  private async _checkPersonalRecords(sessionId: string): Promise<void> {
    const session = await this.getSessionWithSets(sessionId);
    if (!session?.sets) return;

    const userId = await this.checkUserId();

    for (const set of session.sets) {
      if (!set.weight || !set.reps) continue;

      const exerciseId = set.routine_exercise?.exercise_id;
      if (!exerciseId) continue;

      const { data: existing } = await this.client
        .from('personal_records')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .order('weight', { ascending: false })
        .limit(1);

      const best = existing?.[0];
      const oneRm = Math.round(set.weight * (1 + set.reps / 30));

      if (!best || set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps)) {
        await this.client.from('personal_records').insert({
          user_id: userId,
          exercise_id: exerciseId,
          weight: set.weight,
          reps: set.reps,
          estimated_one_rm: oneRm,
          session_id: sessionId,
        });
      }
    }
  }
}
