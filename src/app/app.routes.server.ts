import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'auth/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'workout/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'routines/new',
    renderMode: RenderMode.Client,
  },
  {
    path: 'routines/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'routines/:id/edit',
    renderMode: RenderMode.Client,
  },
  {
    path: 'exercises/new',
    renderMode: RenderMode.Client,
  },
  {
    path: 'exercises/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'exercises/:id/edit',
    renderMode: RenderMode.Client,
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'routines',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'exercises',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'metrics',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'settings',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'auth/verified',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
