import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TaskComment } from '../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class CommentService {
  constructor(private readonly http: HttpClient) {}
  getComments(taskId: string): Observable<TaskComment[]> { return this.http.get<TaskComment[]>(`${environment.apiUrl}/tasks/${taskId}/comments`); }
  createComment(taskId: string, body: string): Observable<TaskComment> { return this.http.post<TaskComment>(`${environment.apiUrl}/tasks/${taskId}/comments`, { body }); }
  updateComment(taskId: string, commentId: string, body: string): Observable<TaskComment> { return this.http.put<TaskComment>(`${environment.apiUrl}/tasks/${taskId}/comments/${commentId}`, { body }); }
  deleteComment(taskId: string, commentId: string): Observable<void> { return this.http.delete<void>(`${environment.apiUrl}/tasks/${taskId}/comments/${commentId}`); }
}
