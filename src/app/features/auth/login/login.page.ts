import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { LucideEye, LucideEyeOff, LucideLogIn } from '@lucide/angular';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, LucideEye, LucideEyeOff, LucideLogIn],
  template: `
    <div class="flex flex-col gap-6 animate-fade-in">
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 mb-4">
          <img src="icons/icon-96x96.png" alt="GymControl" class="w-14 h-14" />
        </div>
        <h1 class="text-2xl font-bold">{{ 'auth.welcomeBack' | translate }}</h1>
        <p class="text-on-surface-muted mt-1 text-sm">{{ 'auth.subtitle' | translate }}</p>
      </div>

      <form (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
        <div>
          <label for="email" class="block text-sm font-medium mb-1.5">{{ 'auth.email' | translate }}</label>
          <input
            id="email"
            type="email"
            [(ngModel)]="email"
            name="email"
            required
            autocomplete="email"
            [placeholder]="'auth.emailPlaceholder' | translate"
            class="w-full px-4 py-3 rounded-xl bg-surface-input border border-white/10 text-on-surface placeholder:text-on-surface-muted/50 focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium mb-1.5">{{ 'auth.password' | translate }}</label>
          <div class="relative">
            <input
              id="password"
              [type]="showPassword() ? 'text' : 'password'"
              [(ngModel)]="password"
              name="password"
              required
              autocomplete="current-password"
              [placeholder]="'auth.passwordPlaceholder' | translate"
              class="w-full px-4 py-3 pr-12 rounded-xl bg-surface-input border border-white/10 text-on-surface placeholder:text-on-surface-muted/50 focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
            />
            <button
              type="button"
              (click)="togglePassword()"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-muted hover:text-on-surface transition-colors p-1"
              [attr.aria-label]="showPassword() ? ('auth.hidePassword' | translate) : ('auth.showPassword' | translate)"
            >
              @if (showPassword()) {
                <svg lucideEyeOff class="w-5 h-5"></svg>
              } @else {
                <svg lucideEye class="w-5 h-5"></svg>
              }
            </button>
          </div>
        </div>

        @if (error()) {
          <div class="text-sm text-error bg-error/10 px-4 py-2.5 rounded-xl" role="alert">
            {{ error() }}
          </div>
        }

        <button
          type="submit"
          [disabled]="isLoading()"
          class="w-full py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          @if (isLoading()) {
            <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          } @else {
            <svg lucideLogIn class="w-[18px] h-[18px]" strokeWidth="2"></svg>
          }
          <span>{{ isLoading() ? ('auth.signingIn' | translate) : ('auth.signIn' | translate) }}</span>
        </button>
      </form>

      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-white/10"></div>
        </div>
        <div class="relative flex justify-center">
          <span class="px-3 text-xs text-on-surface-muted bg-surface">{{ 'auth.orContinueWith' | translate }}</span>
        </div>
      </div>

      <button
        (click)="onGoogleSignIn()"
        [disabled]="isLoading()"
        class="w-full py-3 rounded-xl border border-white/10 text-on-surface font-medium hover:bg-surface-hover transition-colors flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>{{ 'auth.signInGoogle' | translate }}</span>
      </button>

      <div class="text-center text-sm">
        <a routerLink="/auth/forgot-password" class="text-brand hover:text-brand-light transition-colors">
          {{ 'auth.forgotPassword' | translate }}
        </a>
      </div>

      <div class="text-center text-sm text-on-surface-muted">
        {{ 'auth.noAccount' | translate }}
        <a routerLink="/auth/register" class="text-brand hover:text-brand-light transition-colors font-medium">
          {{ 'auth.signUp' | translate }}
        </a>
      </div>
    </div>
  `,
})
export class LoginPage {
  private readonly _auth = inject(AuthService);

  protected email = '';
  protected password = '';
  protected showPassword = signal(false);
  protected isLoading = signal(false);
  protected error = signal<string | null>(null);

  protected togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  protected async onSubmit(): Promise<void> {
    if (!this.email || !this.password) return;
    this.isLoading.set(true);
    this.error.set(null);
    const { error } = await this._auth.signIn(this.email, this.password);
    if (error) this.error.set(error.message);
    this.isLoading.set(false);
  }

  protected async onGoogleSignIn(): Promise<void> {
    this.isLoading.set(true);
    await this._auth.signInWithGoogle();
    this.isLoading.set(false);
  }
}
