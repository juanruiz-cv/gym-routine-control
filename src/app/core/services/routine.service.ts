import { Injectable, signal } from '@angular/core';
import type { Routine } from '@shared/models';
import { DataService } from './data.service';

@Injectable({ providedIn: 'root' })
export class RoutineService extends DataService {
  private readonly _routines = signal<Routine[]>([]);
  private readonly _loading = signal(false);

  readonly routines = this._routines.asReadonly();
  readonly loading = this._loading.asReadonly();

  async fetchAll(): Promise<Routine[]> {
    this._loading.set(true);
    const userId = await this.checkUserId();
    const { data, error } = await this.client
      .from('routines')
      .select('*, routine_exercises(*, exercise(*))')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    this._routines.set(data ?? []);
    this._loading.set(false);
    return data ?? [];
  }

  async getById(id: string): Promise<Routine | null> {
    const userId = await this.checkUserId();
    const { data, error } = await this.client
      .from('routines')
      .select('*, routine_exercises(*, exercise(*))')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async create(routine: Partial<Routine> & { name: string }): Promise<Routine> {
    const userId = await this.checkUserId();
    const { data, error } = await this.client
      .from('routines')
      .insert({ ...routine, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    this._routines.update(r => [data, ...r]);
    return data;
  }

  async update(id: string, updates: Partial<Routine>): Promise<Routine> {
    const userId = await this.checkUserId();
    const { data, error } = await this.client
      .from('routines')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    this._routines.update(r => r.map(rt => rt.id === id ? { ...rt, ...data } : rt));
    return data;
  }

  async softDelete(id: string): Promise<void> {
    const userId = await this.checkUserId();
    const { error } = await this.client
      .from('routines')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this._routines.update(r => r.filter(rt => rt.id !== id));
  }

  async duplicate(id: string): Promise<Routine | null> {
    const original = await this.getById(id);
    if (!original) return null;

    const userId = await this.checkUserId();
    const { data: routine, error: routineError } = await this.client
      .from('routines')
      .insert({
        user_id: userId,
        name: `${original.name} (copy)`,
        description: original.description,
        difficulty: original.difficulty,
        muscle_groups: original.muscle_groups,
        estimated_duration: original.estimated_duration,
      })
      .select()
      .single();

    if (routineError) throw routineError;

    if (original.routine_exercises?.length) {
      const exercises = original.routine_exercises.map(re => ({
        routine_id: routine.id,
        exercise_id: re.exercise_id,
        sort_order: re.sort_order,
        sets: re.sets,
        reps: re.reps,
        weight: re.weight,
        rest_time: re.rest_time,
        tempo: re.tempo,
        rpe: re.rpe,
        notes: re.notes,
      }));

      const { error: exError } = await this.client
        .from('routine_exercises')
        .insert(exercises);

      if (exError) throw exError;
    }

    await this.fetchAll();
    return routine;
  }

  async toggleFavorite(id: string): Promise<void> {
    const routine = this._routines().find(r => r.id === id);
    if (!routine) return;
    await this.update(id, { is_favorite: !routine.is_favorite });
  }
}
