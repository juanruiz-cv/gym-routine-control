import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export default [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/routines',
  },
  {
    path: ':sessionId',
    canActivate: [authGuard],
    loadComponent: () => import('./workout-session.page').then(m => m.WorkoutSessionPage),
  },
  {
    path: ':sessionId/summary',
    canActivate: [authGuard],
    loadComponent: () => import('./workout-summary/workout-summary.page').then(m => m.WorkoutSummaryPage),
  },
] satisfies Routes;
