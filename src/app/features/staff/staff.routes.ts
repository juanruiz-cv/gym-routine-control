import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

export default [
  {
    path: '',
    canActivate: [authGuard, roleGuard('admin', 'staff')],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard.page').then(m => m.StaffDashboardPage),
      },
      {
        path: 'users',
        loadComponent: () => import('./users.page').then(m => m.StaffUsersPage),
      },
      {
        path: 'routines',
        loadComponent: () => import('./routines.page').then(m => m.StaffRoutinesPage),
      },
    ],
  },
] satisfies Routes;
