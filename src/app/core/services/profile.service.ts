import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChangePasswordDto, UpdateProfileDto, UserProfile } from '../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly baseUrl = `${environment.apiUrl}/profile`;
  constructor(private readonly http: HttpClient) {}
  getProfile(): Observable<UserProfile> { return this.http.get<UserProfile>(this.baseUrl); }
  updateProfile(dto: UpdateProfileDto): Observable<void> { return this.http.put<void>(this.baseUrl, dto); }
  changePassword(dto: ChangePasswordDto): Observable<void> { return this.http.put<void>(`${this.baseUrl}/password`, dto); }
}
