import { Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ProjectService } from '../../../core/api/project.service';

@Component({
  selector: 'app-create-project-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>New Project</h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project Name</mat-label>
          <input matInput formControlName="name" cdkFocusInitial />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
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
  `,
})
export class CreateProjectDialogComponent {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private dialogRef = inject(MatDialogRef<CreateProjectDialogComponent>);

  saving = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.saving.set(true);

    this.projectService
      .create({
        name: this.form.value.name!,
        description: this.form.value.description || '',
      })
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: () => this.saving.set(false),
      });
  }
}
