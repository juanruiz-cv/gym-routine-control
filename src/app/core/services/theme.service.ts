import { Injectable, signal, computed, effect } from '@angular/core';

export type ThemeMode = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _mode = signal<ThemeMode>('system');
  private readonly _systemPrefersDark = signal(true);
  private _mediaQuery: MediaQueryList | null = null;

  readonly mode = this._mode.asReadonly();

  readonly effective = computed(() => {
    const m = this._mode();
    if (m === 'system') return this._systemPrefersDark() ? 'dark' : 'light';
    return m;
  });

  constructor() {
    if (typeof window !== 'undefined') {
      this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this._systemPrefersDark.set(this._mediaQuery.matches);
      this._mediaQuery.addEventListener('change', (e) => {
        this._systemPrefersDark.set(e.matches);
        if (this._mode() === 'system') this._apply();
      });
    }
    effect(() => this._apply());
  }

  init(): void {
    const stored = typeof localStorage !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEY) as ThemeMode | null)
      : null;
    this._mode.set(stored ?? 'system');
  }

  setMode(mode: ThemeMode): void {
    this._mode.set(mode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }

  private _apply(): void {
    if (typeof document === 'undefined') return;
    const theme = this.effective();
    document.documentElement.classList.toggle('light', theme === 'light');
  }
}
