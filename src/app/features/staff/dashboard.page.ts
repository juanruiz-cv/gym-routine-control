import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@shared/i18n/translate.pipe';
import { StaffMetricsService } from '@core/services/staff-metrics.service';
import { LucideUsers, LucideListOrdered, LucideBarChart3, LucideArrowRight, LucideTarget, LucideCheckCircle, LucideRefreshCw, LucideDumbbell, LucideWrench } from '@lucide/angular';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [RouterLink, TranslatePipe, LucideUsers, LucideListOrdered, LucideBarChart3, LucideArrowRight, LucideTarget, LucideCheckCircle, LucideRefreshCw, LucideDumbbell, LucideWrench],
  template: `
    <div class="p-4 space-y-5 max-w-lg mx-auto">
      <h1 class="text-xl font-bold">{{ 'staff.title' | translate }}</h1>

      @if (metricsSvc.loading()) {
        <div class="grid grid-cols-2 gap-3">
          @for (i of [1,2,3,4]; track i) {
            <div class="h-20 rounded-xl bg-surface-hover animate-pulse"></div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-xl bg-brand/10">
            <div class="flex items-center gap-2 mb-1">
              <svg lucideTarget class="w-4 h-4 text-brand" strokeWidth="2" aria-hidden="true"></svg>
              <span class="text-xs text-on-surface-muted">{{ 'staff.metricsTotal' | translate }}</span>
            </div>
            <p class="text-2xl font-bold">{{ metricsSvc.metrics().totalAssignments }}</p>
          </div>
          <div class="p-3 rounded-xl bg-accent/10">
            <div class="flex items-center gap-2 mb-1">
              <svg lucideRefreshCw class="w-4 h-4 text-accent" strokeWidth="2" aria-hidden="true"></svg>
              <span class="text-xs text-on-surface-muted">{{ 'staff.metricsActive' | translate }}</span>
            </div>
            <p class="text-2xl font-bold">{{ metricsSvc.metrics().activeAssignments }}</p>
          </div>
          <div class="p-3 rounded-xl bg-success/10">
            <div class="flex items-center gap-2 mb-1">
              <svg lucideCheckCircle class="w-4 h-4 text-success" strokeWidth="2" aria-hidden="true"></svg>
              <span class="text-xs text-on-surface-muted">{{ 'staff.metricsCompleted' | translate }}</span>
            </div>
            <p class="text-2xl font-bold">{{ metricsSvc.metrics().completedAssignments }}</p>
          </div>
          <div class="p-3 rounded-xl bg-warning/10">
            <div class="flex items-center gap-2 mb-1">
              <svg lucideBarChart3 class="w-4 h-4 text-warning" strokeWidth="2" aria-hidden="true"></svg>
              <span class="text-xs text-on-surface-muted">{{ 'staff.metricsCompletion' | translate }}</span>
            </div>
            <p class="text-2xl font-bold">{{ metricsSvc.metrics().completionPercentage }}%</p>
          </div>
        </div>
      }

      <div class="flex flex-col gap-2">
        <a routerLink="/staff/users"
          class="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-elevated hover:bg-surface-hover transition-colors"
        >
          <div class="flex items-center gap-3">
            <svg lucideUsers class="w-5 h-5 text-brand" strokeWidth="1.5" aria-hidden="true"></svg>
            <span class="text-sm font-medium">{{ 'staff.viewUsers' | translate }}</span>
          </div>
          <svg lucideArrowRight class="w-4 h-4 text-on-surface-muted" strokeWidth="2" aria-hidden="true"></svg>
        </a>
        <a routerLink="/staff/routines"
          class="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-elevated hover:bg-surface-hover transition-colors"
        >
          <div class="flex items-center gap-3">
            <svg lucideListOrdered class="w-5 h-5 text-accent" strokeWidth="1.5" aria-hidden="true"></svg>
            <span class="text-sm font-medium">{{ 'staff.assignedRoutines' | translate }}</span>
          </div>
          <svg lucideArrowRight class="w-4 h-4 text-on-surface-muted" strokeWidth="2" aria-hidden="true"></svg>
        </a>
        <a routerLink="/staff/muscle-groups"
          class="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-elevated hover:bg-surface-hover transition-colors"
        >
          <div class="flex items-center gap-3">
            <svg lucideDumbbell class="w-5 h-5 text-brand" strokeWidth="1.5" aria-hidden="true"></svg>
            <span class="text-sm font-medium">{{ 'staff.muscleGroups' | translate }}</span>
          </div>
          <svg lucideArrowRight class="w-4 h-4 text-on-surface-muted" strokeWidth="2" aria-hidden="true"></svg>
        </a>
        <a routerLink="/staff/equipment"
          class="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-elevated hover:bg-surface-hover transition-colors"
        >
          <div class="flex items-center gap-3">
            <svg lucideWrench class="w-5 h-5 text-warning" strokeWidth="1.5" aria-hidden="true"></svg>
            <span class="text-sm font-medium">{{ 'staff.equipment' | translate }}</span>
          </div>
          <svg lucideArrowRight class="w-4 h-4 text-on-surface-muted" strokeWidth="2" aria-hidden="true"></svg>
        </a>
      </div>
    </div>
  `,
})
export class StaffDashboardPage implements OnInit {
  protected readonly metricsSvc = inject(StaffMetricsService);

  async ngOnInit(): Promise<void> {
    await this.metricsSvc.loadMetrics();
  }
}
