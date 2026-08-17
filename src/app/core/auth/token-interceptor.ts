import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();
  const isApiRequest = req.url.startsWith(environment.apiUrl);

  const request = token && isApiRequest
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError(error => {
      if (error.status === 401 && isApiRequest) {
        auth.logout();
        if (!router.url.startsWith('/login') && !router.url.startsWith('/register')) {
          void router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
