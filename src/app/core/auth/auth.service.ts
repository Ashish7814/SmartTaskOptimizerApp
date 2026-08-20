import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  of,
  throwError
} from 'rxjs';
import {
  catchError,
  finalize,
  map,
  shareReplay,
  tap
} from 'rxjs/operators';

import { environment } from '../../environments/environment';
import {
  LoginDto,
  RegisterDto,
  UserSession
} from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly browser =
    isPlatformBrowser(inject(PLATFORM_ID));

  private readonly sessionSubject =
    new BehaviorSubject<UserSession | null>(null);

  readonly session$ =
    this.sessionSubject.asObservable();

  readonly isAuthenticated$ =
    this.session$.pipe(
      map(session =>
        !!session &&
        !this.isExpired(session)
      )
    );

  private readonly initializedSubject =
    new BehaviorSubject<boolean>(false);

  readonly initialized$ =
    this.initializedSubject.asObservable();

  private refreshRequest$:
    Observable<UserSession> | null = null;

  constructor(
    private readonly http: HttpClient
  ) {}

  /**
   * Called once when Angular starts.
   *
   * The refresh token is stored in an HttpOnly cookie,
   * therefore JavaScript cannot read it.
   *
   * We ask the backend to exchange the refresh cookie
   * for a new access token.
   */
  initialize(): Promise<void> {

    if (!this.browser) {
      this.initializedSubject.next(true);
      return Promise.resolve();
    }

    return new Promise(resolve => {

      this.refresh()
        .pipe(
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
   * Backend returns:
   * - access token
   * - user information
   *
   * Backend also sets:
   * - HttpOnly refresh-token cookie
   */
  login(dto: LoginDto): Observable<UserSession> {

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
        })
      );
  }

  register(dto: RegisterDto): Observable<string> {

    return this.http.post<string>(
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

    return this.http.get<{
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
   * Refresh access token using the HttpOnly cookie.
   *
   * The refresh token is NEVER exposed to JavaScript.
   */
  refresh(): Observable<UserSession> {

    /*
     * If a refresh request is already running,
     * return the same observable.
     *
     * This prevents:
     *
     * request 1 -> 401
     * request 2 -> 401
     * request 3 -> 401
     *
     * from generating three refresh requests.
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
          tap(session => {
            this.setSession(session);
          }),

          catchError(error => {
            this.clearSession();

            return throwError(
              () => error
            );
          }),

          finalize(() => {
            this.refreshRequest$ = null;
          }),

          shareReplay({
            bufferSize: 1,
            refCount: false
          })
        );

    return this.refreshRequest$;
  }

  /**
   * Logout from backend and revoke refresh token.
   *
   * The refresh token itself is never accessible here.
   * Browser automatically sends the HttpOnly cookie.
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

          /*
           * Even if logout API fails, clear the
           * local in-memory authentication state.
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
   * Return current access token from memory.
   *
   * IMPORTANT:
   * This token is NOT stored in localStorage.
   */
  getToken(): string | null {

    const session =
      this.sessionSubject.value;

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

    const session =
      this.sessionSubject.value;

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
   * Used by interceptor when refresh fails.
   *
   * Do NOT call backend logout here because the refresh
   * token may already be invalid/revoked.
   */
  clearSession(): void {
    this.sessionSubject.next(null);
  }

  private setSession(
    session: UserSession
  ): void {

    /*
     * IMPORTANT:
     *
     * Do NOT write the access token to:
     * localStorage
     * sessionStorage
     * cookies
     *
     * It stays only in memory.
     */
    this.sessionSubject.next(session);
  }

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
