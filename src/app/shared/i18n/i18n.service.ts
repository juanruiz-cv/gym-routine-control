import { Injectable, signal, inject, isDevMode, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { SupabaseService } from '@core/services/supabase.service';
import type { UserPreferences } from '@shared/models';

export type SupportedLang = 'es' | 'en';

const FALLBACK_TRANSLATIONS: Record<string, string> = {};

function resolveKey(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function humanizeKey(key: string): string {
  const lastSegment = key.split('.').pop() ?? key;
  return lastSegment
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _supabase = inject(SupabaseService);
  private readonly _platformId = inject(PLATFORM_ID);

  readonly currentLang = signal<SupportedLang>('es');
  readonly translations = signal<Record<string, string>>(FALLBACK_TRANSLATIONS);
  readonly ready = signal(false);

  private _loaded = false;

  async init(): Promise<void> {
    const stored = this._loadFromStorage();
    const lang = stored ?? 'es';
    this.currentLang.set(lang);
    await this._fetchTranslations(lang);
    this._loaded = true;
    this.ready.set(true);
    if (!isPlatformServer(this._platformId)) {
      document.documentElement.lang = lang;
    }
  }

  t(key: string): string {
    const t = this.translations();
    if (t[key]) return t[key];
    const nested = resolveKey(t, key);
    if (typeof nested === 'string') return nested;
    if (isDevMode() && this.ready()) console.warn(`[i18n] Missing translation key: ${key}`);
    return humanizeKey(key);
  }

  async setLanguage(lang: SupportedLang): Promise<void> {
    if (lang === this.currentLang()) return;
    this.currentLang.set(lang);
    this._saveToStorage(lang);
    await this._fetchTranslations(lang);
    await this._saveToProfile(lang);
    if (!isPlatformServer(this._platformId)) {
      document.documentElement.lang = lang;
    }
  }

  private async _fetchTranslations(lang: SupportedLang): Promise<void> {
    if (isPlatformServer(this._platformId)) {
      this.translations.set({});
      this.ready.set(true);
      return;
    }
    try {
      const response = await fetch(`/assets/i18n/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load ${lang}.json`);
      const data = await response.json();
      this.translations.set(data);
    } catch {
      if (isDevMode()) console.warn(`[i18n] Failed to load ${lang}.json`);
      if (lang !== 'en') {
        try {
          const fallback = await fetch('/assets/i18n/en.json').then(r => r.json());
          this.translations.set(fallback);
        } catch {
          if (isDevMode()) console.warn('[i18n] Failed to load any translations');
        }
      } else {
        try {
          const fallback = await fetch('/assets/i18n/es.json').then(r => r.json());
          this.translations.set(fallback);
        } catch {
          if (isDevMode()) console.warn('[i18n] Failed to load any translations');
        }
      }
    }
  }

  private _loadFromStorage(): SupportedLang | null {
    if (isPlatformServer(this._platformId)) return null;
    try {
      const v = localStorage.getItem('gym-lang') as SupportedLang | null;
      if (v === 'es' || v === 'en') return v;
    } catch { /* noop */ }
    return null;
  }

  private _saveToStorage(lang: SupportedLang): void {
    if (isPlatformServer(this._platformId)) return;
    try { localStorage.setItem('gym-lang', lang); } catch { /* noop */ }
  }

  private async _saveToProfile(lang: SupportedLang): Promise<void> {
    if (isPlatformServer(this._platformId)) return;
    const { data: { user } } = await this._supabase.client.auth.getUser();
    if (!user) return;
    const { data } = await this._supabase.client
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();
    const prefs = (data?.preferences ?? {}) as UserPreferences;
    await this._supabase.client.from('profiles').upsert({
      id: user.id,
      preferences: { ...prefs, language: lang },
    });
  }

  async loadFromProfile(): Promise<void> {
    if (isPlatformServer(this._platformId) || this._loaded) return;
    const { data: { user } } = await this._supabase.client.auth.getUser();
    if (!user) return;
    const { data } = await this._supabase.client
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();
    const prefs = data?.preferences as UserPreferences | undefined;
    if (prefs?.language && (prefs.language === 'es' || prefs.language === 'en')) {
      await this.setLanguage(prefs.language);
    }
  }
}
