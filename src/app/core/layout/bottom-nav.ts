import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PermissionService } from '@core/services/permission.service';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { DragScrollDirective } from '@shared/directives/drag-scroll';
import { LucideLayoutDashboard, LucideDumbbell, LucideListOrdered, LucideBarChart3, LucideSettings, LucideShield, LucideUserCog } from '@lucide/angular';

interface NavItem {
  key: string;
  route: string;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe, DragScrollDirective,
    LucideLayoutDashboard, LucideDumbbell, LucideListOrdered, LucideBarChart3, LucideSettings, LucideShield, LucideUserCog],
  template: `
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-surface-elevated border-t border-white/10 safe-area-bottom">
      <div
        class="flex items-center h-16 overflow-x-auto no-scrollbar snap-x snap-mandatory px-2"
        style="mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%); -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);"
        appDragScroll
      >
        @for (item of navItems(); track item.route) {
          <a
            [routerLink]="[item.route]"
            routerLinkActive=""
            #rla="routerLinkActive"
            [attr.aria-current]="rla.isActive ? 'page' : null"
            [class]="navItemClass(rla.isActive)"
          >
            <span class="w-4 h-[2.5px] rounded-full bg-brand transition-opacity duration-300"
              [class.opacity-0]="!rla.isActive"
              [class.opacity-100]="rla.isActive"></span>
            @switch (item.key) {
              @case ('nav.dashboard') { <svg lucideLayoutDashboard class="w-[22px] h-[22px]" strokeWidth="1.5" aria-hidden="true"></svg> }
              @case ('nav.routines') { <svg lucideListOrdered class="w-[22px] h-[22px]" strokeWidth="1.5" aria-hidden="true"></svg> }
              @case ('nav.exercises') { <svg lucideDumbbell class="w-[22px] h-[22px]" strokeWidth="1.5" aria-hidden="true"></svg> }
              @case ('nav.metrics') { <svg lucideBarChart3 class="w-[22px] h-[22px]" strokeWidth="1.5" aria-hidden="true"></svg> }
              @case ('nav.admin') { <svg lucideShield class="w-[22px] h-[22px]" strokeWidth="1.5" aria-hidden="true"></svg> }
              @case ('nav.staff') { <svg lucideUserCog class="w-[22px] h-[22px]" strokeWidth="1.5" aria-hidden="true"></svg> }
              @case ('nav.settings') { <svg lucideSettings class="w-[22px] h-[22px]" strokeWidth="1.5" aria-hidden="true"></svg> }
            }
            <span>{{ item.key | translate }}</span>
          </a>
        }
      </div>
    </nav>
  `,
})
export class BottomNavComponent {
  private readonly _perm = inject(PermissionService);

  protected navItemClass(isActive: boolean): string {
    const base = 'flex flex-col items-center gap-[3px] text-[11px] font-medium transition-all duration-200 shrink-0 flex-1 min-w-[80px] max-w-[108px] snap-center rounded-xl py-1.5';
    return isActive
      ? base + ' text-brand bg-brand/8'
      : base + ' text-on-surface-muted hover:bg-surface-hover/40';
  }

  protected readonly navItems = computed<NavItem[]>(() => {
    const r = this._perm.role();
    const items: NavItem[] = [
      { key: 'nav.dashboard', route: '/dashboard' },
    ];
    if (r === 'admin' || r === 'staff') {
      items.push({ key: 'nav.staff', route: '/staff/dashboard' });
    }
    items.push(
      { key: 'nav.routines', route: '/routines' },
      { key: 'nav.exercises', route: '/exercises' },
      { key: 'nav.metrics', route: '/metrics' },
    );
    if (r === 'admin') {
      items.push({ key: 'nav.admin', route: '/admin/dashboard' });
    }
    items.push({ key: 'nav.settings', route: '/settings' });
    return items;
  });
}
