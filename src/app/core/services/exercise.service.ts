import { Injectable, signal, inject, effect, DestroyRef } from '@angular/core';
import type { Exercise } from '@shared/models';
import { DataService } from './data.service';
import { ExerciseOfflineStore } from './exercise-offline.store';
import { NetworkStatusService } from './network-status.service';

@Injectable({ providedIn: 'root' })
export class ExerciseService extends DataService {
  private readonly _offline = inject(ExerciseOfflineStore);
  private readonly _network = inject(NetworkStatusService);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _exercises = signal<Exercise[]>([]);
  private readonly _loading = signal(false);
  private readonly _synced = signal(false);

  readonly exercises = this._exercises.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly synced = this._synced.asReadonly();

  constructor() {
    super();
    const e = effect(() => {
      if (this._network.isOnline()) {
        this.syncPendingChanges();
      }
    });
    this._destroyRef.onDestroy(() => e.destroy());
  }

  async fetchAll(): Promise<Exercise[]> {
    this._loading.set(true);
    this._synced.set(false);

    const cached = await this._offline.getAll();
    if (cached.length > 0) {
      this._exercises.set(cached);
    }

    if (!this._network.isOnline()) {
      this._loading.set(false);
      return cached;
    }

    try {
      const userId = await this.checkUserId();
      const { data, error } = await this.client
        .from('exercises')
        .select('*')
        .or(`user_id.eq.${userId},is_global.eq.true`)
        .order('name');

      if (error) throw error;

      const serverExercises = data ?? [];
      const localMap = new Map(cached.map(e => [e.id, e.updated_at]));
      const serverMap = new Map(serverExercises.map(e => [e.id, e.updated_at]));
      const changedIds = new Set<string>();

      for (const [id, serverUpdated] of serverMap) {
        const localUpdated = localMap.get(id);
        if (!localUpdated || serverUpdated > localUpdated) {
          changedIds.add(id);
        }
      }
      for (const id of localMap.keys()) {
        if (!serverMap.has(id)) {
          changedIds.add(id);
        }
      }

      if (changedIds.size > 0 || cached.length !== serverExercises.length) {
        await this._offline.clear();
        await this._offline.putAll(serverExercises);
      }

      this._exercises.set(serverExercises);
      this._synced.set(true);
      return serverExercises;
    } finally {
      this._loading.set(false);
    }
  }

  async getById(id: string): Promise<Exercise | null> {
    const cached = await this._offline.getById(id);
    if (cached && !this._network.isOnline()) {
      return cached;
    }

    const { data, error } = await this.client
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (cached) return cached;
      throw error;
    }

    if (data) {
      await this._offline.put(data);
    }
    return data;
  }

  async create(exercise: Partial<Exercise> & { name: string; muscle_group: string }): Promise<Exercise> {
    if (!this._network.isOnline()) {
      const offline = await this._createOffline(exercise);
      return offline;
    }

    const userId = await this.checkUserId();
    const { data, error } = await this.client
      .from('exercises')
      .insert({ ...exercise, user_id: userId, created_by: userId, updated_by: userId })
      .select()
      .single();

    if (error) throw error;
    await this._offline.put(data);
    this._exercises.update(e => [data, ...e]);
    return data;
  }

  async update(id: string, updates: Partial<Exercise>): Promise<Exercise> {
    if (!this._network.isOnline()) {
      return this._updateOffline(id, updates);
    }

    const userId = await this.checkUserId();
    const { data, error } = await this.client
      .from('exercises')
      .update({ ...updates, updated_by: userId })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    await this._offline.put(data);
    this._exercises.update(e => e.map(ex => ex.id === id ? { ...ex, ...data } : ex));
    return data;
  }

  async delete(id: string): Promise<void> {
    if (!this._network.isOnline()) {
      await this._deleteOffline(id);
      return;
    }

    const { error } = await this.client
      .from('exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await this._offline.delete(id);
    this._exercises.update(e => e.filter(ex => ex.id !== id));
  }

  clear(): void {
    this._exercises.set([]);
    this._loading.set(false);
    this._synced.set(false);
    this._offline.clear();
  }

  async syncPendingChanges(): Promise<void> {
    if (!this._network.isOnline()) return;

    const ops = await this._offline.getPendingOps();
    for (const op of ops) {
      try {
        switch (op.type) {
          case 'create': {
            const userId = await this.checkUserId();
            const { data } = await this.client
              .from('exercises')
              .insert({ ...op.payload, user_id: userId, created_by: userId, updated_by: userId })
              .select()
              .single();
            if (data) {
              await this._offline.put(data);
              this._exercises.update(e => e.map(ex => ex.id === op.entityId ? data : ex));
            }
            break;
          }
          case 'update': {
            const userId = await this.checkUserId();
            const { data } = await this.client
              .from('exercises')
              .update({ ...op.payload, updated_by: userId })
              .eq('id', op.entityId)
              .select()
              .single();
            if (data) {
              await this._offline.put(data);
              this._exercises.update(e => e.map(ex => ex.id === op.entityId ? data : ex));
            }
            break;
          }
          case 'delete': {
            await this.client.from('exercises').delete().eq('id', op.entityId);
            await this._offline.delete(op.entityId);
            this._exercises.update(e => e.filter(ex => ex.id !== op.entityId));
            break;
          }
        }
        await this._offline.removePendingOp(op.id);
      } catch {
        op.retryCount++;
        await this._offline.addPendingOp(op);
      }
    }
  }

  private async _createOffline(exercise: Partial<Exercise>): Promise<Exercise> {
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const local: Exercise = {
      id: tempId,
      user_id: null,
      name: exercise.name ?? '',
      description: exercise.description ?? null,
      category: exercise.category ?? null,
      equipment: exercise.equipment ?? null,
      muscle_group: exercise.muscle_group ?? '',
      instructions: exercise.instructions ?? null,
      video_url: exercise.video_url ?? null,
      image_url: exercise.image_url ?? null,
      is_global: false,
      primary_muscles: exercise.primary_muscles ?? null,
      secondary_muscles: exercise.secondary_muscles ?? null,
      created_by: null,
      updated_by: null,
      created_at: now,
      updated_at: now,
    };

    await this._offline.put(local);
    this._exercises.update(e => [local, ...e]);

    await this._offline.addPendingOp({
      id: crypto.randomUUID(),
      type: 'create',
      entityType: 'exercise',
      entityId: tempId,
      payload: exercise,
      createdAt: now,
      retryCount: 0,
    });

    return local;
  }

  private async _updateOffline(id: string, updates: Partial<Exercise>): Promise<Exercise> {
    const existing = await this._offline.getById(id);
    if (!existing) throw new Error('Exercise not found');

    const updated: Exercise = { ...existing, ...updates, updated_at: new Date().toISOString() };
    await this._offline.put(updated);
    this._exercises.update(e => e.map(ex => ex.id === id ? updated : ex));

    await this._offline.addPendingOp({
      id: crypto.randomUUID(),
      type: 'update',
      entityType: 'exercise',
      entityId: id,
      payload: updates,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    });

    return updated;
  }

  private async _deleteOffline(id: string): Promise<void> {
    await this._offline.delete(id);
    this._exercises.update(e => e.filter(ex => ex.id !== id));

    await this._offline.addPendingOp({
      id: crypto.randomUUID(),
      type: 'delete',
      entityType: 'exercise',
      entityId: id,
      payload: {},
      createdAt: new Date().toISOString(),
      retryCount: 0,
    });
  }
}
