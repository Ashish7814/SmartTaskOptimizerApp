import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private readonly http: HttpClient) {}
  exportTasks(format: 'excel' | 'pdf'): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/reports/tasks`, { params: { format }, responseType: 'blob' });
  }
}
