import { RouterModule, Routes } from '@angular/router';
import { TaskListComponent } from './pages/task-list/task-list.component';
import { TaskBoardComponent } from './pages/task-board/task-board.component';
import { NgModule } from '@angular/core';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'tasks',
    loadComponent: () => import('./pages/task-list/task-list.component').then(m => m.TaskListComponent)
  },
  {
    path: 'tasks/new',
    loadComponent: () => import('./pages/task-dialog/task-dialog.component').then(m => m.TaskDialogComponent)
  },
  {
    path: 'tasks/:id/edit',
    loadComponent: () => import('./pages/task-dialog/task-dialog.component').then(m => m.TaskDialogComponent)
  },
  {
    path: 'optimization',
    loadComponent: () => import('./pages/optimization/optimization.component').then(m => m.OptimizationComponent)
  },
  {
    path: 'analytics',
    loadComponent: () => import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
