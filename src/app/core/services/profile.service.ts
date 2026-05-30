import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import type { Profile, UserPreferences } from '@shared/models';
import type { User } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class ProfileService extends DataService {
  async getCurrentUser() {
    return this.client.auth.getUser();
  }

  async getProfile(id: string): Promise<Profile | null> {
    const { data } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    return data as Profile | null;
  }

  async ensureProfile(user: User): Promise<void> {
    const { data: existing } = await this.client
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existing) return;

    const { error } = await this.client.from('profiles').insert({
      id: user.id,
      display_name:
        (user.user_metadata?.['name'] as string) ??
        user.email?.split('@')[0] ??
        null,
      avatar_url: (user.user_metadata?.['picture'] as string) ?? null,
    });

    if (error && error.code !== '23505') {
      console.error('ProfileService.ensureProfile error:', error);
    }
  }

  async getPreferences(id: string): Promise<UserPreferences | null> {
    const { data } = await this.client
      .from('profiles')
      .select('preferences')
      .eq('id', id)
      .single();
    return (data?.preferences as UserPreferences) ?? null;
  }

  async updatePreferences(
    id: string,
    prefs: Partial<UserPreferences>,
  ): Promise<void> {
    await this.client.from('profiles').upsert(
      { id, preferences: prefs },
      { onConflict: 'id' },
    );
  }
}
