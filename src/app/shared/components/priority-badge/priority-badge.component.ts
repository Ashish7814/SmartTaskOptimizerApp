import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Priority } from '../../models/task.model';

const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.Low]: 'Low',
  [Priority.Medium]: 'Medium',
  [Priority.High]: 'High',
  [Priority.Critical]: 'Critical'
};

const PRIORITY_CLASSES: Record<Priority, string> = {
  [Priority.Low]: 'priority-low',
  [Priority.Medium]: 'priority-medium',
  [Priority.High]: 'priority-high',
  [Priority.Critical]: 'priority-critical'
};

/** Reusable priority pill with a consistent visual indicator across screens. */
@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge-pill" [ngClass]="cssClass"><span class="dot"></span>{{ label }}</span>`
})
export class PriorityBadgeComponent {
  @Input({ required: true }) priority!: Priority;

  get label(): string {
    return PRIORITY_LABELS[this.priority] ?? 'Unknown';
  }

  get cssClass(): string {
    return PRIORITY_CLASSES[this.priority] ?? 'priority-low';
  }
}
