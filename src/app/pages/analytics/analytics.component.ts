import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TaskService } from '../../core/services/task.service';
import { Priority, TaskStatistics } from '../../shared/models/task.model';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css',
})
export class AnalyticsComponent  {

  constructor(private taskService: TaskService) {}
  
  statistics: TaskStatistics | null = null;
  loading = true;
  statusChartData: any[] = [];
  priorityChartData: any[] = [];

  ngOnInit() {
    this.loadStatistics();
  }

  loadStatistics() {
    this.taskService.getStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
        this.prepareChartData(stats);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.loading = false;
      }
    });
  }

  prepareChartData(stats: TaskStatistics) {
    const total = stats.total || 1;

    this.statusChartData = [
      {
        label: 'Completed',
        class: 'completed',
        count: stats.completed,
        percentage: (stats.completed / total) * 100
      },
      {
        label: 'In Progress',
        class: 'inprogress',
        count: stats.inProgress,
        percentage: (stats.inProgress / total) * 100
      },
      {
        label: 'Pending',
        class: 'pending',
        count: stats.pending,
        percentage: (stats.pending / total) * 100
      }
    ];

    this.priorityChartData = [
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
}
