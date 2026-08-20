import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  catchError,
  switchMap,
  throwError
} from 'rxjs';

import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

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

    /*
     * Authentication endpoints.
     *
     * Do not attach access token to:
     *
     * /login
     * /register
     * /refresh
     *
     * Logout also doesn't require an access token.
     */
    const isLoginRequest =
      req.url.endsWith('/auth/login');

    const isRegisterRequest =
      req.url.endsWith('/auth/register');

    const isRefreshRequest =
      req.url.endsWith('/auth/refresh');

    const isLogoutRequest =
      req.url.endsWith('/auth/logout');

    const isAuthRequest =
      isLoginRequest ||
      isRegisterRequest ||
      isRefreshRequest ||
      isLogoutRequest;

    /*
     * Browser must be allowed to send the
     * HttpOnly refresh-token cookie.
     */
    let request =
      req.clone({
        withCredentials: true
      });

    /*
     * Add Authorization header only when:
     *
     * - API request
     * - not login/register/refresh/logout
     * - access token exists
     */
    const token =
      auth.getToken();

    if (
      isApiRequest &&
      !isAuthRequest &&
      token
    ) {
      request =
        request.clone({
          setHeaders: {
            Authorization:
              `Bearer ${token}`
          }
        });
    }

    return next(request).pipe(

      catchError(
        (error: HttpErrorResponse) => {

          /*
           * Only API requests should trigger
           * token-refresh logic.
           */
          if (
            !isApiRequest ||
            isAuthRequest ||
            error.status !== 401
          ) {
            return throwError(
              () => error
            );
          }

          /*
           * Access token is expired/invalid.
           *
           * Ask backend to use the HttpOnly
           * refresh cookie.
           */
          return auth.refresh().pipe(

            /*
             * New access token has now been
             * stored in AuthService memory.
             */
            switchMap(newSession => {

              const retryToken =
                newSession.token;

              const retryRequest =
                req.clone({
                  withCredentials: true,
                  setHeaders: {
                    Authorization:
                      `Bearer ${retryToken}`
                  }
                });

              /*
               * Retry original request.
               */
              return next(
                retryRequest
              );
            }),

            catchError(
              refreshError => {

                /*
                 * Refresh failed.
                 *
                 * This means the user must
                 * authenticate again.
                 */
                auth.clearSession();

                if (
                  !router.url.startsWith(
                    '/login'
                  ) &&
                  !router.url.startsWith(
                    '/register'
                  )
                ) {
                  void router.navigate(
                    ['/login'],
                    {
                      queryParams: {
                        returnUrl:
                          router.url
                      }
                    }
                  );
                }

                return throwError(
                  () => refreshError
                );
              }
            )
          );
        }
      )
    );
  };
