import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './bottom-nav';
import { SidebarNavComponent } from './sidebar-nav';
import { TranslatePipe } from '@shared/i18n/translate.pipe';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent, SidebarNavComponent, TranslatePipe],
  template: `
    <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded-xl focus:outline-none">
      {{ 'common.skipToContent' | translate }}
    </a>
    <div class="flex min-h-dvh bg-surface text-on-surface">
      <app-sidebar-nav />
      <div class="flex flex-col flex-1 min-w-0">
        <main id="main-content" class="flex-1 pb-20 lg:pb-0 overflow-y-auto">
          <router-outlet />
        </main>
        <app-bottom-nav class="lg:hidden" />
      </div>
    </div>
  `,
  styles: [`
    :host { display: contents; }
  `],
})
export class MainLayoutComponent {}
