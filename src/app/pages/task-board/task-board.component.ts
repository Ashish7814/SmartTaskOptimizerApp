import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../core/services/task.service';
import { Task } from '../../shared/models/task.model';

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.css',
})
export class TaskBoardComponent implements OnInit {
  tasks: Task[] = [];

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.taskService.getTasks({ page: 1, pageSize: 100 }).subscribe(res => this.tasks = res.items);
  }

  updateStatus(task: Task, status: number): void {
    this.taskService.updateStatus(task.id, status).subscribe(() => {
      task.status = status;
    });
  }

}
