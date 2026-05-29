import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { SupabaseService } from '@core/services/supabase.service';
import { I18nService } from '@shared/i18n/i18n.service';
import { TranslatePipe } from '@shared/i18n/translate.pipe';

@Component({
  selector: 'app-update-password-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  template: `
    <div class="flex flex-col gap-6 animate-fade-in">
      <div class="text-center">
        <h1 class="text-2xl font-bold">{{ 'auth.updatePasswordTitle' | translate }}</h1>
        <p class="text-on-surface-muted mt-1 text-sm">{{ 'auth.updatePasswordSubtitle' | translate }}</p>
      </div>

      <form (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
        <div>
          <label for="password" class="block text-sm font-medium mb-1.5">{{ 'auth.newPassword' | translate }}</label>
          <input
            id="password"
            type="password"
            [(ngModel)]="password"
            name="password"
            required
            minlength="6"
            autocomplete="new-password"
            [placeholder]="'auth.passwordPlaceholderShort' | translate"
            class="w-full px-4 py-3 rounded-xl bg-surface-input border border-white/10 text-on-surface placeholder:text-on-surface-muted/50 focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium mb-1.5">{{ 'auth.confirmPassword' | translate }}</label>
          <input
            id="confirmPassword"
            type="password"
            [(ngModel)]="confirmPassword"
            name="confirmPassword"
            required
            autocomplete="new-password"
            [placeholder]="'auth.confirmPasswordPlaceholder' | translate"
            class="w-full px-4 py-3 rounded-xl bg-surface-input border border-white/10 text-on-surface placeholder:text-on-surface-muted/50 focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
          />
        </div>

        @if (error()) {
          <div class="text-sm text-error bg-error/10 px-4 py-2.5 rounded-xl" role="alert">{{ error() }}</div>
        }
        @if (successMessage()) {
          <div class="text-sm text-success bg-success/10 px-4 py-2.5 rounded-xl" role="status">{{ successMessage() }}</div>
        }

        <button
          type="submit"
          [disabled]="isLoading() || !password || !confirmPassword"
          class="w-full py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          @if (isLoading()) {
            <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          }
          <span>{{ isLoading() ? ('common.saving' | translate) : ('auth.updatePassword' | translate) }}</span>
        </button>
      </form>

      <div class="text-center text-sm text-on-surface-muted">
        <a routerLink="/auth/login" class="text-brand hover:text-brand-light transition-colors font-medium">
          {{ 'auth.backToLogin' | translate }}
        </a>
      </div>
    </div>
  `,
})
export class UpdatePasswordPage {
  private readonly _supabase = inject(SupabaseService);
  private readonly _router = inject(Router);
  private readonly _i18n = inject(I18nService);

  protected password = '';
  protected confirmPassword = '';
  protected isLoading = signal(false);
  protected error = signal<string | null>(null);
  protected successMessage = signal<string | null>(null);

  protected async onSubmit(): Promise<void> {
    if (!this.password || !this.confirmPassword) return;
    if (this.password !== this.confirmPassword) {
      this.error.set(this._i18n.t('auth.passwordMismatch'));
      return;
    }
    if (this.password.length < 6) {
      this.error.set(this._i18n.t('validation.passwordMin'));
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const { error } = await this._supabase.client.auth.updateUser({ password: this.password });

    if (error) {
      this.error.set(error.message);
    } else {
      this.successMessage.set(this._i18n.t('auth.passwordUpdated'));
      setTimeout(() => this._router.navigate(['/auth/login']), 2000);
    }
    this.isLoading.set(false);
  }
}
