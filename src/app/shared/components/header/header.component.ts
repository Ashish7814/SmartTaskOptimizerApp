import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Output,
  inject
} from '@angular/core';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TaskHubService } from '../../../core/signalr/task-hub.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly hub = inject(TaskHubService);

  readonly session$ = this.auth.session$;

  unreadCount = 0;

  constructor() {
    this.loadUnread();

    this.hub.events$.subscribe((event) => {
      if (event.target === 'notification') {
        this.unreadCount++;
      }
    });
  }

  loadUnread(): void {
    this.notifications
      .getNotifications(true, 1, 25)
      .subscribe({
        next: (items) => {
          this.unreadCount = items.length;
        },
        error: () => {
          // Ignore notification loading errors
        }
      });
  }

  markNotificationsRead(): void {
    this.notifications
      .markAllRead()
      .subscribe({
        next: () => {
          this.unreadCount = 0;
        },
        error: () => {
          // Ignore notification update errors
        }
      });
  }

  logout(): void {
    this.auth.logout();
    this.hub.disconnect();
  }
}
