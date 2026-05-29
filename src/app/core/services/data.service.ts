import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class DataService {
  protected readonly _supabase = inject(SupabaseService);

  protected get client() {
    return this._supabase.client;
  }

  protected get userId() {
    return this._supabase.client.auth.getSession().then(({ data }) => data.session?.user.id);
  }

  protected async checkUserId(): Promise<string> {
    const id = await this.userId;
    if (!id) throw new Error('Not authenticated');
    return id;
  }
}
