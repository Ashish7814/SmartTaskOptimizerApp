import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  map,
  tap
} from 'rxjs';

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

  private accessToken: string | null = null;

  private readonly sessionSubject =
    new BehaviorSubject<UserSession | null>(null);

  readonly session$ =
    this.sessionSubject.asObservable();

  readonly isAuthenticated$ =
    this.session$.pipe(
      map(session => !!session)
    );

  constructor(
    private readonly http: HttpClient
  ) {}

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
        })
      );
  }

  register(
    dto: RegisterDto
  ): Observable<string> {

    return this.http.post<string>(
      `${environment.apiUrl}/auth/register`,
      dto
    );
  }

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
      `${environment.apiUrl}/auth/me`
    );
  }

  refreshToken(): Observable<UserSession> {

    return this.http
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
        })
      );
  }

  logout(): Observable<void> {

    return this.http
      .post<void>(
        `${environment.apiUrl}/auth/logout`,
        {},
        {
          withCredentials: true
        }
      )
      .pipe(
        tap(() => {
          this.clearSession();
        })
      );
  }

  getToken(): string | null {
    return this.accessToken;
  }

  getSession(): UserSession | null {
    return this.sessionSubject.value;
  }

  setSession(
    session: UserSession
  ): void {

    this.accessToken =
      session.token;

    this.sessionSubject.next(
      session
    );
  }

  clearSession(): void {

    this.accessToken = null;

    this.sessionSubject.next(null);
  }

  isLoggedIn(): boolean {
    return this.accessToken !== null;
  }
}
