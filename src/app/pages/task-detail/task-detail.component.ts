import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { CommentService } from '../../core/services/comment.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { AuthService } from '../../core/auth/auth.service';
import { Task, TaskStatus } from '../../shared/models/task.model';
import { TaskComment, TaskHistory } from '../../shared/models/api.models';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../shared/components/priority-badge/priority-badge.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { getSelectableStatuses } from '../../shared/utils/task-status-transitions/task-status-transitions';
import { statusLabel } from '../../shared/utils/task-labels/task-labels';
import { parseApiError } from '../../shared/utils/api-error/api-error';

interface DependencyRow {
  id: string;
  title: string | null;
  status: TaskStatus | null;
}

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatusBadgeComponent, PriorityBadgeComponent, AvatarComponent],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.css'
})
export class TaskDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);
  private readonly commentService = inject(CommentService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly auth = inject(AuthService);

  task: Task | null = null;
  projectName: string | null = null;
  dependencies: DependencyRow[] = [];
  comments: TaskComment[] = [];
  history: TaskHistory[] = [];
  selectableStatuses: TaskStatus[] = [];

  loading = true;
  loadError: string | null = null;
  changingStatus = false;
  deleting = false;

  loadingComments = false;
  postingComment = false;
  newCommentBody = '';

  loadingHistory = false;

  readonly currentUserId = this.auth.getSession()?.userId ?? null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/tasks']);
      return;
    }
    this.load(id);
  }

  load(id: string): void {
    this.loading = true;
    this.loadError = null;
    this.taskService.getTaskById(id).subscribe({
      next: task => {
        this.task = task;
        this.selectableStatuses = getSelectableStatuses(task.status).filter(s => s !== task.status);
        this.loading = false;
        this.loadProject(task.projectId ?? null);
        this.loadDependencies(task.dependencyIds ?? []);
        this.loadComments(task.id);
        this.loadHistory(task.id);
      },
      error: () => {
        this.loading = false;
        this.loadError = 'This task could not be loaded. It may have been deleted or you may not have access to it.';
      }
    });
  }

  private loadProject(projectId: string | null): void {
    this.projectName = null;
    if (!projectId) return;
    this.projectService.getProject(projectId).subscribe({
      next: project => (this.projectName = project.name),
      error: () => (this.projectName = 'Unknown project')
    });
  }

  private loadDependencies(ids: string[]): void {
    if (ids.length === 0) {
      this.dependencies = [];
      return;
    }
    forkJoin(
      ids.map(id => this.taskService.getTaskById(id).pipe(catchError(() => of(null))))
    ).subscribe(tasks => {
      this.dependencies = ids.map((id, index) => ({
        id,
        title: tasks[index]?.title ?? null,
        status: tasks[index]?.status ?? null
      }));
    });
  }

  private loadComments(taskId: string): void {
    this.loadingComments = true;
    this.commentService.getComments(taskId).subscribe({
      next: comments => {
        this.comments = comments;
        this.loadingComments = false;
      },
      error: () => {
        this.loadingComments = false;
      }
    });
  }

  private loadHistory(taskId: string): void {
    this.loadingHistory = true;
    this.taskService.getTaskHistory(taskId).subscribe({
      next: history => {
        this.history = history;
        this.loadingHistory = false;
      },
      error: () => {
        this.loadingHistory = false;
      }
    });
  }

  statusLabel(status: TaskStatus): string {
    return statusLabel(status);
  }

  changeStatus(status: TaskStatus): void {
    if (!this.task || this.changingStatus) return;
    this.changingStatus = true;
    const previous = this.task.status;
    this.taskService.updateStatus(this.task.id, status).subscribe({
      next: () => {
        this.changingStatus = false;
        this.toast.success(`Status changed to ${this.statusLabel(status)}.`);
        this.load(this.task!.id);
      },
      error: (error: unknown) => {
        this.changingStatus = false;
        this.task = { ...this.task!, status: previous };
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  async deleteTask(): Promise<void> {
    if (!this.task) return;
    const confirmed = await this.confirm.ask({
      title: 'Delete task?',
      message: `"${this.task.title}" will be permanently deleted. This cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true
    });
    if (!confirmed) return;

    this.deleting = true;
    this.taskService.deleteTask(this.task.id).subscribe({
      next: () => {
        this.toast.success('Task deleted.');
        this.router.navigate(['/tasks']);
      },
      error: (error: unknown) => {
        this.deleting = false;
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  postComment(event: Event): void {
    event.preventDefault();
    const body = this.newCommentBody.trim();
    if (!body || !this.task) return;
    this.postingComment = true;
    this.commentService.createComment(this.task.id, body).subscribe({
      next: comment => {
        this.comments = [...this.comments, comment];
        this.newCommentBody = '';
        this.postingComment = false;
      },
      error: (error: unknown) => {
        this.postingComment = false;
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  async deleteComment(comment: TaskComment): Promise<void> {
    if (!this.task) return;
    const confirmed = await this.confirm.ask({
      title: 'Delete comment?',
      message: 'This comment will be permanently removed.',
      confirmLabel: 'Delete',
      danger: true
    });
    if (!confirmed) return;
    this.commentService.deleteComment(this.task.id, comment.id).subscribe({
      next: () => (this.comments = this.comments.filter(c => c.id !== comment.id)),
      error: (error: unknown) => this.toast.error(parseApiError(error).message)
    });
  }

  formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  isOverdue(task: Task): boolean {
    return task.status !== TaskStatus.Completed && task.status !== TaskStatus.Cancelled && new Date(task.deadline).getTime() < Date.now();
  }
}
