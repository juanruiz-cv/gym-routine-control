import { inject } from '@angular/core';
import { Router, type CanActivateFn, type CanMatchFn } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthService } from '../auth/auth.service';
import { filter, map, take, switchMap } from 'rxjs';

function checkAuth(): ReturnType<CanActivateFn> {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.loading).pipe(
    filter(v => !v),
    take(1),
    switchMap(() => toObservable(auth.isAuthenticated).pipe(take(1))),
    map(isAuth => {
      if (!isAuth) {
        return router.createUrlTree(['/auth/login']);
      }
      return true;
    }),
  );
}

export const authGuard: CanActivateFn = () => checkAuth();
export const authMatch: CanMatchFn = () => checkAuth();
