import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  BehaviorSubject,
  catchError,
  filter,
  finalize,
  switchMap,
  take,
  throwError
} from 'rxjs';

import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

let isRefreshing = false;

const refreshTokenSubject =
  new BehaviorSubject<string | null>(null);

export const tokenInterceptor: HttpInterceptorFn =
  (req, next) => {

    const auth =
      inject(AuthService);

    const router =
      inject(Router);

    const isApiRequest =
      req.url.startsWith(
        environment.apiUrl
      );

    const isRefreshRequest =
      req.url.includes(
        '/auth/refresh'
      );

    const isLoginRequest =
      req.url.includes(
        '/auth/login'
      );

    const isRegisterRequest =
      req.url.includes(
        '/auth/register'
      );

    const isLogoutRequest =
      req.url.includes(
        '/auth/logout'
      );

    if (!isApiRequest) {
      return next(req);
    }

    /*
     * Never attach the old JWT to refresh/login/register.
     */
    if (
      isRefreshRequest ||
      isLoginRequest ||
      isRegisterRequest ||
      isLogoutRequest
    ) {
      return next(
        req.clone({
          withCredentials: true
        })
      );
    }

    const token =
      auth.getToken();

    const authenticatedRequest =
      token
        ? req.clone({
            withCredentials: true,
            setHeaders: {
              Authorization:
                `Bearer ${token}`
            }
          })
        : req.clone({
            withCredentials: true
          });

    return next(
      authenticatedRequest
    ).pipe(
      catchError(error => {

        if (
          error.status !== 401 ||
          isRefreshRequest
        ) {
          return throwError(
            () => error
          );
        }

        return handle401(
          authenticatedRequest,
          next,
          auth,
          router
        );
      })
    );
  };

function handle401(
  request: any,
  next: any,
  auth: AuthService,
  router: Router
) {
  /*
   * If another request is already refreshing,
   * wait for that request to finish.
   */
  if (isRefreshing) {

    return refreshTokenSubject.pipe(
      filter(
        token => token !== null
      ),
      take(1),
      switchMap(token => {

        const retryRequest =
          request.clone({
            withCredentials: true,
            setHeaders: {
              Authorization:
                `Bearer ${token}`
            }
          });

        return next(
          retryRequest
        );
      })
    );
  }

  isRefreshing = true;

  refreshTokenSubject.next(null);

  return auth.refreshToken().pipe(

    switchMap(session => {

      const newToken =
        session.token;

      refreshTokenSubject.next(
        newToken
      );

      const retryRequest =
        request.clone({
          withCredentials: true,
          setHeaders: {
            Authorization:
              `Bearer ${newToken}`
          }
        });

      return next(
        retryRequest
      );
    }),

    catchError(refreshError => {

      auth.clearSession();

      if (
        !router.url.startsWith('/login') &&
        !router.url.startsWith('/register')
      ) {
        void router.navigate([
          '/login'
        ]);
      }

      return throwError(
        () => refreshError
      );
    }),

    finalize(() => {
      isRefreshing = false;
    })
  );
}
