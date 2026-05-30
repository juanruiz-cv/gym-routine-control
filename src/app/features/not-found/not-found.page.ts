import { Component, inject, signal, computed, effect, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { Router } from '@angular/router';
import { interval, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/auth/auth.service';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { UiButton } from '@shared/ui/button';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [TranslatePipe, UiButton],
  template: `
    <div class="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div class="w-24 h-24 sm:w-32 sm:h-32 animate-plate-spin animate-plate-float">
        <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="plate-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#f97316" flood-opacity="0.4" />
            </filter>
          </defs>
          <g filter="url(#plate-glow)">
            <circle cx="48" cy="48" r="40" stroke="#f97316" stroke-width="8" fill="none" opacity="0.8" />
            <circle cx="48" cy="48" r="28" stroke="#f97316" stroke-width="3" fill="none" opacity="0.5" />
            <circle cx="48" cy="48" r="28" fill="#f97316" fill-opacity="0.08" />
            <circle cx="48" cy="48" r="10" fill="#0f0f13" />
            @for (angle of gripAngles; track angle) {
              <rect
                x="44" [attr.y]="10"
                width="8" height="14" rx="4"
                fill="#0f0f13"
                [attr.transform]="'rotate(' + angle + ', 48, 48)'"
              />
            }
          </g>
        </svg>
      </div>

      <h1 class="text-7xl sm:text-8xl font-bold tracking-tighter text-gradient">{{ 'notFound.title' | translate }}</h1>

      <div class="flex flex-col gap-2 max-w-md">
        <h2 class="text-xl font-semibold">{{ 'notFound.heading' | translate }}</h2>
        <p class="text-on-surface-secondary text-sm">{{ 'notFound.description' | translate }}</p>
        <p class="text-on-surface-muted text-sm italic">{{ 'notFound.easterEgg' | translate }}</p>
      </div>

      <div class="bg-white/5 border border-white/5 rounded-lg px-4 py-2.5 text-xs font-mono text-on-surface-muted max-w-full">
        <span class="text-on-surface-secondary font-medium">{{ 'notFound.requestedUrl' | translate }}</span>
        <br />
        <code class="break-all">{{ sanitizedUrl() }}</code>
      </div>

      <div class="flex gap-3 flex-col sm:flex-row w-full max-w-xs">
        <button ui-button variant="primary" size="lg" [full]="true" (clicked)="goHome()">
          @if (isAuthenticated()) {
            {{ 'notFound.goHome' | translate }}
          } @else {
            {{ 'notFound.goLogin' | translate }}
          }
        </button>
        <button ui-button variant="secondary" size="lg" [full]="true" (clicked)="goBack()">
          {{ 'notFound.goBack' | translate }}
        </button>
      </div>

      @if (!_auth.loading() && countdown() >= 0) {
        <p class="text-on-surface-muted text-sm">
          @if (isAuthenticated()) {
            {{ 'notFound.redirectingHome' | translate: { seconds: countdown() } }}
          } @else {
            {{ 'notFound.redirectingLogin' | translate: { seconds: countdown() } }}
          }
        </p>
      }
    </div>
  `,
})
export default class NotFoundPage {
  protected readonly _auth = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _location = inject(Location);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _platformId = inject(PLATFORM_ID);

  protected readonly isAuthenticated = this._auth.isAuthenticated;
  protected readonly countdown = signal(5);

  protected readonly gripAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  protected readonly sanitizedUrl = computed(() => {
    const raw = this._router.url;
    const cleaned = raw.replace(/([?&])(access_token|token|secret|code)=[^&]+/gi, '$1$2=***');
    return cleaned.length > 80 ? cleaned.slice(0, 77) + '...' : cleaned;
  });

  private _hasRedirected = false;
  private _countdownStarted = false;

  constructor() {
    effect(() => {
      if (this._auth.loading() || this._countdownStarted) return;
      this._countdownStarted = true;
      this._startCountdown();
    });
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
    const target = this.isAuthenticated() ? '/dashboard' : '/auth/login';
    this._router.navigate([target]);
  }

  protected goHome(): void {
    this._redirect();
  }

  protected goBack(): void {
    if (isPlatformBrowser(this._platformId) && window.history.length > 1) {
      this._location.back();
    } else {
      this._redirect();
    }
  }
}
