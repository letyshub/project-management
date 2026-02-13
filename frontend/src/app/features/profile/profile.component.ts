import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { ApiResponse } from '../../core/api/api.models';
import { User } from '../../core/auth/auth.models';

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    DatePipe,
  ],
  template: `
    <div class="profile-container">
      <button mat-icon-button class="back-btn" (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <mat-card class="profile-card">
        <mat-card-header>
          <div class="avatar" mat-card-avatar>
            <mat-icon>person</mat-icon>
          </div>
          <mat-card-title>{{ user()?.name || user()?.email }}</mat-card-title>
          <mat-card-subtitle>{{ user()?.email }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="info-row">
            <span class="label">Role</span>
            <span class="value">{{ user()?.role }}</span>
          </div>
          <div class="info-row">
            <span class="label">Member since</span>
            <span class="value">{{ user()?.created_at | date: 'mediumDate' }}</span>
          </div>

          <form [formGroup]="form" class="edit-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Display Name</mat-label>
              <input matInput formControlName="name" />
            </mat-form-field>
          </form>
        </mat-card-content>
        <mat-card-actions align="end">
          <button
            mat-flat-button
            color="primary"
            (click)="onSave()"
            [disabled]="form.invalid || form.pristine || saving()"
          >
            Update Profile
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: `
    .profile-container {
      max-width: 520px;
      margin: var(--space-2xl) auto;
      padding: 0 var(--space-xl);
    }
    .back-btn {
      margin-bottom: var(--space-sm);
    }
    .profile-card {
      padding: var(--space-xl);
    }
    .avatar {
      background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      width: 48px;
      height: 48px;
    }
    .avatar mat-icon {
      color: var(--color-text-inverse);
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: var(--space-md) 0;
      border-bottom: 1px solid var(--color-border-light);
    }
    .label {
      font-weight: 500;
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
    }
    .value {
      color: var(--color-text-primary);
      font-size: var(--font-size-sm);
      font-weight: 500;
    }
    .edit-form {
      margin-top: var(--space-xl);
    }
    .full-width {
      width: 100%;
    }
  `,
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  user = signal<User | null>(null);
  saving = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
  });

  ngOnInit() {
    this.http.get<ApiResponse<User>>('/api/v1/me').subscribe({
      next: (res) => {
        this.user.set(res.data);
        this.form.patchValue({ name: res.data.name });
        this.form.markAsPristine();
      },
    });
  }

  onSave() {
    if (this.form.invalid) return;
    this.saving.set(true);

    this.http
      .patch<ApiResponse<User>>('/api/v1/me', { name: this.form.value.name })
      .subscribe({
        next: (res) => {
          this.user.set(res.data);
          this.form.markAsPristine();
          this.saving.set(false);
          this.snackBar.open('Profile updated', 'OK', { duration: 2000 });
        },
        error: () => this.saving.set(false),
      });
  }

  goBack() {
    this.router.navigate(['/projects']);
  }
}
