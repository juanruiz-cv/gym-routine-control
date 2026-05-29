import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import type { User, Session } from '@supabase/supabase-js';
import { SupabaseService } from '../services/supabase.service';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _supabase = inject(SupabaseService);
  private readonly _router = inject(Router);

  private readonly _state = signal<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  readonly user = computed(() => this._state().user);
  readonly session = computed(() => this._state().session);
  readonly loading = computed(() => this._state().loading);
  readonly isAuthenticated = computed(() => !!this._state().user);

  constructor() {
    this._supabase.client.auth.onAuthStateChange((_event, session) => {
      this._state.set({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });

    this._supabase.session.then(({ data: { session } }) => {
      this._state.set({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });
  }

  async signUp(email: string, password: string): Promise<{ error: Error | null; needsEmailConfirmation?: boolean }> {
    const result = await this._supabase.client.auth.signUp({ email, password });

    if (!result.error && result.data.user) {
      const { error: profileError } = await this._supabase.client.from('profiles').insert({
        id: result.data.user.id,
        email: result.data.user.email,
        created_at: new Date().toISOString(),
        preferences: {},
      }).maybeSingle();

      if (profileError && profileError.code !== '23505') {
        console.error('Profile creation error:', profileError);
      }
    }

    return {
      error: result.error,
      needsEmailConfirmation: !!result.data?.user?.identities?.length,
    };
  }

  async signIn(email: string, password: string): Promise<{ error: Error | null }> {
    const result = await this._supabase.client.auth.signInWithPassword({ email, password });
    if (result.data.session) {
      await this._router.navigate(['/dashboard']);
    }
    return { error: result.error };
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await this._supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Google OAuth error:', error.message);
    }
  }

  async signOut(): Promise<void> {
    await this._supabase.client.auth.signOut();
    await this._router.navigate(['/auth/login']);
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    const { error } = await this._supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    return { error };
  }

  async getSessionToken(): Promise<string | null> {
    const { data } = await this._supabase.session;
    return data.session?.access_token ?? null;
  }
}
