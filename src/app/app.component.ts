import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, signal, PLATFORM_ID, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, HeaderComponent, SidebarComponent],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  
  private platformId = inject(PLATFORM_ID);
  isSidebarOpen = this.getInitialSidebarState();

  private getInitialSidebarState(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return window.innerWidth > 768;
    }
    return true; // Default to open on server
  }
}
