import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./routines.page').then(m => m.RoutinesPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./routine-form/routine-form.page').then(m => m.RoutineFormPage),
  },
  {
    path: ':id',
    loadComponent: () => import('./routine-detail/routine-detail.page').then(m => m.RoutineDetailPage),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./routine-form/routine-form.page').then(m => m.RoutineFormPage),
  },
] satisfies Routes;
