import { Injectable, signal } from '@angular/core';
import { DataService } from './data.service';
import type { MuscleGroupEntity } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class MuscleGroupService extends DataService {
  private readonly _groups = signal<MuscleGroupEntity[]>([]);
  private readonly _loading = signal(false);

  readonly groups = this._groups.asReadonly();
  readonly loading = this._loading.asReadonly();

  async fetchAll(): Promise<MuscleGroupEntity[]> {
    this._loading.set(true);
    try {
      const { data, error } = await this.client
        .from('muscle_groups')
        .select('*')
        .order('name');
      if (error) throw error;
      this._groups.set(data ?? []);
      return data ?? [];
    } finally {
      this._loading.set(false);
    }
  }

  async getNames(): Promise<string[]> {
    const groups = await this.fetchAll();
    return groups.filter(g => g.is_active).map(g => g.name);
  }

  async create(name: string): Promise<MuscleGroupEntity> {
    const { data, error } = await this.client
      .from('muscle_groups')
      .insert({ name })
      .select()
      .single();
    if (error) throw error;
    this._groups.update(g => [...g, data].sort((a, b) => a.name.localeCompare(b.name)));
    return data;
  }

  async updateName(id: string, name: string): Promise<void> {
    const { error } = await this.client
      .from('muscle_groups')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    this._groups.update(g => g.map(mg => mg.id === id ? { ...mg, name } : mg).sort((a, b) => a.name.localeCompare(b.name)));
  }

  async toggleActive(id: string): Promise<void> {
    const current = this._groups().find(g => g.id === id);
    if (!current) return;
    const { error } = await this.client
      .from('muscle_groups')
      .update({ is_active: !current.is_active, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    this._groups.update(g => g.map(mg => mg.id === id ? { ...mg, is_active: !mg.is_active } : mg));
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('muscle_groups')
      .delete()
      .eq('id', id);
    if (error) throw error;
    this._groups.update(g => g.filter(mg => mg.id !== id));
  }
}
