import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
// import { BehaviorSubject, catchError, Observable, throwError } from 'rxjs';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CreateTaskDto, OptimizationResult, Task, TaskFilter, TaskStatistics, UpdateTaskDto } from '../../shared/models/task.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly baseUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // getTasks(): Observable<Task[]> {
  //   return this.http.get<Task[]>(`${this.baseUrl}/getallTasks`).pipe(
  //     catchError(error => {
  //       console.error('Error fetching tasks:', error);
  //       return throwError(() => new Error('Error fetching tasks: ' + error.message));
  //     })
  //   );
  // }

  // getTasks(): Observable<Task[]> {
  //   try{
  //     return this.http.get<Task[]>(`${this.baseUrl}/getallTasks`);
  //   }
  //   catch(error){
  //     throw new Error('Error fetching tasks: ' + error);
  //   } 
  // }

  // createTask(payload: any): Observable<string>{
  //   try{
  //     return this.http.post<string>(`${this.baseUrl}`, payload);
  //   }
  //   catch(error){
  //     throw new Error('Error creating task: ' + error);
  //   }
  // }

  // updateTask(id: string, payload: any): Observable<void>{
  //   try{
  //     return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  //   }
  //   catch(error){
  //     throw new Error('Error updating task status: ' + error);
  //   }
  // }
  
  updateStatus(id: string, status: number): Observable<void>{
    try{
      return this.http.put<void>(`${this.baseUrl}/${id}/status?status=${status}`,  {});
    }
    catch(error){
      throw new Error('Error updating task status: ' + error);
    }
  }

  getTaskHistory(id: string): Observable<any>{
    try{
      return this.http.get<any>(`${this.baseUrl}/${id}/history`);
    }
    catch(error){
      throw new Error('Error fetching task history: ' + error);
    }
  }


   private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  getTasks(filter?: TaskFilter): Observable<Task[]> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.status) {
        params = params.append('status', filter.status.join(','));
      }
      if (filter.priority) {
        params = params.append('priority', filter.priority.join(','));
      }
      if (filter.tags) {
        params = params.append('tags', filter.tags.join(','));
      }
      if (filter.category) {
        params = params.append('category', filter.category);
      }
      if (filter.searchTerm) {
        params = params.append('search', filter.searchTerm);
      }
    }

    return this.http.get<Task[]>(this.baseUrl, { params }).pipe(
      tap(tasks => this.tasksSubject.next(tasks))
    );
  }

  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.baseUrl}/${id}`);
  }

  createTask(task: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(this.baseUrl, task).pipe(
      tap(() => this.refreshTasks())
    );
  }

  updateTask(id: string, task: UpdateTaskDto): Observable<Task> {
    return this.http.put<Task>(`${this.baseUrl}/${id}`, task).pipe(
      tap(() => this.refreshTasks())
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.refreshTasks())
    );
  }

  optimizeTasks(taskIds: string[]): Observable<OptimizationResult> {
    return this.http.post<OptimizationResult>(`${this.baseUrl}/optimize`, { taskIds });
  }

  getStatistics(): Observable<TaskStatistics> {
    return this.http.get<TaskStatistics>(`${this.baseUrl}/statistics`);
  }

  private refreshTasks(): void {
    this.getTasks().subscribe();
  }

}
