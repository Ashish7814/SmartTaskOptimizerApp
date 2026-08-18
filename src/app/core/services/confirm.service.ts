import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmRequest {
  resolve: (confirmed: boolean) => void;
}

/**
 * Promise-based confirmation dialog used in place of the native `confirm()`
 * so destructive actions (delete task, discard unsaved changes) get a
 * consistent, styled dialog instead of a browser-native popup.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly stateSubject = new BehaviorSubject<ConfirmState | null>(null);
  readonly state$ = this.stateSubject.asObservable();

  ask(request: ConfirmRequest): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.stateSubject.next({ ...request, resolve });
    });
  }

  respond(confirmed: boolean): void {
    const current = this.stateSubject.value;
    if (!current) return;
    this.stateSubject.next(null);
    current.resolve(confirmed);
  }
}
