// export interface Task {
//      id: string;
//   title: string;
//   priority: number;
//   status: number;
//   dueDate: string;
// }



export enum Priority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3
}

export enum TaskStatus {
  Pending = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
  OnHold = 4
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  estimatedDuration: number; // in minutes
  deadline: Date;
  dependencies: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  assignedTo?: string;
  category?: string;
  progress?: number;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  priority: Priority;
  estimatedDuration: number;
  deadline: Date;
  dependencies?: string[];
  tags?: string[];
  category?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  estimatedDuration?: number;
  deadline?: Date;
  dependencies?: string[];
  tags?: string[];
  category?: string;
  progress?: number;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: Priority[];
  tags?: string[];
  category?: string;
  searchTerm?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface OptimizationResult {
  optimizedSchedule: ScheduledTask[];
  totalDuration: number;
  suggestions: string[];
  efficiency: number;
}

export interface ScheduledTask {
  task: Task;
  startTime: Date;
  endTime: Date;
  order: number;
}

export interface TaskStatistics {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  completionRate: number;
  averageDuration: number;
  byPriority: { [key in Priority]: number };
  byStatus: { [key in TaskStatus]: number };
}
