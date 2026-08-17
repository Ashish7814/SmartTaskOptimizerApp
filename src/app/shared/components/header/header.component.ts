import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TaskHubService } from '../../../core/signalr/task-hub.service';

@Component({
  selector: 'app-header', standalone: true, imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html', styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  readonly session$ = this.auth.session$;
  unreadCount = 0;
  constructor(private readonly auth: AuthService, private readonly notifications: NotificationService, private readonly hub: TaskHubService) {
    this.loadUnread();
    this.hub.events$.subscribe(event => {
      if (event.target === 'notification') this.unreadCount++;
    });
  }
  loadUnread(): void { this.notifications.getNotifications(true, 1, 25).subscribe({ next: items => this.unreadCount = items.length, error: () => undefined }); }
  markNotificationsRead(): void { this.notifications.markAllRead().subscribe({ next: () => this.unreadCount = 0, error: () => undefined }); }
  logout(): void { this.auth.logout(); this.hub.disconnect(); }
}
