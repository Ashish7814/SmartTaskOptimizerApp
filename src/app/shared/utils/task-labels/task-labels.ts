import { Priority, TaskStatus } from "../../models/task.model";


export interface Option<T> {
  label: string;
  value: T;
}

export const STATUS_OPTIONS: Option<TaskStatus>[] = [
  { label: 'Pending', value: TaskStatus.Pending },
  { label: 'In Progress', value: TaskStatus.InProgress },
  { label: 'Completed', value: TaskStatus.Completed },
  { label: 'On Hold', value: TaskStatus.OnHold },
  { label: 'Cancelled', value: TaskStatus.Cancelled }
];

export const PRIORITY_OPTIONS: Option<Priority>[] = [
  { label: 'Low', value: Priority.Low },
  { label: 'Medium', value: Priority.Medium },
  { label: 'High', value: Priority.High },
  { label: 'Critical', value: Priority.Critical }
];

export function statusLabel(status: TaskStatus): string {
  return STATUS_OPTIONS.find(o => o.value === status)?.label ?? 'Unknown';
}

export function priorityLabel(priority: Priority): string {
  return PRIORITY_OPTIONS.find(o => o.value === priority)?.label ?? 'Unknown';
}
