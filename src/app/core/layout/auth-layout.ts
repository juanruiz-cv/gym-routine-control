import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@shared/i18n/translate.pipe';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, TranslatePipe],
  template: `
    <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded-xl focus:outline-none">
      {{ 'common.skipToContent' | translate }}
    </a>
    <div class="flex flex-col min-h-dvh bg-surface text-on-surface">
      <main id="main-content" class="flex-1 flex items-center justify-center px-4 py-8">
        <div class="w-full max-w-sm">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: contents; }
  `],
})
export class AuthLayoutComponent {}
