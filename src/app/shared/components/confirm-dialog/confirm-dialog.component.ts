import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {
  private readonly confirmService = inject(ConfirmService);
  readonly state$ = this.confirmService.state$;

  respond(confirmed: boolean): void {
    this.confirmService.respond(confirmed);
  }
}
