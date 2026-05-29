import { Injectable, signal } from '@angular/core';
import type { Exercise } from '@shared/models';
import { DataService } from './data.service';

@Injectable({ providedIn: 'root' })
export class ExerciseService extends DataService {
  private readonly _exercises = signal<Exercise[]>([]);

  readonly exercises = this._exercises.asReadonly();

  async fetchAll(): Promise<Exercise[]> {
    const userId = await this.checkUserId();
    const { data, error } = await this.client
      .from('exercises')
      .select('*')
      .or(`user_id.eq.${userId},is_global.eq.true`)
      .order('name');

    if (error) throw error;
    this._exercises.set(data ?? []);
    return data ?? [];
  }

  async getById(id: string): Promise<Exercise | null> {
    const { data, error } = await this.client
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(exercise: Partial<Exercise> & { name: string; muscle_group: string }): Promise<Exercise> {
    const userId = await this.checkUserId();
    const { data, error } = await this.client
      .from('exercises')
      .insert({ ...exercise, user_id: userId, is_global: false })
      .select()
      .single();

    if (error) throw error;
    this._exercises.update(e => [data, ...e]);
    return data;
  }

  async update(id: string, updates: Partial<Exercise>): Promise<Exercise> {
    const userId = await this.checkUserId();
    const { data, error } = await this.client
      .from('exercises')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    this._exercises.update(e => e.map(ex => ex.id === id ? { ...ex, ...data } : ex));
    return data;
  }

  async delete(id: string): Promise<void> {
    const userId = await this.checkUserId();
    const { error } = await this.client
      .from('exercises')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this._exercises.update(e => e.filter(ex => ex.id !== id));
  }
}
