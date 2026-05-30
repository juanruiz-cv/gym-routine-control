import { Injectable, signal } from '@angular/core';
import { DataService } from './data.service';
import type { EquipmentTypeEntity } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class EquipmentService extends DataService {
  private readonly _types = signal<EquipmentTypeEntity[]>([]);
  private readonly _loading = signal(false);

  readonly types = this._types.asReadonly();
  readonly loading = this._loading.asReadonly();

  async fetchAll(): Promise<EquipmentTypeEntity[]> {
    this._loading.set(true);
    try {
      const { data, error } = await this.client
        .from('equipment_types')
        .select('*')
        .order('name');
      if (error) throw error;
      this._types.set(data ?? []);
      return data ?? [];
    } finally {
      this._loading.set(false);
    }
  }

  async getNames(): Promise<string[]> {
    const types = await this.fetchAll();
    return types.filter(t => t.is_active).map(t => t.name);
  }

  async create(name: string): Promise<EquipmentTypeEntity> {
    const { data, error } = await this.client
      .from('equipment_types')
      .insert({ name })
      .select()
      .single();
    if (error) throw error;
    this._types.update(t => [...t, data].sort((a, b) => a.name.localeCompare(b.name)));
    return data;
  }

  async updateName(id: string, name: string): Promise<void> {
    const { error } = await this.client
      .from('equipment_types')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    this._types.update(t => t.map(eq => eq.id === id ? { ...eq, name } : eq).sort((a, b) => a.name.localeCompare(b.name)));
  }

  async toggleActive(id: string): Promise<void> {
    const current = this._types().find(t => t.id === id);
    if (!current) return;
    const { error } = await this.client
      .from('equipment_types')
      .update({ is_active: !current.is_active, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    this._types.update(t => t.map(eq => eq.id === id ? { ...eq, is_active: !eq.is_active } : eq));
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('equipment_types')
      .delete()
      .eq('id', id);
    if (error) throw error;
    this._types.update(t => t.filter(eq => eq.id !== id));
  }
}
