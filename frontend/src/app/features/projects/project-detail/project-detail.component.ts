import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Project, Board } from '../../../core/api/api.models';
import { ProjectService } from '../../../core/api/project.service';
import { BoardService } from '../../../core/api/board.service';

@Component({
  selector: 'app-project-detail',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <mat-toolbar>
      <button mat-icon-button (click)="goBack()" class="back-btn">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <span class="toolbar-title">{{ project()?.name }}</span>
    </mat-toolbar>

    <div class="content">
      @if (loading()) {
        <div class="center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="section-header">
          <h3 class="section-title">Boards</h3>
        </div>

        @if (boards().length === 0) {
          <div class="empty">
            <mat-icon class="empty-icon">view_kanban</mat-icon>
            <p class="muted">No boards found.</p>
          </div>
        } @else {
          <div class="grid">
            @for (board of boards(); track board.id) {
              <mat-card
                class="board-card"
                (click)="openBoard(board)"
                tabindex="0"
              >
                <div class="card-accent"></div>
                <mat-card-header>
                  <mat-icon class="board-icon" mat-card-avatar>view_kanban</mat-icon>
                  <mat-card-title class="board-name">{{ board.name }}</mat-card-title>
                </mat-card-header>
              </mat-card>
            }
          </div>
        }
      }
    </div>
  `,
  styles: `
    .back-btn {
      margin-right: var(--space-sm);
    }
    .toolbar-title {
      font-weight: 600;
      font-size: var(--font-size-lg);
    }
    .content {
      max-width: 1080px;
      margin: var(--space-2xl) auto;
      padding: 0 var(--space-xl);
    }
    .center {
      display: flex;
      justify-content: center;
      padding: var(--space-3xl);
    }
    .section-header {
      margin-bottom: var(--space-lg);
    }
    .section-title {
      margin: 0;
      font-size: var(--font-size-xl);
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: var(--space-lg);
    }
    .board-card {
      cursor: pointer;
      transition: box-shadow var(--transition-base), transform var(--transition-base);
      overflow: hidden;
    }
    .board-card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }
    .card-accent {
      height: 3px;
      background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
    }
    .board-icon {
      color: var(--color-primary);
      background: rgba(0, 151, 167, 0.08);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .board-name {
      font-weight: 600;
    }
    .empty {
      text-align: center;
      padding: var(--space-3xl);
    }
    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--color-text-tertiary);
    }
    .muted {
      color: var(--color-text-secondary);
      margin-top: var(--space-sm);
    }
  `,
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private boardService = inject(BoardService);

  project = signal<Project | null>(null);
  boards = signal<Board[]>([]);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('projectID')!;
    this.projectService.get(id).subscribe({
      next: (project) => {
        this.project.set(project);
        this.boardService.listByProject(id).subscribe({
          next: (boards) => {
            this.boards.set(boards ?? []);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/projects']);
      },
    });
  }

  openBoard(board: Board) {
    this.router.navigate(['/boards', board.id]);
  }

  goBack() {
    this.router.navigate(['/projects']);
  }
}
