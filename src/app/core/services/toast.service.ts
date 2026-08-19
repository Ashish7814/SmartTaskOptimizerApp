import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  durationMs: number;
}

/**
 * Lightweight global toast/snackbar service. Kept dependency-free (no
 * Angular Material) since the rest of the app doesn't use a component
 * library - this mirrors the existing hand-rolled UI approach.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly toastsSubject = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this.toastsSubject.asObservable();

  success(message: string, durationMs = 4000): void {
    this.push('success', message, durationMs);
  }

  error(message: string, durationMs = 6000): void {
    this.push('error', message, durationMs);
  }

  info(message: string, durationMs = 4000): void {
    this.push('info', message, durationMs);
  }

  dismiss(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }

  private push(type: ToastType, message: string, durationMs: number): void {
    const toast: Toast = { id: this.nextId++, type, message, durationMs };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    if (durationMs > 0) {
      setTimeout(() => this.dismiss(toast.id), durationMs);
    }
  }
}
