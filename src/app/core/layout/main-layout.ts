import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './bottom-nav';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent],
  template: `
    <div class="flex flex-col min-h-dvh bg-surface text-on-surface">
      <main class="flex-1 pb-20 overflow-y-auto">
        <router-outlet />
      </main>
      <app-bottom-nav />
    </div>
  `,
  styles: [`
    :host { display: contents; }
  `],
})
export class MainLayoutComponent {}
