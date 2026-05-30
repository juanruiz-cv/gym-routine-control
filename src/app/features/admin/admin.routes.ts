import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

export default [
  {
    path: '',
    canActivate: [authGuard, roleGuard('admin')],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard.page').then(m => m.AdminDashboardPage),
      },
      {
        path: 'users',
        loadComponent: () => import('./users.page').then(m => m.AdminUsersPage),
      },
      {
        path: 'audit',
        loadComponent: () => import('./audit.page').then(m => m.AdminAuditPage),
      },
    ],
  },
] satisfies Routes;
