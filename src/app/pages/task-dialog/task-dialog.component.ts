import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { TaskService } from '../../core/services/task.service';
import {
  CreateTaskDto,
  Priority,
  TaskStatus,
  UpdateTaskDto
} from '../../shared/models/task.model';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './task-dialog.component.html',
  styleUrl: './task-dialog.component.css',
})
export class TaskDialogComponent implements OnInit {

  constructor(
    private readonly taskService: TaskService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  isEditMode = false;
  taskId: string | null = null;
  saving = false;

  newTag = '';
  dependenciesInput = '';

  Priority = Priority;
  TaskStatus = TaskStatus;

  formData: any = {
    title: '',
    description: '',
    priority: Priority.Medium,
    status: TaskStatus.Pending,
    estimatedDuration: 30,
    deadline: '',
    category: '',
    tags: [],
    dependencies: [],
    projectId: null,
    assigneeId: null,
    rowVersion: null,
    progress: 0
  };

  ngOnInit(): void {
    this.taskId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.taskId;

    if (this.isEditMode && this.taskId) {
      this.loadTask(this.taskId);
    } else {
      // Set default deadline to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      this.formData.deadline = this.formatDateForInput(tomorrow);
    }
  }

  loadTask(id: string): void {
    this.taskService.getTaskById(id).subscribe({
      next: (task) => {
        this.formData = {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          estimatedDuration: task.estimatedDurationMinutes,
          deadline: this.formatDateForInput(
            new Date(task.deadline)
          ),
          category: task.category || '',
          tags: task.tags || [],
          dependencies: task.dependencyIds || [],
          progress: task.progress || 0,
          projectId: task.projectId ?? null,
          assigneeId: task.assigneeId ?? null,
          rowVersion: task.rowVersion ?? null
        };

        this.dependenciesInput =
          task.dependencies?.join(', ') || '';
      },

      error: (error: unknown) => {
        console.error('Error loading task:', error);
        this.router.navigate(['/tasks']);
      }
    });
  }

  onSubmit(): void {
    this.saving = true;

    // Parse dependencies
    const dependencies = this.dependenciesInput
      .split(',')
      .map((id: string) => id.trim())
      .filter((id: string) => id.length > 0);

    const taskData: CreateTaskDto | UpdateTaskDto =
      this.isEditMode
        ? {
            title: this.formData.title.trim(),
            description: this.formData.description || null,
            priority: Number(this.formData.priority),
            status: Number(this.formData.status),
            estimatedDuration: Number(
              this.formData.estimatedDuration
            ),
            deadline: new Date(
              this.formData.deadline
            ).toISOString(),
            assigneeId:
              this.formData.assigneeId || null,
            category:
              this.formData.category || null,
            progress: Number(this.formData.progress),
            tags: this.formData.tags ?? [],
            dependencyIds: dependencies,
            rowVersion:
              this.formData.rowVersion ?? null
          } as UpdateTaskDto
        : {
            title: this.formData.title.trim(),
            description:
              this.formData.description || null,
            priority: Number(this.formData.priority),
            estimatedDuration: Number(
              this.formData.estimatedDuration
            ),
            deadline: new Date(
              this.formData.deadline
            ).toISOString(),
            projectId:
              this.formData.projectId || null,
            assigneeId:
              this.formData.assigneeId || null,
            category:
              this.formData.category || null,
            tags: this.formData.tags ?? [],
            dependencyIds: dependencies
          } as CreateTaskDto;

    /*
     * Explicitly type the Observable so TypeScript doesn't
     * treat createTask() and updateTask() as incompatible
     * union types.
     */
    const operation: Observable<unknown> =
      this.isEditMode && this.taskId
        ? this.taskService.updateTask(
            this.taskId,
            taskData as UpdateTaskDto
          )
        : this.taskService.createTask(
            taskData as CreateTaskDto
          );

    operation.subscribe({
      next: () => {
        this.router.navigate(['/tasks']);
      },

      error: (error: unknown) => {
        console.error('Error saving task:', error);
        this.saving = false;
      }
    });
  }

  addTag(event: Event): void {
    event.preventDefault();

    const tag = this.newTag.trim();

    if (!tag) {
      return;
    }

    if (!this.formData.tags) {
      this.formData.tags = [];
    }

    this.formData.tags.push(tag);
    this.newTag = '';
  }

  removeTag(index: number): void {
    if (
      this.formData.tags &&
      index >= 0 &&
      index < this.formData.tags.length
    ) {
      this.formData.tags.splice(index, 1);
    }
  }

  goBack(): void {
    this.router.navigate(['/tasks']);
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      date.getDate()
    ).padStart(2, '0');

    const hours = String(
      date.getHours()
    ).padStart(2, '0');

    const minutes = String(
      date.getMinutes()
    ).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}