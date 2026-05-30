import { Component, inject, signal, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { interval, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { UiButton } from '@shared/ui/button';

@Component({
  selector: 'app-verified-page',
  standalone: true,
  imports: [TranslatePipe, UiButton],
  template: `
    <div class="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 mb-2">
        <img src="icons/icon-96x96.png" alt="GymControl" class="w-14 h-14" />
      </div>

      <div class="animate-check-scale" style="animation-delay: 0ms">
        <svg class="w-20 h-20 sm:w-24 sm:h-24" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="check-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#22c55e" flood-opacity="0.35" />
            </filter>
          </defs>
          <g filter="url(#check-glow)">
            <circle
              cx="40" cy="40" r="35"
              stroke="#22c55e" stroke-width="4"
              stroke-linecap="round"
              class="animate-circle-draw"
            />
            <path
              d="M28 42 L37 51 L53 31"
              stroke="#22c55e" stroke-width="5"
              stroke-linecap="round" stroke-linejoin="round"
              class="animate-check-draw"
            />
          </g>
          <circle
            cx="40" cy="40" r="35"
            fill="none" stroke="#22c55e" stroke-width="4"
            opacity="0"
            class="animate-check-pulse"
            style="animation-delay: 0ms"
          />
        </svg>
      </div>

      <div class="flex flex-col gap-2 max-w-md">
        <h1 class="text-xl font-semibold">{{ 'auth.emailVerified' | translate }}</h1>
        <p class="text-on-surface-secondary text-sm">{{ 'auth.emailVerifiedDesc' | translate }}</p>
      </div>

      <button ui-button variant="primary" size="lg" [full]="false" (clicked)="goToDashboard()">
        {{ 'auth.goToDashboard' | translate }}
      </button>

      @if (countdown() >= 0) {
        <p class="text-on-surface-muted text-sm">
          {{ 'notFound.redirectingHome' | translate: { seconds: countdown() } }}
        </p>
      }
    </div>
  `,
})
export default class VerifiedPage {
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _platformId = inject(PLATFORM_ID);

  protected readonly countdown = signal(5);
  private _hasRedirected = false;

  constructor() {
    this._startCountdown();
  }

  private _startCountdown(): void {
    interval(1000)
      .pipe(take(6), takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          if (!isPlatformBrowser(this._platformId)) return;
          if (document.visibilityState === 'hidden') return;
          this.countdown.update(v => v - 1);
        },
        complete: () => this._redirect(),
      });
  }

  private _redirect(): void {
    if (this._hasRedirected) return;
    this._hasRedirected = true;
    this._router.navigate(['/dashboard']);
  }

  protected goToDashboard(): void {
    this._redirect();
  }
}
