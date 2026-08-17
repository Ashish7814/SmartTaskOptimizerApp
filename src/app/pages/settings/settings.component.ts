import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/auth/auth.service';
import { UserProfile } from '../../shared/models/api.models';

@Component({
  selector: 'app-settings', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html', styleUrl: './settings.component.css'
})
export class SettingsComponent {
  profile: UserProfile | null = null;
  fullName = '';
  currentPassword = '';
  newPassword = '';
  message = '';
  error = '';
  loading = false;

  constructor(private readonly profileService: ProfileService, private readonly auth: AuthService) {}

  ngOnInit(): void {
    this.profileService.getProfile().subscribe({
      next: profile => { this.profile = profile; this.fullName = profile.fullName; },
      error: error => this.error = error?.error?.detail || 'Unable to load profile.'
    });
  }

  saveProfile(): void {
    this.loading = true; this.message = ''; this.error = '';
    this.profileService.updateProfile({ fullName: this.fullName.trim() }).subscribe({
      next: () => { this.message = 'Profile updated.'; this.loading = false; },
      error: error => { this.error = error?.error?.detail || 'Unable to update profile.'; this.loading = false; }
    });
  }

  changePassword(): void {
    this.loading = true; this.message = ''; this.error = '';
    this.profileService.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
      next: () => { this.message = 'Password changed.'; this.currentPassword = ''; this.newPassword = ''; this.loading = false; },
      error: error => { this.error = error?.error?.detail || 'Unable to change password.'; this.loading = false; }
    });
  }
}
