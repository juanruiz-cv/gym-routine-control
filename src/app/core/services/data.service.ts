import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class DataService {
  protected readonly _platformId = inject(PLATFORM_ID);
  protected readonly _supabase = inject(SupabaseService);

  protected get client() {
    return this._supabase.client;
  }

  protected get userId() {
    return this._supabase.client.auth.getSession().then(({ data }) => data.session?.user.id);
  }

  protected async checkUserId(): Promise<string> {
    const id = await this.userId;
    if (id) return id;
    if (isPlatformServer(this._platformId)) return '';
    throw new Error('Not authenticated');
  }
}
