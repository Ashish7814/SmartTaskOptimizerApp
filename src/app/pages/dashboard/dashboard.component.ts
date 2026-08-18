import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { Priority, Task, TaskStatistics, TaskStatus } from '../../shared/models/task.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  
   constructor(private taskService: TaskService, private dashboardService: DashboardService) {}
  statistics: TaskStatistics | null = null;
  dashboardStats: import('../../shared/models/api.models').DashboardStats | null = null;
  recentTasks: Task[] = [];
  priorityData: any[] = [];

  ngOnInit() {
    this.loadStatistics();
    this.loadRecentTasks();
  }

  loadStatistics() {
    this.dashboardService.getStats().subscribe({
      next: stats => this.dashboardStats = stats,
      error: error => console.error('Error loading dashboard stats:', error)
    });
    this.taskService.getStatistics().subscribe({
      next: stats => { this.statistics = stats; this.updatePriorityData(stats); },
      error: error => console.error('Error loading task statistics:', error)
    });
  }

  loadRecentTasks() {
    this.taskService.getTasks({ page: 1, pageSize: 25, sortBy: 'updatedAt', descending: true }).subscribe({
      next: (result) => {
        this.recentTasks = result.items
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
      },
      error: (error) => console.error('Error loading tasks:', error)
    });
  }

  updatePriorityData(stats: TaskStatistics) {
    const total = stats.total || 1;
    this.priorityData = [
      {
        label: 'Critical',
        class: 'critical',
        count: stats.byPriority?.[Priority.Critical] || 0,
        percentage: ((stats.byPriority?.[Priority.Critical] || 0) / total) * 100
      },
      {
        label: 'High',
        class: 'high',
        count: stats.byPriority?.[Priority.High] || 0,
        percentage: ((stats.byPriority?.[Priority.High] || 0) / total) * 100
      },
      {
        label: 'Medium',
        class: 'medium',
        count: stats.byPriority?.[Priority.Medium] || 0,
        percentage: ((stats.byPriority?.[Priority.Medium] || 0) / total) * 100
      },
      {
        label: 'Low',
        class: 'low',
        count: stats.byPriority?.[Priority.Low] || 0,
        percentage: ((stats.byPriority?.[Priority.Low] || 0) / total) * 100
      }
    ];
  }

  getPriorityLabel(priority: Priority): string {
    return Priority[priority];
  }

  getPriorityClass(priority: Priority): string {
    return Priority[priority].toLowerCase();
  }

  getStatusLabel(status: TaskStatus): string {
    return TaskStatus[status].replace(/([A-Z])/g, ' $1').trim();
  }

  getStatusClass(status: TaskStatus): string {
    return TaskStatus[status].toLowerCase();
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
