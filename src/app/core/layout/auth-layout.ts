import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="flex flex-col min-h-dvh bg-surface text-on-surface">
      <div class="flex-1 flex items-center justify-center px-4 py-8">
        <div class="w-full max-w-sm">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
  `],
})
export class AuthLayoutComponent {}
