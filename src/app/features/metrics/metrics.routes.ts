import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./metrics.page').then(m => m.MetricsPage),
  },
] satisfies Routes;
