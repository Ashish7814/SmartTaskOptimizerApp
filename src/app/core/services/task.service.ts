import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { PagedResult, TaskHistory } from '../../shared/models/api.models';
import {
  CreateTaskDto,
  Task,
  TaskFilter,
  TaskSortField,
  TaskStatistics,
  TaskStatus,
  UpdateTaskDto
} from '../../shared/models/task.model';
import { OptimizationResult } from '../../shared/models/task.model';

const VALID_SORT_FIELDS: readonly TaskSortField[] = ['title', 'deadline', 'priority', 'status', 'updatedAt'];

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly baseUrl = `${environment.apiUrl}/tasks`;
  private readonly tasksSubject = new BehaviorSubject<Task[]>([]);
  readonly tasks$ = this.tasksSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  getTasks(filter: TaskFilter = {}): Observable<PagedResult<Task>> {
    let params = new HttpParams()
      .set('page', String(filter.page ?? 1))
      .set('pageSize', String(filter.pageSize ?? 25))
      .set('sortBy', this.toBackendSort(filter.sortBy))
      .set('descending', String(filter.descending ?? true))
      .set('includeCompleted', String(filter.includeCompleted ?? true));

    const optional: Record<string, string | number | undefined> = {
      status: filter.status,
      priority: filter.priority,
      tag: filter.tag,
      category: filter.category,
      search: filter.searchTerm,
      projectId: filter.projectId,
      assigneeId: filter.assigneeId
    };
    Object.entries(optional).forEach(([key, value]) => {
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
    return this.http.post<string>(this.baseUrl, task);
  }

  updateTask(id: string, task: UpdateTaskDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, task);
  }

  updateStatus(id: string, status: TaskStatus): Observable<void> {
    const params = new HttpParams().set('status', status);
    return this.http.put<void>(`${this.baseUrl}/${id}/status`, null, { params });
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  optimizeTasks(taskIds: string[]): Observable<OptimizationResult> {
    return this.http.post<OptimizationResult>(`${this.baseUrl}/optimize`, { taskIds });
  }

  getStatistics(projectId?: string): Observable<TaskStatistics> {
    let params = new HttpParams();
    if (projectId) params = params.set('projectId', projectId);
    return this.http.get<TaskStatistics>(`${this.baseUrl}/statistics`, { params });
  }

  getTaskHistory(id: string): Observable<TaskHistory[]> {
    return this.http.get<TaskHistory[]>(`${this.baseUrl}/${id}/history`);
  }

  private toBackendSort(sortBy?: TaskSortField): TaskSortField {
    return sortBy && VALID_SORT_FIELDS.includes(sortBy) ? sortBy : 'updatedAt';
  }

  private normalizeTask(task: Task): Task {
    return {
      ...task,
      estimatedDuration: task.estimatedDurationMinutes,
      dueDate: task.deadline,
      dependencies: task.dependencyIds ?? []
    };
  }
}
