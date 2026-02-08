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
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <span>{{ project()?.name }}</span>
    </mat-toolbar>

    <div class="content">
      @if (loading()) {
        <div class="center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <h3>Boards</h3>

        @if (boards().length === 0) {
          <p class="muted">No boards found.</p>
        } @else {
          <div class="grid">
            @for (board of boards(); track board.id) {
              <mat-card
                class="board-card"
                (click)="openBoard(board)"
                tabindex="0"
              >
                <mat-card-header>
                  <mat-card-title>{{ board.name }}</mat-card-title>
                </mat-card-header>
              </mat-card>
            }
          </div>
        }
      }
    </div>
  `,
  styles: `
    .content {
      max-width: 960px;
      margin: 24px auto;
      padding: 0 16px;
    }
    .center {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
    }
    .board-card {
      cursor: pointer;
      transition: box-shadow 0.2s;
    }
    .board-card:hover {
      box-shadow:
        0 4px 8px rgba(0, 0, 0, 0.12),
        0 2px 4px rgba(0, 0, 0, 0.08);
    }
    .muted {
      color: #999;
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
