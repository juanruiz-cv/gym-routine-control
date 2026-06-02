import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PermissionService } from '@core/services/permission.service';
import { AuthService } from '@core/auth/auth.service';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { UiAvatar } from '@shared/ui/avatar';
import { UiBadge } from '@shared/ui/badge';
import { getNavItems } from './nav-items';
import {
  LucideLayoutDashboard, LucideDumbbell, LucideListOrdered, LucideBarChart3,
  LucideSettings, LucideShield, LucideUserCog, LucideChevronLeft, LucideChevronRight, LucideHistory,
} from '@lucide/angular';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive, TranslatePipe, UiAvatar, UiBadge,
    LucideLayoutDashboard, LucideDumbbell, LucideListOrdered, LucideBarChart3,
    LucideSettings, LucideShield, LucideUserCog, LucideChevronLeft, LucideChevronRight, LucideHistory,
  ],
  template: `
    <nav
      class="hidden lg:flex flex-col h-dvh bg-surface-elevated border-r border-border shrink-0 transition-[width] duration-300 ease-out"
      [class.w-60]="!collapsed()"
      [class.w-[72px]]="collapsed()"
      aria-label="Navegación principal"
    >
      <div class="flex items-center gap-3 h-14 shrink-0 border-b border-white/5"
        [class.justify-center]="collapsed()"
        [class.px-0]="collapsed()"
        [class.px-3]="!collapsed()">
        <div class="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shrink-0">
          <svg lucideDumbbell class="w-4 h-4 text-white" strokeWidth="2.5" aria-hidden="true"></svg>
        </div>
        @if (!collapsed()) {
          <span class="font-bold text-sm whitespace-nowrap">GymControl</span>
        }
      </div>

      <div class="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-0.5">
        @for (item of navItems(); track item.route) {
          <a
            [routerLink]="[item.route]"
            routerLinkActive=""
            #rla="routerLinkActive"
            [attr.aria-current]="rla.isActive ? 'page' : null"
            [class]="navItemClass(rla.isActive)"
            [attr.title]="collapsed() ? (item.key | translate) : null"
          >
            <span class="w-6 h-6 flex items-center justify-center shrink-0">
              @switch (item.key) {
                @case ('nav.dashboard') { <svg lucideLayoutDashboard class="w-5 h-5" strokeWidth="1.5" aria-hidden="true"></svg> }
                @case ('nav.routines') { <svg lucideListOrdered class="w-5 h-5" strokeWidth="1.5" aria-hidden="true"></svg> }
                @case ('nav.history') { <svg lucideHistory class="w-5 h-5" strokeWidth="1.5" aria-hidden="true"></svg> }
                @case ('nav.exercises') { <svg lucideDumbbell class="w-5 h-5" strokeWidth="1.5" aria-hidden="true"></svg> }
                @case ('nav.metrics') { <svg lucideBarChart3 class="w-5 h-5" strokeWidth="1.5" aria-hidden="true"></svg> }
                @case ('nav.admin') { <svg lucideShield class="w-5 h-5" strokeWidth="1.5" aria-hidden="true"></svg> }
                @case ('nav.staff') { <svg lucideUserCog class="w-5 h-5" strokeWidth="1.5" aria-hidden="true"></svg> }
                @case ('nav.settings') { <svg lucideSettings class="w-5 h-5" strokeWidth="1.5" aria-hidden="true"></svg> }
              }
            </span>
            @if (!collapsed()) {
              <span class="text-sm whitespace-nowrap">{{ item.key | translate }}</span>
            }
            @if (collapsed()) {
              <span
                class="absolute left-[72px] ml-1.5 px-2 py-1 bg-surface-elevated border border-border rounded-lg text-xs text-on-surface whitespace-nowrap z-50 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-lg"
                role="tooltip"
              >{{ item.key | translate }}</span>
            }
          </a>
        }
      </div>

      <div class="shrink-0 border-t border-white/5 p-2">
        <div class="flex items-center gap-3 px-2 py-1.5">
          <app-ui-avatar
            [name]="userEmail()"
            size="sm"
            class="shrink-0"
          />
          @if (!collapsed()) {
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-on-surface truncate">{{ userEmail() }}</p>
              <app-ui-badge size="sm" class="mt-0.5">{{ 'role.' + role() | translate }}</app-ui-badge>
            </div>
          }
        </div>

        <button
          (click)="toggle()"
          class="w-full flex items-center gap-2 px-2 py-2 mt-1 rounded-lg text-on-surface-muted hover:text-on-surface hover:bg-surface-hover transition-colors"
          [attr.aria-label]="collapsed() ? 'Expandir barra lateral' : 'Colapsar barra lateral'"
          [attr.aria-expanded]="!collapsed()"
        >
          @if (collapsed()) {
            <svg lucideChevronRight class="w-4 h-4 mx-auto" strokeWidth="2" aria-hidden="true"></svg>
          } @else {
            <svg lucideChevronLeft class="w-4 h-4 shrink-0" strokeWidth="2" aria-hidden="true"></svg>
            <span class="text-xs">{{ 'nav.collapse' | translate }}</span>
          }
        </button>
      </div>
    </nav>
  `,
})
export class SidebarNavComponent {
  private readonly _perm = inject(PermissionService);
  private readonly _auth = inject(AuthService);

  readonly role = this._perm.role;
  readonly userEmail = computed(() => this._auth.user()?.email ?? '');
  readonly collapsed = signal(this._readCollapsed());
  readonly navItems = computed(() => getNavItems(this.role()));

  protected navItemClass(isActive: boolean): string {
    const base = 'group relative flex items-center gap-3 rounded-xl transition-colors duration-200';
    if (isActive) {
      return `${base} ${this._itemSize()} text-brand bg-brand/8 font-medium`;
    }
    return `${base} ${this._itemSize()} text-on-surface-muted hover:text-on-surface hover:bg-surface-hover/40`;
  }

  private _itemSize(): string {
    return this.collapsed()
      ? 'justify-center h-10 w-11 mx-auto px-0'
      : 'h-10 px-3 w-full';
  }

  toggle(): void {
    this.collapsed.update(v => !v);
    try {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(this.collapsed()));
    } catch { /* noop */ }
  }

  private _readCollapsed(): boolean {
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved !== null ? JSON.parse(saved) : false;
    } catch { return false; }
  }
}
