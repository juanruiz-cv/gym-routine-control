import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '@core/services/supabase.service';
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

  async ngOnInit(): Promise<void> {
    const { data: { session } } = await this._supabase.session;
    if (session) {
      await this._router.navigate(['/dashboard']);
      return;
    }

    this._supabase.client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        this._router.navigate(['/dashboard']);
      } else if (event === 'SIGNED_OUT') {
        this._router.navigate(['/auth/login']);
      }
    });
  }
}
