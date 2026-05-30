import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@env/environment';

const SSR_STORAGE = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly _client: SupabaseClient;

  constructor() {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    this._client = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: isBrowser,
        autoRefreshToken: isBrowser,
        detectSessionInUrl: isBrowser,
        storage: isBrowser ? undefined : SSR_STORAGE,
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
