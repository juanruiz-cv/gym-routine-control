import { inject, Injector, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Router, type CanActivateFn } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthService } from '../auth/auth.service';
import { filter, map, take, switchMap, timeout, catchError } from 'rxjs';
import { of } from 'rxjs';

function checkAuth(): ReturnType<CanActivateFn> {
  const injector = inject(Injector);
  const platformId = inject(PLATFORM_ID);
  const auth = inject(AuthService);
  const router = inject(Router);

  if (isPlatformServer(platformId)) return of(true);

  return toObservable(auth.loading, { injector }).pipe(
    filter(v => !v),
    timeout(5000),
    take(1),
    switchMap(() => toObservable(auth.isAuthenticated, { injector }).pipe(take(1))),
    map(isAuth => {
      if (!isAuth) return router.createUrlTree(['/auth/login']);
      return true;
    }),
    catchError(() => of(router.createUrlTree(['/auth/login']))),
  );
}

export const authGuard: CanActivateFn = () => checkAuth();
