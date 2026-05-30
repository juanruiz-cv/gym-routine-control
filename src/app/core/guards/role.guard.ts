import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { PermissionService, type UserRole } from '@core/services/permission.service';

export function roleGuard(...allowed: UserRole[]): CanActivateFn {
  return () => {
    const perm = inject(PermissionService);
    const router = inject(Router);
    if (allowed.includes(perm.role())) return true;
    return router.parseUrl('/dashboard');
  };
}
