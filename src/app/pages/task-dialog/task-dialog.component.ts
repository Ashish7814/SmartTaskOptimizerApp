import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { CreateTaskDto, Priority, TaskStatus, UpdateTaskDto } from '../../shared/models/task.model';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './task-dialog.component.html',
  styleUrl: './task-dialog.component.css',
})
export class TaskDialogComponent {
//  model = {
//     title: '',
//     description: '',
//     dueDate: '',
//     estimatedHours: 4,
//     projectId: '',
//     assignedToUserId: ''
//   };

  // form = new FormGroup({
  //   title: new FormControl(''),
  //   dueDate: new FormControl(''),
  //   estimatedHours: new FormControl(4),
  // });

  // constructor(private taskService: TaskService) {}

  // save(): void {
  //   if (this.form.invalid) return;

  //   this.taskService.createTask(this.form.value).subscribe(() => {
  //     alert('Task created');
  //   });
  // }

  // rivate taskService = inject(TaskService);
  // private router = inject(Router);
  // private route = inject(ActivatedRoute);

constructor(private taskService: TaskService, private router: Router, private route: ActivatedRoute ){}

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
    progress: 0
  };

  ngOnInit() {
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

  loadTask(id: string) {
    this.taskService.getTaskById(id).subscribe({
      next: (task) => {
        this.formData = {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          estimatedDuration: task.estimatedDuration,
          deadline: this.formatDateForInput(new Date(task.deadline)),
          category: task.category || '',
          tags: task.tags || [],
          dependencies: task.dependencies || [],
          progress: task.progress || 0
        };
        this.dependenciesInput = task.dependencies?.join(', ') || '';
      },
      error: (error) => {
        console.error('Error loading task:', error);
        this.router.navigate(['/tasks']);
      }
    });
  }

  onSubmit() {
    this.saving = true;

    // Parse dependencies
    const dependencies = this.dependenciesInput
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    const taskData = {
      ...this.formData,
      deadline: new Date(this.formData.deadline),
      dependencies
    };

    const operation = this.isEditMode && this.taskId
      ? this.taskService.updateTask(this.taskId, taskData as UpdateTaskDto)
      : this.taskService.createTask(taskData as CreateTaskDto);

    operation.subscribe({
      next: () => {
        this.router.navigate(['/tasks']);
      },
      error: (error) => {
        console.error('Error saving task:', error);
        this.saving = false;
      }
    });
  }

  addTag(event: Event) {
    event.preventDefault();
    if (this.newTag.trim()) {
      if (!this.formData.tags) {
        this.formData.tags = [];
      }
      this.formData.tags.push(this.newTag.trim());
      this.newTag = '';
    }
  }

  removeTag(index: number) {
    this.formData.tags.splice(index, 1);
  }

  goBack() {
    this.router.navigate(['/tasks']);
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
