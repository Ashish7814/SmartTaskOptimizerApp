export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

export interface UserSession {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  expiresAtUtc: string;
}

export type UserRole = 'User' | 'Manager' | 'Admin';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  memberCount: number;
  taskCount: number;
}

export interface CreateProjectDto {
  name: string;
  description?: string | null;
}

export interface ProjectMember {
  userId: string;
  fullName: string;
  email: string;
  role: 'Member' | 'Manager' | string;
  joinedAt: string;
}

export interface AddProjectMemberDto {
  userId: string;
  role: 'Member' | 'Manager';
}

export interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  onHoldTasks: number;
  highPriorityTasks: number;
  criticalPriorityTasks: number;
  overdueTasks: number;
  totaltblTasks?: number;
  todotblTasks?: number;
  inProgresstblTasks?: number;
  qAtblTasks?: number;
  donetblTasks?: number;
  highPrioritytblTasks?: number;
  criticalPrioritytblTasks?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: number;
  projectId?: string | null;
  taskId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Activity {
  id: string;
  projectId: string;
  actorId: string;
  actorName: string;
  taskId?: string | null;
  action: string;
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskHistory {
  oldStatus: number;
  newStatus: number;
  oldPriority: number;
  newPriority: number;
  changedAt: string;
  changedByUserId: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
}

export interface UpdateProfileDto {
  fullName: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
