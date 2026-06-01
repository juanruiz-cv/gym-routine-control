import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService, type AdminMetrics } from '@core/services/admin.service';
import { UiCard } from '@shared/ui/card';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { LucideUsers, LucideUserCog, LucideListOrdered, LucideDumbbell, LucideActivity, LucideArrowRight } from '@lucide/angular';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, UiCard, TranslatePipe, LucideUsers, LucideUserCog, LucideListOrdered, LucideDumbbell, LucideActivity, LucideArrowRight],
  template: `
    <div class="p-4 space-y-5 max-w-lg mx-auto md:max-w-4xl lg:max-w-none lg:mx-0 lg:px-6">
      <h1 class="text-xl font-bold">{{ 'admin.title' | translate }}</h1>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <a routerLink="/admin/users" class="block">
          <app-ui-card>
            <div class="flex flex-col items-center gap-2 py-2">
              <svg lucideUsers class="w-8 h-8 text-brand" strokeWidth="1.5" aria-hidden="true"></svg>
              <span class="text-2xl font-bold">{{ metrics()?.totalUsers ?? '—' }}</span>
              <span class="text-xs text-on-surface-muted">{{ 'admin.totalUsers' | translate }}</span>
            </div>
          </app-ui-card>
        </a>
        <a routerLink="/admin/users" class="block">
          <app-ui-card>
            <div class="flex flex-col items-center gap-2 py-2">
              <svg lucideUserCog class="w-8 h-8 text-accent" strokeWidth="1.5" aria-hidden="true"></svg>
              <span class="text-2xl font-bold">{{ metrics()?.totalStaff ?? '—' }}</span>
              <span class="text-xs text-on-surface-muted">{{ 'admin.totalStaff' | translate }}</span>
            </div>
          </app-ui-card>
        </a>
        <app-ui-card>
          <div class="flex flex-col items-center gap-2 py-2">
            <svg lucideListOrdered class="w-8 h-8 text-warning" strokeWidth="1.5" aria-hidden="true"></svg>
            <span class="text-2xl font-bold">{{ metrics()?.totalRoutines ?? '—' }}</span>
            <span class="text-xs text-on-surface-muted">{{ 'admin.totalRoutines' | translate }}</span>
          </div>
        </app-ui-card>
        <app-ui-card>
          <div class="flex flex-col items-center gap-2 py-2">
            <svg lucideDumbbell class="w-8 h-8 text-success" strokeWidth="1.5" aria-hidden="true"></svg>
            <span class="text-2xl font-bold">{{ metrics()?.totalWorkouts ?? '—' }}</span>
            <span class="text-xs text-on-surface-muted">{{ 'admin.totalWorkouts' | translate }}</span>
          </div>
        </app-ui-card>
      </div>

      <div class="flex flex-col gap-2">
        <a routerLink="/admin/users"
          class="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-elevated hover:bg-surface-hover transition-colors"
        >
          <div class="flex items-center gap-3">
            <svg lucideUsers class="w-5 h-5 text-brand" strokeWidth="1.5" aria-hidden="true"></svg>
            <span class="text-sm font-medium">{{ 'admin.manageUsers' | translate }}</span>
          </div>
          <svg lucideArrowRight class="w-4 h-4 text-on-surface-muted" strokeWidth="2" aria-hidden="true"></svg>
        </a>
        <a routerLink="/admin/audit"
          class="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-elevated hover:bg-surface-hover transition-colors"
        >
          <div class="flex items-center gap-3">
            <svg lucideActivity class="w-5 h-5 text-accent" strokeWidth="1.5" aria-hidden="true"></svg>
            <span class="text-sm font-medium">{{ 'admin.auditLog' | translate }}</span>
          </div>
          <svg lucideArrowRight class="w-4 h-4 text-on-surface-muted" strokeWidth="2" aria-hidden="true"></svg>
        </a>
      </div>
    </div>
  `,
})
export class AdminDashboardPage implements OnInit {
  private readonly _admin = inject(AdminService);

  protected readonly metrics = signal<AdminMetrics | null>(null);

  async ngOnInit(): Promise<void> {
    this.metrics.set(await this._admin.getMetrics());
  }
}
