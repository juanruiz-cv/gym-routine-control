import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { LucideLayoutDashboard, LucideDumbbell, LucideListOrdered, LucideBarChart3, LucideSettings } from '@lucide/angular';

interface NavItem {
  key: string;
  route: string;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe, LucideLayoutDashboard, LucideDumbbell, LucideListOrdered, LucideBarChart3, LucideSettings],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-surface-elevated border-t border-white/10 safe-area-bottom">
      <div class="flex items-center justify-around h-16 max-w-lg mx-auto">
        @for (item of navItems(); track item.route) {
          <a
            [routerLink]="[item.route]"
            routerLinkActive="text-brand"
            #rla="routerLinkActive"
            [class.text-brand]="rla.isActive"
            [class.text-on-surface-muted]="!rla.isActive"
            class="flex flex-col items-center gap-0.5 text-xs font-medium transition-colors duration-200"
          >
            @switch (item.key) {
              @case ('nav.dashboard') { <svg lucideLayoutDashboard class="w-[22px] h-[22px]" strokeWidth="1.5"></svg> }
              @case ('nav.routines') { <svg lucideListOrdered class="w-[22px] h-[22px]" strokeWidth="1.5"></svg> }
              @case ('nav.exercises') { <svg lucideDumbbell class="w-[22px] h-[22px]" strokeWidth="1.5"></svg> }
              @case ('nav.metrics') { <svg lucideBarChart3 class="w-[22px] h-[22px]" strokeWidth="1.5"></svg> }
              @case ('nav.settings') { <svg lucideSettings class="w-[22px] h-[22px]" strokeWidth="1.5"></svg> }
            }
            <span>{{ item.key | translate }}</span>
          </a>
        }
      </div>
    </nav>
  `,
})
export class BottomNavComponent {
  protected readonly navItems = signal<NavItem[]>([
    { key: 'nav.dashboard', route: '/dashboard' },
    { key: 'nav.routines', route: '/routines' },
    { key: 'nav.exercises', route: '/exercises' },
    { key: 'nav.metrics', route: '/metrics' },
    { key: 'nav.settings', route: '/settings' },
  ]);
}
