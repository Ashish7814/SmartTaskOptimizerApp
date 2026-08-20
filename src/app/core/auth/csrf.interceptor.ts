import { HttpInterceptorFn } from '@angular/common/http';

export const csrfInterceptor: HttpInterceptorFn =
  (req, next) => {

    const isRefreshRequest =
      req.url.includes('/api/auth/refresh');

    const isLogoutRequest =
      req.url.includes('/api/auth/logout');

    if (!isRefreshRequest &&
        !isLogoutRequest) {

      return next(req);
    }

    const csrfToken =
      getCookie('smarttask.csrf');

    if (!csrfToken) {
      return next(
        req.clone({
          withCredentials: true
        })
      );
    }

    const csrfRequest =
      req.clone({
        withCredentials: true,

        setHeaders: {
          'X-CSRF-TOKEN': csrfToken
        }
      });

    return next(csrfRequest);
  };

function getCookie(
  name: string
): string | null {

  const cookies =
    document.cookie.split(';');

  for (const cookie of cookies) {

    const trimmed =
      cookie.trim();

    if (!trimmed) {
      continue;
    }

    const separatorIndex =
      trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key =
      trimmed.substring(
        0,
        separatorIndex
      );

    if (key !== name) {
      continue;
    }

    const value =
      trimmed.substring(
        separatorIndex + 1
      );

    return decodeURIComponent(value);
  }

  return null;
}
