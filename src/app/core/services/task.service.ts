import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { PagedResult } from '../../shared/models/api.models';
import { CreateTaskDto, OptimizationResult, Task, TaskFilter, TaskStatistics, UpdateTaskDto } from '../../shared/models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly baseUrl = `${environment.apiUrl}/tasks`;
  private readonly tasksSubject = new BehaviorSubject<Task[]>([]);
  readonly tasks$ = this.tasksSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  getTasks(filter: TaskFilter = {}): Observable<PagedResult<Task>> {
    let params = new HttpParams();
    const values: Record<string, string | number | boolean | undefined> = {
      status: filter.status,
      priority: filter.priority,
      tag: filter.tag,
      category: filter.category,
      search: filter.searchTerm,
      projectId: filter.projectId,
      page: filter.page ?? 1,
      pageSize: filter.pageSize ?? 25,
      sortBy: this.toBackendSort(filter.sortBy),
      descending: filter.descending ?? true,
      includeCompleted: filter.includeCompleted ?? true
    };
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });

    return this.http.get<PagedResult<Task>>(this.baseUrl, { params }).pipe(
      map(result => ({ ...result, items: result.items.map(task => this.normalizeTask(task)) })),
      tap(result => this.tasksSubject.next(result.items))
    );
  }

  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.baseUrl}/${id}`).pipe(map(task => this.normalizeTask(task)));
  }

  createTask(task: CreateTaskDto): Observable<string> {
    return this.http.post<string>(this.baseUrl, task).pipe(tap(() => this.refreshTasks()));
  }

  updateTask(id: string, task: UpdateTaskDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, task).pipe(tap(() => this.refreshTasks()));
  }

  updateStatus(id: string, status: number): Observable<void> {
    const params = new HttpParams().set('status', status);
    return this.http.put<void>(`${this.baseUrl}/${id}/status`, null, { params }).pipe(tap(() => this.refreshTasks()));
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(tap(() => this.refreshTasks()));
  }

  optimizeTasks(taskIds: string[]): Observable<OptimizationResult> {
    return this.http.post<OptimizationResult>(`${this.baseUrl}/optimize`, { taskIds });
  }

  getStatistics(projectId?: string): Observable<TaskStatistics> {
    let params = new HttpParams();
    if (projectId) params = params.set('projectId', projectId);
    return this.http.get<TaskStatistics>(`${this.baseUrl}/statistics`, { params });
  }

  getTaskHistory(id: string) {
    return this.http.get<import('../../shared/models/api.models').TaskHistory[]>(`${this.baseUrl}/${id}/history`);
  }

  private toBackendSort(sortBy?: string): string {
    return ['title', 'deadline', 'priority', 'status', 'updatedAt'].includes(sortBy ?? '') ? sortBy! : 'updatedAt';
  }

  private normalizeTask(task: Task): Task {
    return {
      ...task,
      estimatedDuration: task.estimatedDurationMinutes,
      dueDate: task.deadline,
      dependencies: task.dependencyIds ?? []
    };
  }

  private refreshTasks(): void {
    this.getTasks({ page: 1, pageSize: 25 }).subscribe({ error: () => undefined });
  }
}
