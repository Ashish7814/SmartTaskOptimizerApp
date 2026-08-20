import {
  CanActivateFn,
  Router
} from '@angular/router';

import { inject } from '@angular/core';

import {
  combineLatest,
  map,
  take
} from 'rxjs';

import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {

  const auth =
    inject(AuthService);

  const router =
    inject(Router);

  return combineLatest([
    auth.initialized$,
    auth.isAuthenticated$
  ]).pipe(

    /*
     * Do not make a routing decision until
     * refresh initialization has completed.
     */
    map(
      ([initialized, authenticated]) => {

        if (!initialized) {
          return false;
        }

        return authenticated
          ? true
          : router.createUrlTree([
              '/login'
            ]);
      }
    ),

    take(1)
  );
};


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
      ([initialized, authenticated]) => {

        if (!initialized) {
          return false;
        }

        return authenticated
          ? router.createUrlTree([
              '/dashboard'
            ])
          : true;
      }
    ),

    take(1)
  );
};
