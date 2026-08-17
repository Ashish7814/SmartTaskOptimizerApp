import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginDto, RegisterDto, UserSession } from '../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'smarttask.auth';
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly sessionSubject = new BehaviorSubject<UserSession | null>(this.readSession());
  readonly session$ = this.sessionSubject.asObservable();
  readonly isAuthenticated$ = this.session$.pipe(map(session => !!session && !this.isExpired(session)));

  constructor(private readonly http: HttpClient) {}

  login(dto: LoginDto): Observable<UserSession> {
    return this.http.post<UserSession>(`${environment.apiUrl}/auth/login`, dto).pipe(
      tap(session => this.setSession(session))
    );
  }

  register(dto: RegisterDto): Observable<string> {
    return this.http.post<string>(`${environment.apiUrl}/auth/register`, dto);
  }

  me(): Observable<{ userId: string; name: string; email: string; role: string }> {
    return this.http.get<{ userId: string; name: string; email: string; role: string }>(`${environment.apiUrl}/auth/me`);
  }

  logout(): void {
    if (this.browser) localStorage.removeItem(this.storageKey);
    this.sessionSubject.next(null);
  }

  getToken(): string | null {
    const session = this.sessionSubject.value;
    if (!session || this.isExpired(session)) {
      if (session) this.logout();
      return null;
    }
    return session.token;
  }

  getSession(): UserSession | null {
    const session = this.sessionSubject.value;
    return session && !this.isExpired(session) ? session : null;
  }

  private setSession(session: UserSession): void {
    if (this.browser) localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  private readSession(): UserSession | null {
    if (!this.browser) return null;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const session = JSON.parse(raw) as UserSession;
      if (this.isExpired(session)) {
        localStorage.removeItem(this.storageKey);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private isExpired(session: UserSession): boolean {
    return !session.expiresAtUtc || new Date(session.expiresAtUtc).getTime() <= Date.now();
  }
}
