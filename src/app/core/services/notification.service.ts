import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification } from '../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly baseUrl = `${environment.apiUrl}/notifications`;
  constructor(private readonly http: HttpClient) {}

  getNotifications(unreadOnly = false, page = 1, pageSize = 25): Observable<Notification[]> {
    const params = new HttpParams().set('unreadOnly', unreadOnly).set('page', page).set('pageSize', pageSize);
    return this.http.get<Notification[]>(this.baseUrl, { params });
  }
  markRead(id: string): Observable<void> { return this.http.put<void>(`${this.baseUrl}/${id}/read`, null); }
  markAllRead(): Observable<void> { return this.http.put<void>(`${this.baseUrl}/read-all`, null); }
}
