import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./history.page').then(m => m.HistoryPage),
  },
];

export default routes;
