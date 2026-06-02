import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadComponent: () => import('@core/layout/auth-layout').then(m => m.AuthLayoutComponent),
    loadChildren: () => import('@features/auth/auth.routes'),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('@core/layout/main-layout').then(m => m.MainLayoutComponent),
    loadChildren: () => import('@features/dashboard/dashboard.routes'),
  },
  {
    path: 'routines',
    canActivate: [authGuard],
    loadComponent: () => import('@core/layout/main-layout').then(m => m.MainLayoutComponent),
    loadChildren: () => import('@features/routines/routines.routes'),
  },
  {
    path: 'exercises',
    canActivate: [authGuard],
    loadComponent: () => import('@core/layout/main-layout').then(m => m.MainLayoutComponent),
    loadChildren: () => import('@features/exercises/exercises.routes'),
  },
  {
    path: 'history',
    canActivate: [authGuard],
    loadComponent: () => import('@core/layout/main-layout').then(m => m.MainLayoutComponent),
    loadChildren: () => import('@features/history/history.routes'),
  },
  {
    path: 'workout',
    canActivate: [authGuard],
    loadChildren: () => import('@features/workout-session/workout-session.routes'),
  },
  {
    path: 'metrics',
    canActivate: [authGuard],
    loadComponent: () => import('@core/layout/main-layout').then(m => m.MainLayoutComponent),
    loadChildren: () => import('@features/metrics/metrics.routes'),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('@core/layout/main-layout').then(m => m.MainLayoutComponent),
    loadChildren: () => import('@features/admin/admin.routes'),
  },
  {
    path: 'staff',
    canActivate: [authGuard, roleGuard('admin', 'staff')],
    loadComponent: () => import('@core/layout/main-layout').then(m => m.MainLayoutComponent),
    loadChildren: () => import('@features/staff/staff.routes'),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('@core/layout/main-layout').then(m => m.MainLayoutComponent),
    loadChildren: () => import('@features/settings/settings.routes'),
  },
  {
    path: '**',
    loadComponent: () => import('@features/not-found/not-found.page'),
  },
];
