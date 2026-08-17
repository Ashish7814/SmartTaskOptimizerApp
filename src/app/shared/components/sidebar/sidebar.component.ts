import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, PLATFORM_ID } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {

   @Input() isOpen = true;
  @Output() closeSidebar = new EventEmitter<void>();

  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  mainNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
      route: '/dashboard'
    },
    {
      label: 'Tasks',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path></svg>',
      route: '/tasks',
      badge: 12
    }
  ];

  managementNavItems: NavItem[] = [
    {
      label: 'Optimization',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      route: '/optimization'
    },
    {
      label: 'Analytics',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>',
      route: '/analytics'
    }
  ];

  onNavClick() {
    if (isPlatformBrowser(this.platformId)) {
      if (window.innerWidth <= 768) {
        this.closeSidebar.emit();
      }
    }
  }
}
