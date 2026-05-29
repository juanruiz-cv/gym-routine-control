import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return from(auth.getSessionToken()).pipe(
    switchMap(token => {
      if (token) {
        const clone = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        });
        return next(clone);
      }
      return next(req);
    }),
  );
};
