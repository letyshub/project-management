import { Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TaskService } from '../../../core/api/task.service';

@Component({
  selector: 'app-create-task-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">New Task</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" cdkFocusInitial />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Priority</mat-label>
          <mat-select formControlName="priority">
            <mat-option value="low">Low</mat-option>
            <mat-option value="medium">Medium</mat-option>
            <mat-option value="high">High</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        (click)="onSubmit()"
        [disabled]="form.invalid || saving()"
      >
        Create
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .full-width {
      width: 100%;
    }
    .dialog-title {
      font-weight: 600;
    }
  `,
})
export class CreateTaskDialogComponent {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private dialogRef = inject(MatDialogRef<CreateTaskDialogComponent>);
  private data: { columnId: string } = inject(MAT_DIALOG_DATA);

  saving = signal(false);

  form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    priority: ['medium'],
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.saving.set(true);

    this.taskService
      .create(this.data.columnId, {
        title: this.form.value.title!,
        description: this.form.value.description || '',
        priority: this.form.value.priority || 'medium',
      })
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: () => this.saving.set(false),
      });
  }
}
