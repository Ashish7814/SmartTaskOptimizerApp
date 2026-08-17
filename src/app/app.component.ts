import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { AuthService } from './core/auth/auth.service';
import { TaskHubService } from './core/signalr/task-hub.service';

@Component({
  selector: 'app-root', standalone: true, imports: [RouterOutlet, CommonModule, HeaderComponent, SidebarComponent],
  templateUrl: './app.component.html', styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly platformId = inject(PLATFORM_ID);
  readonly isAuthenticated$ = inject(AuthService).isAuthenticated$;
  isSidebarOpen = this.getInitialSidebarState();

  constructor(private readonly auth: AuthService, private readonly hub: TaskHubService) {
    if (isPlatformBrowser(this.platformId)) {
      this.auth.session$.subscribe(session => session ? this.hub.connect() : this.hub.disconnect());
    }
  }


  private getInitialSidebarState(): boolean {
    return isPlatformBrowser(this.platformId) ? window.innerWidth > 768 : true;
  }
}
