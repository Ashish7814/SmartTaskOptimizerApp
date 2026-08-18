import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { Priority, Task, TaskSortField, TaskStatus } from '../../shared/models/task.model';
import { Project, ProjectMember } from '../../shared/models/api.models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../shared/components/priority-badge/priority-badge.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { parseApiError } from '../../shared/utils/api-error/api-error';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../../shared/utils/task-labels/task-labels';


const PAGE_SIZE_OPTIONS = [10, 25, 50];

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent, PriorityBadgeComponent, AvatarComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
})
export class TaskListComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statusOptions = STATUS_OPTIONS;
  readonly priorityOptions = PRIORITY_OPTIONS;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly TaskStatus = TaskStatus;

  tasks: Task[] = [];
  loading = true;
  error: string | null = null;
  deletingId: string | null = null;

  projects: Project[] = [];
  projectMembers: ProjectMember[] = [];

  // Filters - kept 1:1 with what TaskQueryDto actually supports server-side.
  searchTerm = '';
  status: TaskStatus | null = null;
  priority: Priority | null = null;
  projectId: string | null = null;
  assigneeId: string | null = null;
  category = '';

  sortBy: TaskSortField = 'updatedAt';
  descending = true;

  page = 1;
  pageSize = 25;
  totalCount = 0;
  totalPages = 0;

  private readonly searchInput$ = new Subject<string>();

  ngOnInit(): void {
    this.projectService.getProjects().subscribe({
      next: projects => (this.projects = projects),
      error: () => this.toast.error('Could not load the project list for filtering.')
    });

    this.searchInput$
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(350), distinctUntilChanged())
      .subscribe(term => {
        this.searchTerm = term;
        this.page = 1;
        this.loadTasks();
      });

    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.error = null;
    this.taskService.getTasks({
      page: this.page,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm || undefined,
      status: this.status ?? undefined,
      priority: this.priority ?? undefined,
      projectId: this.projectId ?? undefined,
      assigneeId: this.assigneeId ?? undefined,
      category: this.category || undefined,
      sortBy: this.sortBy,
      descending: this.descending
    }).subscribe({
      next: result => {
        this.tasks = result.items;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        this.error = parseApiError(error).message;
      }
    });
  }

  onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  onStatusFilterChange(value: string): void {
    this.status = value === '' ? null : (Number(value) as TaskStatus);
    this.page = 1;
    this.loadTasks();
  }

  onPriorityFilterChange(value: string): void {
    this.priority = value === '' ? null : (Number(value) as Priority);
    this.page = 1;
    this.loadTasks();
  }

  onProjectFilterChange(value: string): void {
    this.projectId = value || null;
    this.assigneeId = null;
    this.projectMembers = [];
    if (this.projectId) {
      this.projectService.getMembers(this.projectId).subscribe({
        next: members => (this.projectMembers = members),
        error: () => this.toast.error('Could not load members for that project.')
      });
    }
    this.page = 1;
    this.loadTasks();
  }

  onAssigneeFilterChange(value: string): void {
    this.assigneeId = value || null;
    this.page = 1;
    this.loadTasks();
  }

  onCategoryFilterChange(value: string): void {
    this.category = value;
    this.page = 1;
    this.loadTasks();
  }

  sortByField(field: TaskSortField): void {
    if (this.sortBy === field) {
      this.descending = !this.descending;
    } else {
      this.sortBy = field;
      this.descending = true;
    }
    this.loadTasks();
  }

  changePage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages || newPage === this.page) return;
    this.page = newPage;
    this.loadTasks();
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadTasks();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.status = null;
    this.priority = null;
    this.projectId = null;
    this.assigneeId = null;
    this.category = '';
    this.projectMembers = [];
    this.page = 1;
    this.loadTasks();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.status !== null || this.priority !== null || this.projectId || this.assigneeId || this.category);
  }

  async deleteTask(task: Task): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Delete task?',
      message: `"${task.title}" will be permanently deleted. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true
    });
    if (!confirmed) return;

    this.deletingId = task.id;
    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.toast.success('Task deleted.');
        if (this.tasks.length === 1 && this.page > 1) this.page -= 1;
        this.loadTasks();
      },
      error: (error: unknown) => {
        this.deletingId = null;
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  projectNameFor(projectId: string | null | undefined): string {
    if (!projectId) return '—';
    return this.projects.find(p => p.id === projectId)?.name ?? '—';
  }

  isOverdue(task: Task): boolean {
    return task.status !== TaskStatus.Completed && task.status !== TaskStatus.Cancelled && new Date(task.deadline).getTime() < Date.now();
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  trackByTaskId(_index: number, task: Task): string {
    return task.id;
  }
}
