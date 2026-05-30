import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UiCard } from '@shared/ui/card';
import { UiButton } from '@shared/ui/button';
import { UiSkeletonCard, UiSelect, type SelectOption } from '@shared/ui';
import { SupabaseService } from '@core/services/supabase.service';
import { ProfileService } from '@core/services/profile.service';
import { I18nService } from '@shared/i18n/i18n.service';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { LanguageSwitcherComponent } from '@shared/i18n/language-switcher.component';
import { LucideLogOut, LucideUser, LucideTimer, LucideVolume2, LucideSmartphone } from '@lucide/angular';
import type { UserPreferences } from '@shared/models';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    UiCard, UiButton, UiSkeletonCard, UiSelect, TranslatePipe, LanguageSwitcherComponent,
    LucideLogOut, LucideUser, LucideTimer, LucideVolume2, LucideSmartphone,
  ],
  template: `
    <div class="p-4 space-y-5 max-w-lg mx-auto">
      <h1 class="text-xl font-bold">{{ 'settings.title' | translate }}</h1>

      @if (loading()) {
        <div class="flex flex-col gap-4">
          @for (i of [1,2]; track i) {
            <app-ui-skeleton-card height="120px" />
          }
        </div>
      } @else {
        <!-- Profile -->
        <div>
          <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">{{ 'settings.profile' | translate }}</h2>
          <app-ui-card variant="glass">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                <svg lucideUser class="w-6 h-6 text-brand" strokeWidth="1.5"></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium">{{ profileEmail() }}</p>
                <p class="text-xs text-on-surface-muted">{{ 'settings.signedIn' | translate }}</p>
              </div>
            </div>
          </app-ui-card>
        </div>

        <!-- Preferences -->
        <div>
          <h2 class="text-sm font-semibold text-on-surface-secondary mb-3">{{ 'settings.preferences' | translate }}</h2>
          <app-ui-card variant="glass">
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3">
                <svg lucideTimer class="w-5 h-5 text-brand" strokeWidth="1.5"></svg>
                <div class="flex-1">
                  <p class="text-sm font-medium">{{ 'settings.restTimer' | translate }}</p>
                  <p class="text-xs text-on-surface-muted">{{ 'settings.restTimerDesc' | translate }}</p>
                </div>
                <app-ui-select
                  size="sm"
                  [options]="timerOptions"
                  [(value)]="restTimer"
                  (valueChange)="savePreferences()"
                />
              </div>

              <app-language-switcher />

              <div class="flex items-center gap-3">
                <svg lucideVolume2 class="w-5 h-5 text-brand" strokeWidth="1.5"></svg>
                <div class="flex-1">
                  <p class="text-sm font-medium">{{ 'settings.sound' | translate }}</p>
                  <p class="text-xs text-on-surface-muted">{{ 'settings.soundDesc' | translate }}</p>
                </div>
                <button
                  (click)="soundEnabled.set(!soundEnabled()); savePreferences()"
                  role="switch"
                  [attr.aria-checked]="soundEnabled()"
                  [attr.aria-label]="'settings.sound' | translate"
                  class="relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0"
                  [class.bg-brand]="soundEnabled()"
                  [class.bg-white/10]="!soundEnabled()"
                >
                  <div
                    class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                    [style.transform]="soundEnabled() ? 'translateX(24px)' : 'translateX(0)'"
                  ></div>
                </button>
              </div>

              <div class="flex items-center gap-3">
                <svg lucideSmartphone class="w-5 h-5 text-brand" strokeWidth="1.5"></svg>
                <div class="flex-1">
                  <p class="text-sm font-medium">{{ 'settings.vibration' | translate }}</p>
                  <p class="text-xs text-on-surface-muted">{{ 'settings.vibrationDesc' | translate }}</p>
                </div>
                <button
                  (click)="vibrationEnabled.set(!vibrationEnabled()); savePreferences()"
                  role="switch"
                  [attr.aria-checked]="vibrationEnabled()"
                  [attr.aria-label]="'settings.vibration' | translate"
                  class="relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0"
                  [class.bg-brand]="vibrationEnabled()"
                  [class.bg-white/10]="!vibrationEnabled()"
                >
                  <div
                    class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
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
          {{ 'settings.signOut' | translate }}
        </button>
      }
    </div>
  `,
})
export class SettingsPage implements OnInit {
  private readonly _router = inject(Router);
  private readonly _supabase = inject(SupabaseService);
  private readonly _profile = inject(ProfileService);
  private readonly _i18n = inject(I18nService);

  readonly timerOptions: SelectOption[] = [
    { value: '30', label: '30s' },
    { value: '60', label: '60s' },
    { value: '90', label: '90s' },
    { value: '120', label: '120s' },
    { value: '180', label: '180s' },
  ];

  readonly profileEmail = signal('');
  readonly restTimer = signal('90');
  readonly soundEnabled = signal(true);
  readonly vibrationEnabled = signal(true);
  readonly loading = signal(true);

  async ngOnInit(): Promise<void> {
    const { data: { user } } = await this._supabase.client.auth.getUser();
    this.profileEmail.set(user?.email ?? this._i18n.t('settings.unknown'));

    const userId = user?.id;
    if (userId) {
      const prefs = await this._profile.getPreferences(userId);
      if (prefs) {
        this.restTimer.set(prefs.rest_timer?.toString() ?? '90');
        this.soundEnabled.set(prefs.sound_enabled ?? true);
        this.vibrationEnabled.set(prefs.vibration_enabled ?? true);
      }
    }
    this.loading.set(false);
  }

  async savePreferences(): Promise<void> {
    const { data: { user } } = await this._supabase.client.auth.getUser();
    if (!user) return;

    await this._profile.updatePreferences(user.id, {
      theme: 'dark',
      rest_timer: parseInt(this.restTimer()),
      sound_enabled: this.soundEnabled(),
      vibration_enabled: this.vibrationEnabled(),
      language: this._i18n.currentLang(),
    });
  }

  async signOut(): Promise<void> {
    await this._supabase.client.auth.signOut();
    await this._router.navigate(['/auth/login']);
  }
}
