import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./exercises.page').then(m => m.ExercisesPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./exercise-form/exercise-form.page').then(m => m.ExerciseFormPage),
  },
  {
    path: ':id',
    loadComponent: () => import('./exercise-detail/exercise-detail.page').then(m => m.ExerciseDetailPage),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./exercise-form/exercise-form.page').then(m => m.ExerciseFormPage),
  },
] satisfies Routes;
