import {
  inject
} from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  combineLatest,
  map,
  take
} from 'rxjs';

import { AuthService } from './auth.service';


/**
 * Protect authenticated routes.
 */
export const authGuard: CanActivateFn = () => {

  const auth =
    inject(AuthService);

  const router =
    inject(Router);

  /*
   * Wait until AuthService has attempted
   * to restore the session using the
   * HttpOnly refresh cookie.
   */
  return combineLatest([
    auth.initialized$,
    auth.isAuthenticated$
  ]).pipe(

    map(
      ([initialized, isAuthenticated]) => {

        /*
         * Authentication initialization
         * hasn't completed yet.
         */
        if (!initialized) {
          return false;
        }

        /*
         * User is authenticated.
         */
        if (isAuthenticated) {
          return true;
        }

        /*
         * User is not authenticated.
         */
        return router.createUrlTree([
          '/login'
        ]);
      }
    ),

    take(1)
  );
};


/**
 * Prevent authenticated users from
 * accessing login/register pages.
 */
export const guestGuard: CanActivateFn = () => {

  const auth =
    inject(AuthService);

  const router =
    inject(Router);

  return combineLatest([
    auth.initialized$,
    auth.isAuthenticated$
  ]).pipe(

    map(
      ([initialized, isAuthenticated]) => {

        if (!initialized) {
          return false;
        }

        /*
         * Already authenticated.
         */
        if (isAuthenticated) {
          return router.createUrlTree([
            '/dashboard'
          ]);
        }

        /*
         * Guest can access login/register.
         */
        return true;
      }
    ),

    take(1)
  );
};
