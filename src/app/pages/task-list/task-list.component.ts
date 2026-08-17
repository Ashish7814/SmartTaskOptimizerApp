import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { Priority, Task, TaskStatus } from '../../shared/models/task.model';

@Component({
  selector: 'app-task-list',
  imports: [CommonModule, RouterModule, FormsModule],
  standalone: true,
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];

  constructor(private taskService: TaskService) {}

  // ngOnInit(): void {
  //   this.loadTasks();
  // }

  // loadTasks(): void {
  //   this.taskService.getTasks().subscribe(res => this.tasks = res);
  // }


  filteredTasks: Task[] = [];
  loading = true;
  
  searchTerm = '';
  selectedStatuses: TaskStatus[] = [];
  selectedPriorities: Priority[] = [];
  sortBy = 'createdAt';
  viewMode: 'grid' | 'list' = 'grid';
  
  TaskStatus = TaskStatus;
  
  statusOptions = [
    { label: 'Pending', value: TaskStatus.Pending },
    { label: 'In Progress', value: TaskStatus.InProgress },
    { label: 'Completed', value: TaskStatus.Completed },
    { label: 'On Hold', value: TaskStatus.OnHold },
    { label: 'Cancelled', value: TaskStatus.Cancelled }
  ];
  
  priorityOptions = [
    { label: 'Critical', value: Priority.Critical },
    { label: 'High', value: Priority.High },
    { label: 'Medium', value: Priority.Medium },
    { label: 'Low', value: Priority.Low }
  ];

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.loading = true;
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    let filtered = [...this.tasks];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term) ||
        task.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (this.selectedStatuses.length > 0) {
      filtered = filtered.filter(task => this.selectedStatuses.includes(task.status));
    }

    // Priority filter
    if (this.selectedPriorities.length > 0) {
      filtered = filtered.filter(task => this.selectedPriorities.includes(task.priority));
    }

    this.filteredTasks = filtered;
    this.sortTasks();
  }

  sortTasks() {
    this.filteredTasks.sort((a, b) => {
      switch (this.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          return b.priority - a.priority;
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }

  toggleStatusFilter(status: TaskStatus) {
    const index = this.selectedStatuses.indexOf(status);
    if (index > -1) {
      this.selectedStatuses.splice(index, 1);
    } else {
      this.selectedStatuses.push(status);
    }
    this.applyFilters();
  }

  togglePriorityFilter(priority: Priority) {
    const index = this.selectedPriorities.indexOf(priority);
    if (index > -1) {
      this.selectedPriorities.splice(index, 1);
    } else {
      this.selectedPriorities.push(priority);
    }
    this.applyFilters();
  }

  isStatusSelected(status: TaskStatus): boolean {
    return this.selectedStatuses.includes(status);
  }

  isPrioritySelected(priority: Priority): boolean {
    return this.selectedPriorities.includes(priority);
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatuses = [];
    this.selectedPriorities = [];
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.searchTerm.length > 0 || 
           this.selectedStatuses.length > 0 || 
           this.selectedPriorities.length > 0;
  }

  deleteTask(id: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id).subscribe({
        next: () => this.loadTasks(),
        error: (error) => console.error('Error deleting task:', error)
      });
    }
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

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

}
