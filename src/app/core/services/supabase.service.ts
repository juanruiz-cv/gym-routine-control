import { Injectable } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly _client: SupabaseClient;

  constructor() {
    this._client = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  get client(): SupabaseClient {
    return this._client;
  }

  get session() {
    return this._client.auth.getSession();
  }

  onAuthStateChange() {
    return this._client.auth.onAuthStateChange((event, session) => ({ event, session }));
  }
}
