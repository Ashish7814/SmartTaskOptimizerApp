import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login', standalone: true, imports: [CommonModule, FormsModule, RouterModule],
  template: `<div class="auth-page"><div class="auth-card">
    <h1>Smart Task Optimizer</h1><p>Sign in to manage your tasks.</p>
    <form (ngSubmit)="submit()" #form="ngForm">
      <label>Email</label><input type="email" name="email" [(ngModel)]="email" required email autocomplete="email">
      <label>Password</label><input type="password" name="password" [(ngModel)]="password" required autocomplete="current-password">
      <div class="auth-error" *ngIf="error">{{ error }}</div>
      <button type="submit" [disabled]="form.invalid || loading">{{ loading ? 'Signing in...' : 'Sign in' }}</button>
    </form><p>Don't have an account? <a routerLink="/register">Create one</a></p>
  </div></div>`,
  styles: [`.auth-page{min-height:100vh;display:grid;place-items:center;padding:24px}.auth-card{width:min(420px,100%);padding:32px;border-radius:16px;background:#fff;box-shadow:0 10px 40px rgba(0,0,0,.08)}form{display:grid;gap:10px}input{padding:12px;border:1px solid #ddd;border-radius:8px}button{padding:12px;border:0;border-radius:8px;cursor:pointer}.auth-error{color:#b42318}`]
})
export class LoginComponent {
  email = ''; password = ''; loading = false; error = '';
  constructor(private readonly auth: AuthService, private readonly router: Router) {}
  submit(): void {
    this.loading = true; this.error = '';
    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: err => { this.error = err?.error?.detail || err?.error?.title || 'Invalid email or password.'; this.loading = false; }
    });
  }
}
