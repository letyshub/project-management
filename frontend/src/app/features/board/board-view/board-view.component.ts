import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { Board, Column, Task, Label } from '../../../core/api/api.models';
import { BoardService } from '../../../core/api/board.service';
import { TaskService, TaskFilter } from '../../../core/api/task.service';
import { LabelService } from '../../../core/api/label.service';
import { TaskDetailDialogComponent } from '../task-detail-dialog/task-detail-dialog.component';
import { CreateTaskDialogComponent } from '../create-task-dialog/create-task-dialog.component';

@Component({
  selector: 'app-board-view',
  imports: [
    FormsModule,
    CdkDrag,
    CdkDropList,
    CdkDropListGroup,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDialogModule,
    MatMenuModule,
  ],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <span>{{ board()?.name }}</span>
      <span class="spacer"></span>
      <button mat-icon-button [matMenuTriggerFor]="labelsMenu" matTooltip="Manage labels">
        <mat-icon>label</mat-icon>
      </button>
      <mat-menu #labelsMenu="matMenu" class="labels-menu">
        <div class="labels-menu-content" (click)="$event.stopPropagation()" (keydown.space)="$event.stopPropagation()" tabindex="-1" role="group">
          <div class="labels-menu-header">Project Labels</div>
          @for (label of projectLabels(); track label.id) {
            <div class="label-row">
              <span class="label-dot" [style.background]="label.color"></span>
              <span class="label-name">{{ label.name }}</span>
              <button mat-icon-button (click)="deleteLabel(label.id)">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
          <div class="label-create-row">
            <input
              matInput
              placeholder="Label name"
              #labelNameInput
              class="label-input"
            />
            <input
              type="color"
              value="#6b7280"
              #labelColorInput
              class="label-color"
            />
            <button
              mat-icon-button
              (click)="
                createLabel(labelNameInput.value, labelColorInput.value);
                labelNameInput.value = ''
              "
            >
              <mat-icon>add</mat-icon>
            </button>
          </div>
        </div>
      </mat-menu>
      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Priority</mat-label>
        <mat-select
          [(ngModel)]="priorityFilter"
          (selectionChange)="applyFilter()"
        >
          <mat-option value="">All</mat-option>
          <mat-option value="high">High</mat-option>
          <mat-option value="medium">Medium</mat-option>
          <mat-option value="low">Low</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-toolbar>

    <div class="board-container">
      @if (loading()) {
        <div class="center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="columns-row" cdkDropListGroup>
          @for (column of columns(); track column.id) {
            <div class="column">
              <div class="column-header">
                <h3>{{ column.name }}</h3>
                <span class="task-count">{{
                  tasksByColumn()[column.id]?.length || 0
                }}</span>
              </div>
              <div
                class="column-body"
                cdkDropList
                [cdkDropListData]="column.id"
                (cdkDropListDropped)="onDrop($event)"
              >
                @for (
                  task of tasksByColumn()[column.id] || [];
                  track task.id
                ) {
                  <div class="task-card" cdkDrag tabindex="0" role="button" (click)="openTask(task)" (keydown.enter)="openTask(task)">
                    <div class="task-title">{{ task.title }}</div>
                    <div class="task-meta">
                      <span
                        class="priority-badge"
                        [class]="'priority-' + task.priority"
                      >
                        {{ task.priority }}
                      </span>
                    </div>
                  </div>
                }
              </div>
              <button
                mat-button
                class="add-task-btn"
                (click)="openCreateTask(column)"
              >
                <mat-icon>add</mat-icon> Add task
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .spacer {
      flex: 1;
    }
    .filter-field {
      width: 140px;
      margin: 0 8px;
    }
    .filter-field .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
    .board-container {
      padding: 16px;
      overflow-x: auto;
      height: calc(100vh - 64px);
    }
    .center {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
    .columns-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      min-height: 200px;
    }
    .column {
      min-width: 280px;
      max-width: 320px;
      background: #f5f5f5;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
    }
    .column-header {
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .column-header h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      color: #555;
    }
    .task-count {
      background: #e0e0e0;
      border-radius: 10px;
      padding: 2px 8px;
      font-size: 12px;
      color: #666;
    }
    .column-body {
      padding: 8px;
      min-height: 60px;
    }
    .task-card {
      background: white;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 8px;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition:
        box-shadow 0.2s,
        transform 0.2s;
    }
    .task-card:hover {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }
    .task-title {
      font-size: 14px;
      margin-bottom: 8px;
    }
    .task-meta {
      display: flex;
      gap: 6px;
    }
    .priority-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 500;
      text-transform: capitalize;
    }
    .priority-high {
      background: #fdecea;
      color: #c62828;
    }
    .priority-medium {
      background: #fff3e0;
      color: #e65100;
    }
    .priority-low {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .add-task-btn {
      margin: 4px 8px 8px;
      color: #888;
    }
    .cdk-drag-preview {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      border-radius: 6px;
      background: white;
      padding: 12px;
    }
    .cdk-drag-placeholder {
      opacity: 0.3;
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .labels-menu-content {
      padding: 8px 12px;
      min-width: 220px;
    }
    .labels-menu-header {
      font-weight: 500;
      font-size: 13px;
      color: #555;
      margin-bottom: 8px;
    }
    .label-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 2px 0;
    }
    .label-row .label-name {
      flex: 1;
      font-size: 13px;
    }
    .label-row button {
      width: 24px;
      height: 24px;
    }
    .label-row mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    .label-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .label-create-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      border-top: 1px solid #eee;
      padding-top: 8px;
    }
    .label-input {
      flex: 1;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 13px;
      outline: none;
    }
    .label-color {
      width: 28px;
      height: 28px;
      border: none;
      padding: 0;
      cursor: pointer;
      border-radius: 4px;
    }
  `,
})
export class BoardViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private boardService = inject(BoardService);
  private taskService = inject(TaskService);
  private labelService = inject(LabelService);
  private dialog = inject(MatDialog);

  board = signal<Board | null>(null);
  columns = signal<Column[]>([]);
  tasks = signal<Task[]>([]);
  projectLabels = signal<Label[]>([]);
  loading = signal(true);
  priorityFilter = '';

  tasksByColumn = computed(() => {
    const map: Record<string, Task[]> = {};
    for (const col of this.columns()) {
      map[col.id] = [];
    }
    for (const task of this.tasks()) {
      if (map[task.column_id]) {
        map[task.column_id].push(task);
      }
    }
    return map;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.boardService.get(id).subscribe({
      next: (board) => {
        this.board.set(board);
        this.loadBoardData(id);
        this.loadProjectLabels();
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/projects']);
      },
    });
  }

  loadBoardData(boardId?: string) {
    const id = boardId || this.board()?.id;
    if (!id) return;

    this.boardService.listColumns(id).subscribe({
      next: (columns) => {
        this.columns.set(columns ?? []);
        this.loadTasks(id);
      },
      error: () => this.loading.set(false),
    });
  }

  loadTasks(boardId?: string) {
    const id = boardId || this.board()?.id;
    if (!id) return;

    const filter: TaskFilter = {};
    if (this.priorityFilter) filter.priority = this.priorityFilter;

    this.taskService.listByBoard(id, filter).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilter() {
    this.loadTasks();
  }

  onDrop(event: CdkDragDrop<string>) {
    const taskId =
      this.tasksByColumn()[event.previousContainer.data]?.[
        event.previousIndex
      ]?.id;
    if (!taskId) return;

    const targetColumnId = event.container.data;
    const targetTasks = this.tasksByColumn()[targetColumnId] || [];

    let newPosition: number;
    if (targetTasks.length === 0) {
      newPosition = 1000;
    } else if (event.currentIndex === 0) {
      newPosition = targetTasks[0].position / 2;
    } else if (event.currentIndex >= targetTasks.length) {
      newPosition = targetTasks[targetTasks.length - 1].position + 1000;
    } else {
      const before = targetTasks[event.currentIndex - 1].position;
      const after = targetTasks[event.currentIndex].position;
      newPosition = (before + after) / 2;
    }

    this.taskService
      .move(taskId, { column_id: targetColumnId, position: newPosition })
      .subscribe(() => this.loadTasks());
  }

  openTask(task: Task) {
    const ref = this.dialog.open(TaskDetailDialogComponent, {
      width: '560px',
      data: { task, projectId: this.board()?.project_id },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadTasks();
    });
  }

  openCreateTask(column: Column) {
    const ref = this.dialog.open(CreateTaskDialogComponent, {
      width: '400px',
      data: { columnId: column.id },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadTasks();
    });
  }

  loadProjectLabels() {
    const projectId = this.board()?.project_id;
    if (!projectId) return;
    this.labelService.listByProject(projectId).subscribe({
      next: (labels) => this.projectLabels.set(labels ?? []),
    });
  }

  createLabel(name: string, color: string) {
    if (!name.trim()) return;
    const projectId = this.board()?.project_id;
    if (!projectId) return;
    this.labelService
      .create(projectId, { name: name.trim(), color })
      .subscribe(() => this.loadProjectLabels());
  }

  deleteLabel(labelId: string) {
    this.labelService.delete(labelId).subscribe(() => this.loadProjectLabels());
  }

  goBack() {
    const board = this.board();
    if (board) {
      this.router.navigate(['/projects', board.project_id]);
    } else {
      this.router.navigate(['/projects']);
    }
  }
}
