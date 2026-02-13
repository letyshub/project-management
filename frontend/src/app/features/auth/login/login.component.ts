import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import { ErrorResponse } from '../../../core/auth/auth.models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-container">
      <div class="auth-card-wrapper">
        <div class="brand">
          <mat-icon class="brand-icon">dashboard</mat-icon>
          <span class="brand-name">TaskFlow</span>
        </div>
        <mat-card class="auth-card">
          <mat-card-content>
            <h2 class="auth-title">Welcome back</h2>
            <p class="auth-subtitle">Sign in to your account</p>

            @if (errorMessage()) {
              <div class="error-banner">
                <mat-icon class="error-icon">error_outline</mat-icon>
                {{ errorMessage() }}
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <mat-icon matPrefix>email</mat-icon>
                <input
                  matInput
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                />
                @if (form.controls['email'].hasError('required')) {
                  <mat-error>Email is required</mat-error>
                }
                @if (form.controls['email'].hasError('email')) {
                  <mat-error>Enter a valid email</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <mat-icon matPrefix>lock</mat-icon>
                <input
                  matInput
                  [type]="hidePassword() ? 'password' : 'text'"
                  formControlName="password"
                  autocomplete="current-password"
                />
                <button
                  mat-icon-button
                  matSuffix
                  type="button"
                  (click)="hidePassword.set(!hidePassword())"
                >
                  <mat-icon>{{
                    hidePassword() ? 'visibility_off' : 'visibility'
                  }}</mat-icon>
                </button>
                @if (form.controls['password'].hasError('required')) {
                  <mat-error>Password is required</mat-error>
                }
              </mat-form-field>

              <button
                mat-flat-button
                color="primary"
                type="submit"
                class="full-width submit-btn"
                [disabled]="loading()"
              >
                @if (loading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Sign In
                }
              </button>
            </form>

            <div class="auth-footer">
              <a routerLink="/auth/register">
                Don't have an account? <strong>Sign Up</strong>
              </a>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: `
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #e0f7fa 0%, #f8f9fb 50%, #e0f2f1 100%);
    }
    .auth-card-wrapper {
      width: 100%;
      max-width: 420px;
      padding: var(--space-lg);
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      margin-bottom: var(--space-xl);
    }
    .brand-icon {
      color: var(--color-primary);
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    .brand-name {
      font-size: var(--font-size-2xl);
      font-weight: 700;
      color: var(--color-text-primary);
      letter-spacing: -0.02em;
    }
    .auth-card {
      padding: var(--space-2xl) var(--space-xl);
    }
    .auth-title {
      margin: 0 0 var(--space-xs);
      font-size: var(--font-size-xl);
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .auth-subtitle {
      margin: 0 0 var(--space-xl);
      color: var(--color-text-secondary);
      font-size: var(--font-size-base);
    }
    .full-width {
      width: 100%;
    }
    .submit-btn {
      margin-top: var(--space-sm);
      height: 48px;
      font-size: var(--font-size-base);
      font-weight: 600;
      border-radius: var(--radius-md) !important;
    }
    .error-banner {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      background: var(--color-error-bg);
      color: var(--color-error);
      padding: var(--space-md);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-lg);
      font-size: var(--font-size-sm);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .error-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .auth-footer {
      text-align: center;
      margin-top: var(--space-xl);
      padding-top: var(--space-lg);
      border-top: 1px solid var(--color-border-light);
    }
    .auth-footer a {
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: var(--font-size-sm);
      transition: color var(--transition-fast);
    }
    .auth-footer a strong {
      color: var(--color-primary);
    }
    .auth-footer a:hover {
      color: var(--color-primary);
    }
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form: FormGroup;
  loading = signal(false);
  hidePassword = signal(true);
  errorMessage = signal('');

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.login(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/projects']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const body = err.error as ErrorResponse;
        this.errorMessage.set(
          body?.errors?.[0]?.message || 'Login failed. Please try again.',
        );
      },
    });
  }
}
