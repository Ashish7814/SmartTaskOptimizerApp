import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => isAuthenticated ? true : router.createUrlTree(['/login']))
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => isAuthenticated ? router.createUrlTree(['/dashboard']) : true)
  );
};
