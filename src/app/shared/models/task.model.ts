export enum Priority {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4
}

export enum TaskStatus {
  Pending = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
  OnHold = 5
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: Priority;
  status: TaskStatus;
  estimatedDurationMinutes: number;
  deadline: string;
  projectId?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  createdByUserId: string;
  createdByName?: string | null;
  category?: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  tags: string[];
  dependencyIds: string[];
  rowVersion?: string | null;

  // Compatibility helpers for the existing UI.
  readonly estimatedDuration: number;
  readonly dueDate: string;
  readonly dependencies: string[];
}

export interface CreateTaskDto {
  title: string;
  description?: string | null;
  priority: Priority;
  estimatedDuration: number;
  deadline: string;
  projectId?: string | null;
  assigneeId?: string | null;
  category?: string | null;
  tags: string[];
  dependencyIds: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string | null;
  priority?: Priority;
  status?: TaskStatus;
  estimatedDuration?: number;
  deadline?: string;
  assigneeId?: string | null;
  category?: string | null;
  progress?: number;
  tags?: string[];
  dependencyIds?: string[];
  rowVersion?: string | null;
}

export interface TaskQuery {
  projectId?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  search?: string;
  category?: string;
  tag?: string;
  includeCompleted?: boolean;
  sortBy?: string;
  descending?: boolean;
  page?: number;
  pageSize?: number;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: Priority;
  tag?: string;
  category?: string;
  searchTerm?: string;
  projectId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
  includeCompleted?: boolean;
}

export interface OptimizationResult {
  optimizedSchedule: ScheduledTask[];
  totalDuration: number;
  suggestions: string[];
  efficiency: number;
}

export interface ScheduledTask {
  task: Task;
  startTime: string;
  endTime: string;
  order: number;
}

export interface TaskStatistics {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  completionRate: number;
  averageDurationMinutes: number;
  byPriority: Record<number, number>;
  byStatus: Record<number, number>;
}
