import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';

import { inject } from '@angular/core';

import { Router } from '@angular/router';

import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from './auth.service';

import { environment } from '../../environments/environment';

export const tokenInterceptor: HttpInterceptorFn =
  (req, next) => {

    const auth = inject(AuthService);

    const router = inject(Router);

    const isApiRequest =
      req.url.startsWith(
        environment.apiUrl
      );

    /*
     * Authentication endpoints that should
     * not receive the Authorization header.
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
     * Always allow the browser to send
     * the HttpOnly refresh cookie.
     */
    let request = req.clone({
        withCredentials: true
      });

    /*
     * Get access token from memory.
     */
    const token = auth.getToken();

    /*
     * Add Bearer token to normal API calls.
     *
     * Do NOT add it to login/register/
     * refresh/logout.
     */
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
           * Only attempt token refresh for:
           *
           * - API request
           * - 401 response
           * - non-auth endpoint
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
           * Access token has expired.
           *
           * Ask backend to exchange the
           * HttpOnly refresh cookie for
           * a new access token.
           */
          return auth.refresh().pipe(

            switchMap(newSession => {
                /*
                 * AuthService has already stored
                 * this token in memory.
                 */
                const newToken = newSession.token;

                /*
                 * Retry the ORIGINAL request
                 * with the new token.
                 */
                const retryRequest =
                  req.clone({
                    withCredentials: true,

                    setHeaders: {
                      Authorization:
                        `Bearer ${newToken}`
                    }
                  });

                return next(
                  retryRequest
                );
              }
            ),

            catchError(
              refreshError => {

                /*
                 * Refresh failed.
                 *
                 * The refresh token is missing,
                 * expired, revoked, or invalid.
                 */
                auth.clearSession();

                /*
                 * Redirect to login.
                 */
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
