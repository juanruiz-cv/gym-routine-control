import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { I18nService } from '@shared/i18n/i18n.service';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { LucideArrowLeft, LucideMail, LucideSend } from '@lucide/angular';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, LucideArrowLeft, LucideMail, LucideSend],
  template: `
    <div class="flex flex-col gap-6 animate-fade-in">
      <div class="text-center">
        <a routerLink="/auth/login" class="inline-flex items-center text-sm text-on-surface-muted hover:text-on-surface transition-colors mb-6">
          <svg lucideArrowLeft class="w-4 h-4 mr-1" strokeWidth="1.5"></svg>
          {{ 'auth.backToLogin' | translate }}
        </a>
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 mb-4">
          <svg lucideMail class="w-8 h-8 text-brand" strokeWidth="1.5"></svg>
        </div>
        <h1 class="text-2xl font-bold">{{ 'auth.resetPassword' | translate }}</h1>
        <p class="text-on-surface-muted mt-1 text-sm">{{ 'auth.resetSubtitle' | translate }}</p>
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

        @if (error()) {
          <div class="text-sm text-error bg-error/10 px-4 py-2.5 rounded-xl" role="alert">{{ error() }}</div>
        }
        @if (successMessage()) {
          <div class="text-sm text-success bg-success/10 px-4 py-2.5 rounded-xl" role="status">{{ successMessage() }}</div>
        }

        <button
          type="submit"
          [disabled]="isLoading() || !email"
          class="w-full py-3 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          @if (isLoading()) {
            <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          } @else {
            <svg lucideSend class="w-[18px] h-[18px]" strokeWidth="2"></svg>
          }
          <span>{{ isLoading() ? ('auth.sending' | translate) : ('auth.sendResetLink' | translate) }}</span>
        </button>
      </form>
    </div>
  `,
})
export class ForgotPasswordPage {
  private readonly _auth = inject(AuthService);
  private readonly _i18n = inject(I18nService);
  protected email = '';
  protected isLoading = signal(false);
  protected error = signal<string | null>(null);
  protected successMessage = signal<string | null>(null);

  protected async onSubmit(): Promise<void> {
    if (!this.email) return;
    this.isLoading.set(true); this.error.set(null); this.successMessage.set(null);
    const { error } = await this._auth.resetPassword(this.email);
    if (error) this.error.set(error.message);
    else this.successMessage.set(this._i18n.t('auth.resetSent'));
    this.isLoading.set(false);
  }
}
