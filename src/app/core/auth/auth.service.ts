import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LoginDto, RegisterDto, UserSession } from '../../shared/models/api.models';

export interface AuthResponse {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  expiresAtUtc: string;
}

export interface UserSession {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  expiresAtUtc: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  /*
   * Access token is stored ONLY in memory.
   *
   * It is intentionally NOT stored in:
   * - localStorage
   * - sessionStorage
   * - browser-accessible cookies
   */
  private readonly sessionSubject = new BehaviorSubject<UserSession | null>(null);

  readonly session$ = this.sessionSubject.asObservable();
  
  readonly isAuthenticated$ = this.session$.pipe(
      map(session =>
        !!session &&
        !this.isExpired(session)
      )
    );

  /*
   * Used by auth guards and application
   * initialization.
   *
   * false = authentication state is still
   * being restored from refresh cookie.
   */
  private readonly initializedSubject = new BehaviorSubject<boolean>(false);

  readonly initialized$ = this.initializedSubject.asObservable();

  private readonly browser = isPlatformBrowser(
      inject(PLATFORM_ID)
    );

  /*
   * Holds the current refresh request.
   *
   * If multiple API calls receive 401 at
   * exactly the same time, only ONE refresh
   * request is sent.
   */
  private refreshRequest$: Observable<UserSession> | null = null;

  constructor(
    private readonly http: HttpClient
  ) {}

  /**
   * Called when Angular application starts.
   *
   * The browser already contains the
   * HttpOnly refresh-token cookie.
   *
   * Angular cannot read that cookie.
   *
   * Instead, we ask the backend to use it
   * and issue a new access token.
   */
  initialize(): Promise<void> {

    /*
     * During SSR there is no browser cookie.
     */
    if (!this.browser) {
      this.initializedSubject.next(true);

      return Promise.resolve();
    }

    return new Promise(resolve => {

      this.refresh()
        .pipe(

          /*
           * If there is no valid refresh token,
           * simply remain logged out.
           */
          catchError(() => {
            this.clearSession();

            return of(null);
          }),

          finalize(() => {
            this.initializedSubject.next(true);

            resolve();
          })
        )
        .subscribe();
    });
  }

  /**
   * Login.
   *
   * Backend:
   *
   * 1. Validates credentials
   * 2. Generates access token
   * 3. Generates refresh token
   * 4. Stores hashed refresh token
   * 5. Sends refresh token as HttpOnly cookie
   *
   * Angular receives ONLY the access token.
   */
  login(
    dto: LoginDto
  ): Observable<UserSession> {

    return this.http
      .post<UserSession>(
        `${environment.apiUrl}/auth/login`,
        dto,
        {
          withCredentials: true
        }
      )
      .pipe(
        tap(session => {
          this.setSession(session);
          // Access token is stored ONLY in memory.
          this.sessionSubject.next(session);
          return session;
        })
      );
  }

  /**
   * Register a user.
   */
  register(
    dto: RegisterDto
  ): Observable<string> {

    return this.http
      .post<string>(
        `${environment.apiUrl}/auth/register`,
        dto,
        {
          withCredentials: true
        }
      );
  }

  /**
   * Get current authenticated user.
   */
  me(): Observable<{
    userId: string;
    name: string;
    email: string;
    role: string;
  }> {

    return this.http
      .get<{
        userId: string;
        name: string;
        email: string;
        role: string;
      }>(
        `${environment.apiUrl}/auth/me`,
        {
          withCredentials: true
        }
      );
  }

  /**
   * Refresh the access token.
   *
   * IMPORTANT:
   *
   * Angular does NOT receive or read the
   * refresh token.
   *
   * The browser automatically sends:
   *
   * smarttask.refresh
   *
   * because it is an HttpOnly cookie.
   */
  refresh(): Observable<UserSession> {

    /*
     * If another refresh request is already
     * running, reuse it.
     */
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    this.refreshRequest$ =
      this.http
        .post<UserSession>(
          `${environment.apiUrl}/auth/refresh`,
          {},
          {
            withCredentials: true
          }
        )
        .pipe(

          /*
           * Store the new access token in
           * memory.
           */
          tap(session => {
            this.setSession(session);
            // Access token remains memory-only.
            this.sessionSubject.next(session);

            return session;
          }),

          /*
           * Refresh failed.
           *
           * Do not call logout() here because
           * logout would make another HTTP request
           * and can create unnecessary recursion.
           */
          catchError(error => {

            this.clearSession();

            return throwError(
              () => error
            );
          }),

          /*
           * Allow another refresh operation
           * after this one completes.
           */
          finalize(() => {
            this.refreshRequest$ = null;
          }),

          /*
           * Share the same result with all
           * requests waiting for the refresh.
           */
          shareReplay({
            bufferSize: 1,
            refCount: false
          })
        );

    return this.refreshRequest$;
  }

  /**
   * Explicit user logout.
   *
   * Backend revokes the refresh token
   * and deletes the HttpOnly cookie.
   */
  logout(): void {

    if (!this.browser) {
      this.clearSession();

      return;
    }

    this.http
      .post(
        `${environment.apiUrl}/auth/logout`,
        {},
        {
          withCredentials: true
        }
      )
      .pipe(
        catchError(error => {

          tap(() => {
            this.clearSession();
          }),
          /*
           * Even if backend logout fails,
           * clear the local access token.
           */
          console.error(
            'Logout request failed:',
            error
          );

          return of(null);
        })
      )
      .subscribe({
        next: () => {
          this.clearSession();
        },

        error: () => {
          this.clearSession();
        }
      });
  }

  /**
   * Return current access token.
   *
   * Token exists only in memory.
   */
  getToken(): string | null {

    const session = this.sessionSubject.value;

    if (!session) {
      return null;
    }

    if (this.isExpired(session)) {
      this.clearSession();

      return null;
    }

    return session.token;
  }

  /**
   * Return current session.
   */
  getSession(): UserSession | null {

    const session = this.sessionSubject.value;

    if (!session) {
      return null;
    }

    if (this.isExpired(session)) {
      this.clearSession();

      return null;
    }

    return session;
  }

  /**
   * Clear access token from memory.
   */
  clearSession(): void {
    this.sessionSubject.next(null);
  }

  /**
   * Store access token ONLY in memory.
   */
  private setSession(
    session: UserSession
  ): void {
    this.sessionSubject.next(session);
  }

  /**
   * Check JWT expiration timestamp.
   */
  private isExpired(
    session: UserSession
  ): boolean {

    if (!session.expiresAtUtc) {
      return true;
    }

    return (
      new Date(
        session.expiresAtUtc
      ).getTime() <= Date.now()
    );
  }
}
