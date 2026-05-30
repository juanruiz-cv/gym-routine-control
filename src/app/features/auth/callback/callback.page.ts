import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '@core/services/supabase.service';
import { ProfileService } from '@core/services/profile.service';
import { TranslatePipe } from '@shared/i18n/translate.pipe';

@Component({
  selector: 'app-callback-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="flex flex-col items-center justify-center gap-4 py-20 animate-fade-in">
      <div class="w-10 h-10 border-2 border-brand/30 border-t-brand rounded-full animate-spin"></div>
      <p class="text-sm text-on-surface-muted">{{ 'auth.completingSignIn' | translate }}</p>
    </div>
  `,
})
export class CallbackPage implements OnInit {
  private readonly _supabase = inject(SupabaseService);
  private readonly _router = inject(Router);
  private readonly _profile = inject(ProfileService);

  private _navigated = false;

  async ngOnInit(): Promise<void> {
    const url = new URL(this._router.url, window.location.origin);
    const oauthError = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    if (oauthError) {
      await this._router.navigate(['/auth/login'], {
        queryParams: { error: errorDescription || oauthError },
      });
      return;
    }

    const { data: { session } } = await this._supabase.session;
    if (session) {
      await this._profile.ensureProfile(session.user);
      const needsVerification = this._router.url.includes('type=signup') || this._router.url.includes('type=email_change');
      await this._router.navigate(needsVerification ? ['/auth/verified'] : ['/dashboard']);
      return;
    }

    const { data: { subscription } } = this._supabase.client.auth.onAuthStateChange((event, session) => {
      if (this._navigated) return;
      if (event === 'SIGNED_IN' && session) {
        this._navigated = true;
        this._profile.ensureProfile(session.user).then(() => {
          const needsVerification = !!session.user.email_confirmed_at || this._router.url.includes('type=signup');
          this._router.navigate(needsVerification ? ['/auth/verified'] : ['/dashboard']);
        });
      } else if (event === 'SIGNED_OUT') {
        this._navigated = true;
        this._router.navigate(['/auth/login']);
      }
    });

    setTimeout(() => {
      if (!this._navigated) {
        this._navigated = true;
        subscription.unsubscribe();
        this._router.navigate(['/auth/login'], {
          queryParams: { error: 'auth.timeout' },
        });
      }
    }, 15000);
  }
}
