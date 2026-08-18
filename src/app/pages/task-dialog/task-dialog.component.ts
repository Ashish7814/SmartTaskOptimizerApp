import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, Subject, catchError, debounceTime, distinctUntilChanged, forkJoin, of, switchMap } from 'rxjs';
import { PagedResult } from '../../shared/models/api.models';

import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { Project, ProjectMember } from '../../shared/models/api.models';
import { CreateTaskDto, Priority, Task, TaskStatus, UpdateTaskDto } from '../../shared/models/task.model';
import { HasUnsavedChanges } from '../../core/auth/unsaved-changes-guard';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../shared/components/priority-badge/priority-badge.component';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../../shared/utils/task-labels/task-labels';
import { getSelectableStatuses } from '../../shared/utils/task-status-transitions/task-status-transitions';
import { parseApiError } from '../../shared/utils/api-error/api-error';

interface DependencyChip {
  id: string;
  title: string;
}

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, StatusBadgeComponent, PriorityBadgeComponent],
  templateUrl: './task-dialog.component.html',
  styleUrl: './task-dialog.component.css'
})
export class TaskDialogComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly priorityOptions = PRIORITY_OPTIONS;
  readonly statusOptions = STATUS_OPTIONS;

  isEditMode = false;
  taskId: string | null = null;
  loading = false;
  saving = false;
  loadError: string | null = null;
  serverErrors: Record<string, string[]> = {};

  projects: Project[] = [];
  projectMembers: ProjectMember[] = [];
  loadingMembers = false;
  currentTask: Task | null = null;

  newTag = '';
  dependencySearchTerm = '';
  dependencyResults: Task[] = [];
  searchingDependencies = false;
  selectedDependencies: DependencyChip[] = [];
  selectableStatuses: TaskStatus[] = [TaskStatus.Pending];

  private readonly dependencySearch$ = new Subject<string>();
  private initialSnapshot = '';
  private submitted = false;

  readonly form = this.fb.nonNullable.group({
    title: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.maxLength(200)] }),
    description: this.fb.nonNullable.control('', { validators: [Validators.maxLength(5000)] }),
    category: this.fb.nonNullable.control(''),
    priority: this.fb.nonNullable.control<Priority>(Priority.Medium, { validators: [Validators.required] }),
    status: this.fb.nonNullable.control<TaskStatus>(TaskStatus.Pending),
    projectId: this.fb.control<string | null>(null),
    assigneeId: this.fb.control<string | null>({ value: null, disabled: true }),
    estimatedDuration: this.fb.nonNullable.control<number>(30, { validators: [Validators.required, Validators.min(1), Validators.max(10080)] }),
    deadline: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    tags: this.fb.nonNullable.control<string[]>([]),
    dependencyIds: this.fb.nonNullable.control<string[]>([]),
    progress: this.fb.nonNullable.control<number>(0, { validators: [Validators.min(0), Validators.max(100)] }),
    rowVersion: this.fb.control<string | null>(null)
  });

  ngOnInit(): void {
    this.taskId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.taskId;

    this.projectService.getProjects().subscribe({
      next: projects => (this.projects = projects),
      error: () => this.toast.error('Could not load the project list. Project selection will be unavailable.')
    });

    this.form.controls.projectId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), distinctUntilChanged())
      .subscribe(projectId => this.onProjectChanged(projectId));

    const emptyResult: PagedResult<Task> = { items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false };

    this.dependencySearch$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          if (!term.trim()) return of(emptyResult);
          this.searchingDependencies = true;
          return this.taskService.getTasks({ searchTerm: term, pageSize: 10 }).pipe(
            catchError(() => of(emptyResult)),
          );
        })
      )
      .subscribe(result => {
        this.searchingDependencies = false;
        const chosen = new Set(this.selectedDependencies.map(d => d.id));
        this.dependencyResults = result.items.filter(t => t.id !== this.taskId && !chosen.has(t.id));
      });

    if (this.isEditMode && this.taskId) {
      this.loadTask(this.taskId);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      this.form.patchValue({ deadline: this.formatDateForInput(tomorrow) });
      this.captureSnapshot();
    }
  }

  loadTask(id: string): void {
    this.loading = true;
    this.loadError = null;
    this.taskService.getTaskById(id).subscribe({
      next: task => {
        this.currentTask = task;
        this.selectableStatuses = getSelectableStatuses(task.status);
        this.form.patchValue({
          title: task.title,
          description: task.description ?? '',
          category: task.category ?? '',
          priority: task.priority,
          status: task.status,
          projectId: task.projectId ?? null,
          estimatedDuration: task.estimatedDurationMinutes,
          deadline: this.formatDateForInput(new Date(task.deadline)),
          tags: [...(task.tags ?? [])],
          dependencyIds: [...(task.dependencyIds ?? [])],
          progress: task.progress ?? 0,
          rowVersion: task.rowVersion ?? null
        }, { emitEvent: false });

        if (task.projectId) {
          this.loadMembers(task.projectId, task.assigneeId ?? null, task.assigneeName ?? null);
        } else {
          this.form.controls.assigneeId.disable();
        }
        this.form.controls.assigneeId.setValue(task.assigneeId ?? null);

        this.hydrateDependencyChips(task.dependencyIds ?? []);
        this.loading = false;
        this.captureSnapshot();
      },
      error: () => {
        this.loading = false;
        this.loadError = 'This task could not be loaded. It may have been deleted or you may not have access to it.';
      }
    });
  }

  private hydrateDependencyChips(ids: string[]): void {
    if (ids.length === 0) {
      this.selectedDependencies = [];
      return;
    }
    forkJoin(
      ids.map(id => this.taskService.getTaskById(id).pipe(
        catchError(() => of(null))
      ))
    ).subscribe(tasks => {
      this.selectedDependencies = ids.map((id, index) => ({
        id,
        title: tasks[index]?.title ?? `Unknown task (${id.slice(0, 8)}…)`
      }));
    });
  }

  private onProjectChanged(projectId: string | null): void {
    this.form.controls.assigneeId.setValue(null);
    this.projectMembers = [];
    if (!projectId) {
      this.form.controls.assigneeId.disable();
      return;
    }
    this.loadMembers(projectId);
  }

  private loadMembers(projectId: string, keepAssigneeId: string | null = null, keepAssigneeName: string | null = null): void {
    this.loadingMembers = true;
    this.projectService.getMembers(projectId).subscribe({
      next: members => {
        this.projectMembers = members;
        if (keepAssigneeId && !members.some(m => m.userId === keepAssigneeId)) {
          this.projectMembers = [...members, {
            userId: keepAssigneeId,
            fullName: keepAssigneeName ?? 'Current assignee',
            email: '',
            role: 'Member',
            joinedAt: ''
          }];
        }
        this.form.controls.assigneeId.enable();
        this.loadingMembers = false;
      },
      error: () => {
        this.loadingMembers = false;
        this.form.controls.assigneeId.disable();
        this.toast.error('Could not load project members for assignment.');
      }
    });
  }

  onDependencySearchChange(term: string): void {
    this.dependencySearchTerm = term;
    this.dependencySearch$.next(term);
  }

  addDependency(task: Task): void {
    if (this.selectedDependencies.some(d => d.id === task.id)) return;
    this.selectedDependencies = [...this.selectedDependencies, { id: task.id, title: task.title }];
    this.form.controls.dependencyIds.setValue(this.selectedDependencies.map(d => d.id));
    this.dependencyResults = this.dependencyResults.filter(t => t.id !== task.id);
    this.dependencySearchTerm = '';
  }

  removeDependency(id: string): void {
    this.selectedDependencies = this.selectedDependencies.filter(d => d.id !== id);
    this.form.controls.dependencyIds.setValue(this.selectedDependencies.map(d => d.id));
  }

  addTag(event: Event): void {
    event.preventDefault();
    const tag = this.newTag.trim();
    if (!tag || tag.length > 50) return;
    const current = this.form.controls.tags.value ?? [];
    if (current.includes(tag)) { this.newTag = ''; return; }
    this.form.controls.tags.setValue([...current, tag]);
    this.newTag = '';
  }

  removeTag(index: number): void {
    const current = [...(this.form.controls.tags.value ?? [])];
    if (index >= 0 && index < current.length) {
      current.splice(index, 1);
      this.form.controls.tags.setValue(current);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Please fix the highlighted fields before saving.');
      return;
    }

    this.saving = true;
    this.serverErrors = {};
    const value = this.form.getRawValue();

    const payload = this.isEditMode
      ? ({
          title: value.title.trim(),
          description: value.description?.trim() || null,
          priority: value.priority,
          status: value.status,
          estimatedDuration: value.estimatedDuration,
          deadline: new Date(value.deadline).toISOString(),
          assigneeId: value.assigneeId || null,
          category: value.category?.trim() || null,
          progress: value.progress,
          tags: value.tags ?? [],
          dependencyIds: value.dependencyIds ?? [],
          rowVersion: value.rowVersion ?? null
        } satisfies UpdateTaskDto)
      : ({
          title: value.title.trim(),
          description: value.description?.trim() || null,
          priority: value.priority,
          estimatedDuration: value.estimatedDuration,
          deadline: new Date(value.deadline).toISOString(),
          projectId: value.projectId || null,
          assigneeId: value.assigneeId || null,
          category: value.category?.trim() || null,
          tags: value.tags ?? [],
          dependencyIds: value.dependencyIds ?? []
        } satisfies CreateTaskDto);

    const operation: Observable<unknown> = this.isEditMode && this.taskId
      ? this.taskService.updateTask(this.taskId, payload as UpdateTaskDto)
      : this.taskService.createTask(payload as CreateTaskDto);

    operation.subscribe({
      next: () => {
        this.submitted = true;
        this.saving = false;
        this.toast.success(this.isEditMode ? 'Task updated successfully.' : 'Task created successfully.');
        this.router.navigate(this.isEditMode && this.taskId ? ['/tasks', this.taskId] : ['/tasks']);
      },
      error: (error: unknown) => {
        this.saving = false;
        const apiError = parseApiError(error);
        this.serverErrors = apiError.fieldErrors;
        this.applyServerErrorsToForm();
        this.toast.error(apiError.message);
      }
    });
  }

  private applyServerErrorsToForm(): void {
    for (const key of Object.keys(this.serverErrors)) {
      const control = (this.form.controls as Record<string, unknown>)[key];
      if (control && typeof control === 'object' && 'setErrors' in control) {
        (control as { setErrors: (errors: ValidationErrors | null) => void }).setErrors({ server: this.serverErrors[key][0] });
      }
    }
  }

  fieldError(name: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[name];
    if (!control || (!control.dirty && !control.touched && !this.saving)) return null;
    if (!control.errors) return null;
    if (control.errors['server']) return control.errors['server'];
    if (control.errors['required']) return 'This field is required.';
    if (control.errors['maxlength']) return `Must be ${control.errors['maxlength'].requiredLength} characters or fewer.`;
    if (control.errors['min']) return `Must be at least ${control.errors['min'].min}.`;
    if (control.errors['max']) return `Must be at most ${control.errors['max'].max}.`;
    return 'This value is invalid.';
  }

  goBack(): void {
    void this.navigateBack();
  }

  private async navigateBack(): Promise<void> {
    if (this.hasUnsavedChanges() && !(await this.confirmDiscard())) return;
    if (this.isEditMode && this.taskId) {
      this.router.navigate(['/tasks', this.taskId]);
    } else {
      this.router.navigate(['/tasks']);
    }
  }

  hasUnsavedChanges(): boolean {
    if (this.submitted || this.loading) return false;
    return JSON.stringify(this.form.getRawValue()) !== this.initialSnapshot;
  }

  confirmDiscard(): Promise<boolean> {
    return this.confirm.ask({
      title: 'Discard changes?',
      message: 'You have unsaved changes. Are you sure you want to leave without saving?',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      danger: true
    });
  }

  private captureSnapshot(): void {
    this.initialSnapshot = JSON.stringify(this.form.getRawValue());
  }

  projectName(projectId: string | null | undefined): string {
    if (!projectId) return 'No project';
    return this.projects.find(p => p.id === projectId)?.name ?? 'Unknown project';
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
