import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { Board, Column, Task, Label } from '../../../core/api/api.models';
import { BoardService } from '../../../core/api/board.service';
import { TaskService, TaskFilter } from '../../../core/api/task.service';
import { LabelService } from '../../../core/api/label.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme.service';
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
    MatTooltipModule,
  ],
  template: `
    <mat-toolbar>
      <button mat-icon-button (click)="goBack()" class="back-btn">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <span class="board-title">{{ board()?.name }}</span>
      <span class="spacer"></span>
      <button mat-icon-button (click)="exportCsv()" matTooltip="Export to CSV">
        <mat-icon>download</mat-icon>
      </button>
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
      <button mat-icon-button (click)="theme.toggle()" [matTooltip]="theme.isDark() ? 'Light mode' : 'Dark mode'">
        <mat-icon>{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>
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
                      @if (task.assignee_id) {
                        <span class="assignee-avatar" [matTooltip]="task.assignee_id === currentUserId() ? 'Assigned to you' : 'Assigned'">
                          {{ getInitial(task.assignee_id) }}
                        </span>
                      }
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
    .back-btn {
      margin-right: var(--space-sm);
    }
    .board-title {
      font-weight: 600;
      font-size: var(--font-size-lg);
    }
    .filter-field {
      width: 140px;
      margin: 0 var(--space-sm);
    }
    .filter-field .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
    .board-container {
      padding: var(--space-xl);
      overflow-x: auto;
      height: calc(100vh - 64px);
      background: var(--color-bg);
    }
    .center {
      display: flex;
      justify-content: center;
      padding: var(--space-3xl);
    }
    .columns-row {
      display: flex;
      gap: var(--space-lg);
      align-items: flex-start;
      min-height: 200px;
    }
    .column {
      min-width: 290px;
      max-width: 330px;
      background: var(--color-surface-variant);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      border: 1px solid var(--color-border-light);
    }
    .column-header {
      padding: var(--space-md) var(--space-lg);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .column-header h3 {
      margin: 0;
      font-size: var(--font-size-xs);
      font-weight: 700;
      text-transform: uppercase;
      color: var(--color-text-secondary);
      letter-spacing: 0.05em;
    }
    .task-count {
      background: var(--color-border);
      border-radius: var(--radius-full);
      padding: 2px 8px;
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      font-weight: 600;
    }
    .column-body {
      padding: var(--space-sm);
      min-height: 60px;
    }
    .task-card {
      background: var(--color-surface);
      border-radius: var(--radius-md);
      padding: var(--space-md);
      margin-bottom: var(--space-sm);
      cursor: pointer;
      box-shadow: var(--shadow-xs);
      border: 1px solid var(--color-border-light);
      transition: box-shadow var(--transition-base), transform var(--transition-base), border-color var(--transition-base);
    }
    .task-card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--color-border);
      transform: translateY(-1px);
    }
    .task-title {
      font-size: var(--font-size-sm);
      font-weight: 500;
      margin-bottom: var(--space-sm);
      color: var(--color-text-primary);
    }
    .task-meta {
      display: flex;
      gap: var(--space-xs);
      align-items: center;
    }
    .priority-badge {
      font-size: var(--font-size-xs);
      padding: 2px 10px;
      border-radius: var(--radius-full);
      font-weight: 600;
      text-transform: capitalize;
    }
    .priority-high {
      background: var(--color-priority-high-bg);
      color: var(--color-priority-high);
    }
    .priority-medium {
      background: var(--color-priority-medium-bg);
      color: var(--color-priority-medium);
    }
    .priority-low {
      background: var(--color-priority-low-bg);
      color: var(--color-priority-low);
    }
    .assignee-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--color-primary);
      color: var(--color-text-inverse);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-xs);
      font-weight: 700;
      text-transform: uppercase;
      margin-left: auto;
    }
    .add-task-btn {
      margin: var(--space-xs) var(--space-sm) var(--space-sm);
      color: var(--color-text-tertiary);
      border-radius: var(--radius-md);
      transition: color var(--transition-fast), background var(--transition-fast);
    }
    .add-task-btn:hover {
      color: var(--color-primary);
      background: rgba(0, 151, 167, 0.06);
    }
    .cdk-drag-preview {
      box-shadow: var(--shadow-xl);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      padding: var(--space-md);
    }
    .cdk-drag-placeholder {
      opacity: 0.3;
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .labels-menu-content {
      padding: var(--space-sm) var(--space-md);
      min-width: 240px;
    }
    .labels-menu-header {
      font-weight: 600;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-sm);
    }
    .label-row {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: 2px 0;
    }
    .label-row .label-name {
      flex: 1;
      font-size: var(--font-size-sm);
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
      gap: var(--space-xs);
      margin-top: var(--space-sm);
      border-top: 1px solid var(--color-border-light);
      padding-top: var(--space-sm);
    }
    .label-input {
      flex: 1;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: var(--space-xs) var(--space-sm);
      font-size: var(--font-size-sm);
      outline: none;
      font-family: var(--font-family);
      transition: border-color var(--transition-fast);
      background: var(--color-surface);
      color: var(--color-text-primary);
    }
    .label-input:focus {
      border-color: var(--color-primary);
    }
    .label-color {
      width: 28px;
      height: 28px;
      border: none;
      padding: 0;
      cursor: pointer;
      border-radius: var(--radius-sm);
    }
  `,
})
export class BoardViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private boardService = inject(BoardService);
  private taskService = inject(TaskService);
  private labelService = inject(LabelService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  theme = inject(ThemeService);

  board = signal<Board | null>(null);
  columns = signal<Column[]>([]);
  tasks = signal<Task[]>([]);
  projectLabels = signal<Label[]>([]);
  loading = signal(true);
  priorityFilter = '';

  currentUserId = computed(() => this.authService.user()?.id ?? '');

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

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const cols = this.columns();
      if (cols.length > 0) {
        this.openCreateTask(cols[0]);
      }
    }
  }

  getInitial(assigneeId: string): string {
    if (assigneeId === this.currentUserId()) {
      const email = this.authService.user()?.email;
      return email ? email[0] : '?';
    }
    return '?';
  }

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

  exportCsv() {
    const id = this.board()?.id;
    if (!id) return;
    this.taskService.exportCsv(id);
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
