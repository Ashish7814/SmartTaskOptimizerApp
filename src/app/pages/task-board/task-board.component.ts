import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { Task, TaskStatus } from '../../shared/models/task.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../shared/components/priority-badge/priority-badge.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ToastService } from '../../core/services/toast.service';
import { statusLabel } from '../../shared/utils/task-labels/task-labels';
import { parseApiError } from '../../shared/utils/api-error/api-error';
import { getSelectableStatuses } from '../../shared/utils/task-status-transitions/task-status-transitions';

interface BoardColumn {
  status: TaskStatus;
  label: string;
  tasks: Task[];
}

const COLUMN_ORDER: TaskStatus[] = [TaskStatus.Pending, TaskStatus.InProgress, TaskStatus.OnHold, TaskStatus.Completed, TaskStatus.Cancelled];

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, PriorityBadgeComponent, AvatarComponent],
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.css',
})
export class TaskBoardComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly toast = inject(ToastService);

  columns: BoardColumn[] = [];
  loading = true;
  error: string | null = null;
  updatingTaskId: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.taskService.getTasks({ page: 1, pageSize: 100, sortBy: 'priority', descending: true }).subscribe({
      next: result => {
        this.columns = COLUMN_ORDER.map(status => ({
          status,
          label: statusLabel(status),
          tasks: result.items.filter(t => t.status === status)
        }));
        this.loading = false;
      },
      error: (error: unknown) => {
        this.loading = false;
        this.error = parseApiError(error).message;
      }
    });
  }

  transitionsFor(task: Task): TaskStatus[] {
    return getSelectableStatuses(task.status).filter(s => s !== task.status);
  }

  statusLabel(status: TaskStatus): string {
    return statusLabel(status);
  }

  moveTask(task: Task, status: TaskStatus): void {
    this.updatingTaskId = task.id;
    this.taskService.updateStatus(task.id, status).subscribe({
      next: () => {
        this.updatingTaskId = null;
        this.toast.success(`Moved to ${this.statusLabel(status)}.`);
        this.load();
      },
      error: (error: unknown) => {
        this.updatingTaskId = null;
        this.toast.error(parseApiError(error).message);
      }
    });
  }
}
