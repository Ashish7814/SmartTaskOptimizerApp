import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TaskStatus } from '../../models/task.model';

const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.Pending]: 'Pending',
  [TaskStatus.InProgress]: 'In Progress',
  [TaskStatus.Completed]: 'Completed',
  [TaskStatus.OnHold]: 'On Hold',
  [TaskStatus.Cancelled]: 'Cancelled'
};

const STATUS_CLASSES: Record<TaskStatus, string> = {
  [TaskStatus.Pending]: 'status-pending',
  [TaskStatus.InProgress]: 'status-inprogress',
  [TaskStatus.Completed]: 'status-completed',
  [TaskStatus.OnHold]: 'status-onhold',
  [TaskStatus.Cancelled]: 'status-cancelled'
};

/** Reusable status pill so every screen renders task status identically. */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge-pill" [ngClass]="cssClass"><span class="dot"></span>{{ label }}</span>`
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: TaskStatus;

  get label(): string {
    return STATUS_LABELS[this.status] ?? 'Unknown';
  }

  get cssClass(): string {
    return STATUS_CLASSES[this.status] ?? 'status-pending';
  }
}
