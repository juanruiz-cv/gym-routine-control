import { Routes } from '@angular/router';

export default [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage),
  },
  {
    path: 'callback',
    loadComponent: () => import('./callback/callback.page').then(m => m.CallbackPage),
  },
  {
    path: 'update-password',
    loadComponent: () => import('./update-password/update-password.page').then(m => m.UpdatePasswordPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
] satisfies Routes;
