import { TaskStatus } from "../../models/task.model";

/**
 * Mirrors the exact state machine enforced server-side in
 * UpdateTaskCommandHandler.ApplyStatus - kept in one place so the UI only
 * ever offers transitions the backend will actually accept, avoiding
 * confusing 409 Conflict responses.
 */
const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.Pending]: [TaskStatus.InProgress, TaskStatus.OnHold, TaskStatus.Cancelled],
  [TaskStatus.InProgress]: [TaskStatus.Pending, TaskStatus.Completed, TaskStatus.OnHold, TaskStatus.Cancelled],
  [TaskStatus.OnHold]: [TaskStatus.InProgress, TaskStatus.Cancelled, TaskStatus.Pending],
  [TaskStatus.Completed]: [TaskStatus.InProgress],
  [TaskStatus.Cancelled]: [TaskStatus.Pending]
};

/** All statuses a task may move to from `current`, including `current` itself. */
export function getSelectableStatuses(current: TaskStatus): TaskStatus[] {
  return [current, ...(ALLOWED_TRANSITIONS[current] ?? [])];
}

export function canTransitionTo(current: TaskStatus, next: TaskStatus): boolean {
  return current === next || (ALLOWED_TRANSITIONS[current] ?? []).includes(next);
}
