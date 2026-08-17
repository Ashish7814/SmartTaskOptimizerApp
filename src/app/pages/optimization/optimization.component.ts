import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { OptimizationResult, Priority, Task } from '../../shared/models/task.model';

@Component({
  selector: 'app-optimization',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './optimization.component.html',
  styleUrl: './optimization.component.css',
})
export class OptimizationComponent {

  constructor(private taskService: TaskService){}
  
  availableTasks: (Task & { selected?: boolean })[] = [];
  selectedTaskIds: string[] = [];
  selectAll = false;
  optimizing = false;
  optimizationResult: OptimizationResult | null = null;

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks({ page: 1, pageSize: 100, includeCompleted: false }).subscribe({
      next: (result) => {
        this.availableTasks = result.items.map(task => ({ ...task, selected: false }));
      },
      error: (error) => console.error('Error loading tasks:', error)
    });
  }

  toggleSelectAll() {
    this.availableTasks.forEach(task => task.selected = this.selectAll);
    this.updateSelection();
  }

  updateSelection() {
    this.selectedTaskIds = this.availableTasks
      .filter(task => task.selected)
      .map(task => task.id);
    this.selectAll = this.selectedTaskIds.length === this.availableTasks.length;
  }

  optimizeTasks() {
    if (this.selectedTaskIds.length === 0) return;

    this.optimizing = true;
    this.taskService.optimizeTasks(this.selectedTaskIds).subscribe({
      next: (result) => {
        this.optimizationResult = result;
        this.optimizing = false;
      },
      error: (error) => {
        console.error('Error optimizing tasks:', error);
        this.optimizing = false;
      }
    });
  }

  getPriorityLabel(priority: Priority): string {
    return Priority[priority];
  }

  getPriorityClass(priority: Priority): string {
    return Priority[priority].toLowerCase();
  }

  formatTime(date: string | Date): string {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
