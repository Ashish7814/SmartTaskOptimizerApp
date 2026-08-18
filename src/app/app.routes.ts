import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth-guard';
import { unsavedChangesGuard } from './core/auth/unsaved-changes-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'tasks', canActivate: [authGuard], loadComponent: () => import('./pages/task-list/task-list.component').then(m => m.TaskListComponent) },
  { path: 'tasks/board', canActivate: [authGuard], loadComponent: () => import('./pages/task-board/task-board.component').then(m => m.TaskBoardComponent) },
  { path: 'tasks/new', canActivate: [authGuard], canDeactivate: [unsavedChangesGuard], loadComponent: () => import('./pages/task-dialog/task-dialog.component').then(m => m.TaskDialogComponent) },
  { path: 'tasks/:id/edit', canActivate: [authGuard], canDeactivate: [unsavedChangesGuard], loadComponent: () => import('./pages/task-dialog/task-dialog.component').then(m => m.TaskDialogComponent) },
  { path: 'tasks/:id', canActivate: [authGuard], loadComponent: () => import('./pages/task-detail/task-detail.component').then(m => m.TaskDetailComponent) },
  { path: 'optimization', canActivate: [authGuard], loadComponent: () => import('./pages/optimization/optimization.component').then(m => m.OptimizationComponent) },
  { path: 'analytics', canActivate: [authGuard], loadComponent: () => import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent) },
  { path: 'settings', canActivate: [authGuard], loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
  { path: '**', redirectTo: '/dashboard' }
];
