import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { SupabaseService } from '@core/services/supabase.service';
import { LucideLogOut, LucideUser, LucideTimer, LucideVolume2, LucideSmartphone } from '@lucide/angular';
import type { UserPreferences } from '@shared/models';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    UiCard, UiButton,
    LucideLogOut, LucideUser, LucideTimer, LucideVolume2, LucideSmartphone,
  ],
  template: `
    <div class="p-4 space-y-5 max-w-lg mx-auto">
      <h1 class="text-xl font-bold">Settings</h1>

      <!-- Profile -->
      <div>
        <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">Profile</h2>
        <app-ui-card variant="glass">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
              <svg lucideUser class="w-6 h-6 text-brand" strokeWidth="1.5"></svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium">{{ profileEmail() }}</p>
              <p class="text-xs text-on-surface-muted">Signed in</p>
            </div>
          </div>
        </app-ui-card>
      </div>

      <!-- Preferences -->
      <div>
        <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">Preferences</h2>
        <app-ui-card variant="glass">
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <svg lucideTimer class="w-5 h-5 text-brand" strokeWidth="1.5"></svg>
              <div class="flex-1">
                <p class="text-sm font-medium">Rest Timer</p>
                <p class="text-xs text-on-surface-muted">Default rest between sets</p>
              </div>
              <select
                [value]="restTimer()"
                (change)="restTimer.set(($any($event.target)).value); savePreferences()"
                class="px-3 py-1.5 rounded-lg bg-surface-input border border-white/10 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="30">30s</option>
                <option value="60">60s</option>
                <option value="90">90s</option>
                <option value="120">120s</option>
                <option value="180">180s</option>
              </select>
            </div>

            <div class="flex items-center gap-3">
              <svg lucideVolume2 class="w-5 h-5 text-brand" strokeWidth="1.5"></svg>
              <div class="flex-1">
                <p class="text-sm font-medium">Sound</p>
                <p class="text-xs text-on-surface-muted">Play sounds during workout</p>
              </div>
              <button
                (click)="soundEnabled.set(!soundEnabled()); savePreferences()"
                class="relative w-12 h-6 rounded-full transition-colors"
                [class.bg-brand]="soundEnabled()"
                [class.bg-white/10]="!soundEnabled()"
              >
                <div
                  class="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                  [class.left-0.5]="!soundEnabled()"
                  [class.right-0.5]="soundEnabled()"
                  [style.transform]="soundEnabled() ? 'translateX(24px)' : 'translateX(0)'"
                ></div>
              </button>
            </div>

            <div class="flex items-center gap-3">
              <svg lucideSmartphone class="w-5 h-5 text-brand" strokeWidth="1.5"></svg>
              <div class="flex-1">
                <p class="text-sm font-medium">Vibration</p>
                <p class="text-xs text-on-surface-muted">Vibrate on timer end</p>
              </div>
              <button
                (click)="vibrationEnabled.set(!vibrationEnabled()); savePreferences()"
                class="relative w-12 h-6 rounded-full transition-colors"
                [class.bg-brand]="vibrationEnabled()"
                [class.bg-white/10]="!vibrationEnabled()"
              >
                <div
                  class="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                  [class.left-0.5]="!vibrationEnabled()"
                  [class.right-0.5]="vibrationEnabled()"
                  [style.transform]="vibrationEnabled() ? 'translateX(24px)' : 'translateX(0)'"
                ></div>
              </button>
            </div>
          </div>
        </app-ui-card>
      </div>

      <!-- Sign Out -->
      <button ui-button variant="danger" size="md" class="w-full" (click)="signOut()">
        <svg lucideLogOut class="w-4 h-4" strokeWidth="2"></svg>
        Sign Out
      </button>
    </div>
  `,
})
export class SettingsPage implements OnInit {
  private readonly _router = inject(Router);
  private readonly _supabase = inject(SupabaseService);

  readonly profileEmail = signal('');
  readonly restTimer = signal('90');
  readonly soundEnabled = signal(true);
  readonly vibrationEnabled = signal(true);

  async ngOnInit(): Promise<void> {
    const { data: { user } } = await this._supabase.client.auth.getUser();
    this.profileEmail.set(user?.email ?? 'Unknown');

    const userId = user?.id;
    if (userId) {
      const { data } = await this._supabase.client
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (data?.preferences) {
        const prefs = data.preferences as UserPreferences;
        this.restTimer.set(prefs.rest_timer?.toString() ?? '90');
        this.soundEnabled.set(prefs.sound_enabled ?? true);
        this.vibrationEnabled.set(prefs.vibration_enabled ?? true);
      }
    }
  }

  async savePreferences(): Promise<void> {
    const { data: { user } } = await this._supabase.client.auth.getUser();
    if (!user) return;

    await this._supabase.client.from('profiles').upsert({
      id: user.id,
      preferences: {
        theme: 'dark',
        rest_timer: parseInt(this.restTimer()),
        sound_enabled: this.soundEnabled(),
        vibration_enabled: this.vibrationEnabled(),
      } satisfies UserPreferences,
    });
  }

  async signOut(): Promise<void> {
    await this._supabase.client.auth.signOut();
    await this._router.navigate(['/auth/login']);
  }
}
