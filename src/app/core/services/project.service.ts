import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AddProjectMemberDto, CreateProjectDto, Project, ProjectMember, Activity } from '../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly baseUrl = `${environment.apiUrl}/projects`;
  constructor(private readonly http: HttpClient) {}

  getProjects(): Observable<Project[]> { return this.http.get<Project[]>(this.baseUrl); }
  getProject(id: string): Observable<Project> { return this.http.get<Project>(`${this.baseUrl}/${id}`); }
  createProject(dto: CreateProjectDto): Observable<string> { return this.http.post<string>(this.baseUrl, dto); }
  updateProject(id: string, dto: Project): Observable<void> { return this.http.put<void>(`${this.baseUrl}/${id}`, dto); }
  deleteProject(id: string): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/${id}`); }
  getMembers(id: string): Observable<ProjectMember[]> { return this.http.get<ProjectMember[]>(`${this.baseUrl}/${id}/members`); }
  addMember(id: string, dto: AddProjectMemberDto): Observable<void> { return this.http.post<void>(`${this.baseUrl}/${id}/members`, dto); }
  removeMember(id: string, userId: string): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/${id}/members/${userId}`); }
  getActivity(id: string, page = 1, pageSize = 25): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.baseUrl}/${id}/activity`, { params: { page, pageSize } });
  }
}
