import { Component, inject, signal, OnInit } from '@angular/core';
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
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';
import { Task, Comment, Label } from '../../../core/api/api.models';
import { TaskService } from '../../../core/api/task.service';
import { CommentService } from '../../../core/api/comment.service';
import { LabelService } from '../../../core/api/label.service';

@Component({
  selector: 'app-task-detail-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    DatePipe,
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>Edit Task</h2>
      <button mat-icon-button (click)="onDelete()" color="warn">
        <mat-icon>delete</mat-icon>
      </button>
    </div>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="3"
          ></textarea>
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

      <!-- Labels -->
      <div class="section-header">
        <span class="section-title">Labels</span>
        <button mat-icon-button [matMenuTriggerFor]="labelMenu" matTooltip="Add label">
          <mat-icon>add</mat-icon>
        </button>
        <mat-menu #labelMenu="matMenu">
          @for (label of availableLabels(); track label.id) {
            <button mat-menu-item (click)="addLabel(label)">
              <span class="label-dot" [style.background]="label.color"></span>
              {{ label.name }}
            </button>
          }
          @if (availableLabels().length === 0) {
            <button mat-menu-item disabled>No labels available</button>
          }
        </mat-menu>
      </div>
      <div class="labels-row">
        @for (label of taskLabels(); track label.id) {
          <mat-chip-row (removed)="removeLabel(label)">
            <span class="label-dot" [style.background]="label.color"></span>
            {{ label.name }}
            <button matChipRemove>
              <mat-icon>cancel</mat-icon>
            </button>
          </mat-chip-row>
        }
        @if (taskLabels().length === 0) {
          <span class="empty-text">No labels</span>
        }
      </div>

      <mat-divider></mat-divider>

      <!-- Comments -->
      <div class="section-header">
        <span class="section-title">Comments</span>
      </div>

      <div class="comments-list">
        @for (comment of comments(); track comment.id) {
          <div class="comment">
            <div class="comment-header">
              <span class="comment-date">{{
                comment.created_at | date: 'short'
              }}</span>
              @if (editingCommentId() !== comment.id) {
                <div>
                  <button
                    mat-icon-button
                    (click)="startEditComment(comment)"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    (click)="deleteComment(comment.id)"
                    color="warn"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
            </div>
            @if (editingCommentId() === comment.id) {
              <div class="comment-edit">
                <mat-form-field appearance="outline" class="full-width">
                  <textarea
                    matInput
                    [value]="comment.content"
                    #editInput
                    rows="2"
                  ></textarea>
                </mat-form-field>
                <div class="comment-edit-actions">
                  <button mat-button (click)="cancelEditComment()">
                    Cancel
                  </button>
                  <button
                    mat-flat-button
                    color="primary"
                    (click)="saveEditComment(comment.id, editInput.value)"
                  >
                    Save
                  </button>
                </div>
              </div>
            } @else {
              <p class="comment-content">{{ comment.content }}</p>
            }
          </div>
        }
        @if (comments().length === 0) {
          <p class="empty-text">No comments yet</p>
        }
      </div>

      <div class="new-comment">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Add a comment...</mat-label>
          <textarea matInput #commentInput rows="2"></textarea>
        </mat-form-field>
        <button
          mat-flat-button
          color="primary"
          (click)="addComment(commentInput.value); commentInput.value = ''"
          [disabled]="!commentInput.value.trim()"
        >
          Comment
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        (click)="onSave()"
        [disabled]="form.invalid || form.pristine || saving()"
      >
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .full-width {
      width: 100%;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-right: 8px;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
    }
    .section-title {
      font-weight: 500;
      font-size: 14px;
      color: #555;
    }
    .labels-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
      min-height: 32px;
      align-items: center;
    }
    .label-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 6px;
    }
    mat-divider {
      margin: 12px 0;
    }
    .comments-list {
      max-height: 200px;
      overflow-y: auto;
      margin-bottom: 8px;
    }
    .comment {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .comment:last-child {
      border-bottom: none;
    }
    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .comment-header mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .comment-header button {
      width: 28px;
      height: 28px;
    }
    .comment-date {
      font-size: 12px;
      color: #999;
    }
    .comment-content {
      margin: 4px 0 0;
      font-size: 14px;
      white-space: pre-wrap;
    }
    .comment-edit-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .new-comment {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .new-comment mat-form-field {
      flex: 1;
    }
    .new-comment button {
      margin-top: 4px;
    }
    .empty-text {
      font-size: 13px;
      color: #999;
    }
  `,
})
export class TaskDetailDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private commentService = inject(CommentService);
  private labelService = inject(LabelService);
  private dialogRef = inject(MatDialogRef<TaskDetailDialogComponent>);
  private data: { task: Task; projectId: string } = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  comments = signal<Comment[]>([]);
  taskLabels = signal<Label[]>([]);
  availableLabels = signal<Label[]>([]);
  editingCommentId = signal<string | null>(null);

  form = this.fb.group({
    title: [this.data.task.title, Validators.required],
    description: [this.data.task.description],
    priority: [this.data.task.priority],
  });

  ngOnInit() {
    this.loadComments();
    this.loadLabels();
  }

  loadComments() {
    this.commentService.listByTask(this.data.task.id).subscribe({
      next: (comments) => this.comments.set(comments ?? []),
    });
  }

  loadLabels() {
    this.labelService.listByTask(this.data.task.id).subscribe({
      next: (labels) => {
        this.taskLabels.set(labels ?? []);
        this.loadAvailableLabels();
      },
    });
  }

  loadAvailableLabels() {
    this.labelService.listByProject(this.data.projectId).subscribe({
      next: (all) => {
        const assigned = new Set(this.taskLabels().map((l) => l.id));
        this.availableLabels.set(
          (all ?? []).filter((l) => !assigned.has(l.id)),
        );
      },
    });
  }

  addLabel(label: Label) {
    this.labelService
      .addToTask(this.data.task.id, label.id)
      .subscribe(() => this.loadLabels());
  }

  removeLabel(label: Label) {
    this.labelService
      .removeFromTask(this.data.task.id, label.id)
      .subscribe(() => this.loadLabels());
  }

  addComment(content: string) {
    if (!content.trim()) return;
    this.commentService
      .create(this.data.task.id, content.trim())
      .subscribe(() => this.loadComments());
  }

  startEditComment(comment: Comment) {
    this.editingCommentId.set(comment.id);
  }

  cancelEditComment() {
    this.editingCommentId.set(null);
  }

  saveEditComment(commentId: string, content: string) {
    if (!content.trim()) return;
    this.commentService.update(commentId, content.trim()).subscribe(() => {
      this.editingCommentId.set(null);
      this.loadComments();
    });
  }

  deleteComment(commentId: string) {
    this.commentService
      .delete(commentId)
      .subscribe(() => this.loadComments());
  }

  onSave() {
    if (this.form.invalid) return;
    this.saving.set(true);

    this.taskService
      .update(this.data.task.id, {
        title: this.form.value.title || undefined,
        description: this.form.value.description ?? undefined,
        priority: this.form.value.priority || undefined,
      })
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: () => this.saving.set(false),
      });
  }

  onDelete() {
    this.taskService.delete(this.data.task.id).subscribe({
      next: () => this.dialogRef.close(true),
    });
  }
}
