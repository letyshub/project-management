import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Project } from '../../../core/api/api.models';
import { ProjectService } from '../../../core/api/project.service';
import { AuthService } from '../../../core/auth/auth.service';
import { CreateProjectDialogComponent } from '../create-project-dialog/create-project-dialog.component';

@Component({
  selector: 'app-project-list',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatToolbarModule,
    MatMenuModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <mat-toolbar>
      <div class="toolbar-brand">
        <mat-icon class="toolbar-logo">dashboard</mat-icon>
        <span class="toolbar-title">TaskFlow</span>
      </div>
      <span class="spacer"></span>
      <button mat-icon-button [matMenuTriggerFor]="userMenu">
        <mat-icon>account_circle</mat-icon>
      </button>
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item (click)="openProfile()">
          <mat-icon>person</mat-icon>
          <span>Profile</span>
        </button>
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          <span>Logout</span>
        </button>
      </mat-menu>
    </mat-toolbar>

    <div class="content">
      @if (loading()) {
        <div class="center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="header">
          <div>
            <h2 class="page-title">My Projects</h2>
            <p class="page-subtitle">Manage and organize your work</p>
          </div>
          <button mat-flat-button color="primary" class="create-btn" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon> New Project
          </button>
        </div>

        @if (projects().length === 0) {
          <div class="empty">
            <div class="empty-icon-wrapper">
              <mat-icon class="empty-icon">folder_open</mat-icon>
            </div>
            <h3 class="empty-title">No projects yet</h3>
            <p class="empty-text">Create your first project to get started.</p>
            <button mat-flat-button color="primary" (click)="openCreateDialog()">
              <mat-icon>add</mat-icon> Create Project
            </button>
          </div>
        } @else {
          <div class="grid">
            @for (project of projects(); track project.id) {
              <mat-card
                class="project-card"
                (click)="openProject(project)"
                tabindex="0"
              >
                <div class="card-accent"></div>
                <mat-card-header>
                  <mat-card-title class="card-title">{{ project.name }}</mat-card-title>
                  <span class="spacer"></span>
                  <button
                    mat-icon-button
                    [matMenuTriggerFor]="projectMenu"
                    (click)="$event.stopPropagation()"
                    class="card-menu-btn"
                  >
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #projectMenu="matMenu">
                    <button
                      mat-menu-item
                      (click)="deleteProject(project.id)"
                    >
                      <mat-icon>delete</mat-icon>
                      <span>Delete</span>
                    </button>
                  </mat-menu>
                </mat-card-header>
                <mat-card-content>
                  <p class="description">
                    {{ project.description || 'No description' }}
                  </p>
                </mat-card-content>
                <div class="card-footer">
                  <mat-icon class="footer-icon">chevron_right</mat-icon>
                </div>
              </mat-card>
            }
          </div>
        }
      }
    </div>
  `,
  styles: `
    .spacer {
      flex: 1;
    }
    .toolbar-brand {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }
    .toolbar-logo {
      color: var(--color-primary);
    }
    .toolbar-title {
      font-weight: 600;
      font-size: var(--font-size-lg);
      letter-spacing: -0.01em;
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
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-xl);
    }
    .page-title {
      margin: 0;
      font-size: var(--font-size-2xl);
      font-weight: 700;
      color: var(--color-text-primary);
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      margin: var(--space-xs) 0 0;
      color: var(--color-text-secondary);
      font-size: var(--font-size-base);
    }
    .create-btn {
      border-radius: var(--radius-md) !important;
      font-weight: 500;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--space-lg);
    }
    .project-card {
      cursor: pointer;
      transition: box-shadow var(--transition-base), transform var(--transition-base);
      overflow: hidden;
      position: relative;
    }
    .project-card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }
    .card-accent {
      height: 3px;
      background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
    }
    .project-card mat-card-header {
      display: flex;
      align-items: center;
    }
    .card-title {
      font-weight: 600;
      font-size: var(--font-size-lg);
    }
    .card-menu-btn {
      opacity: 0;
      transition: opacity var(--transition-fast);
    }
    .project-card:hover .card-menu-btn {
      opacity: 1;
    }
    .description {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .card-footer {
      display: flex;
      justify-content: flex-end;
      padding: 0 var(--space-lg) var(--space-md);
    }
    .footer-icon {
      color: var(--color-text-tertiary);
      transition: color var(--transition-fast), transform var(--transition-fast);
    }
    .project-card:hover .footer-icon {
      color: var(--color-primary);
      transform: translateX(2px);
    }
    .empty {
      text-align: center;
      padding: var(--space-3xl) var(--space-xl);
    }
    .empty-icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--color-surface-variant);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--space-lg);
    }
    .empty-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--color-text-tertiary);
    }
    .empty-title {
      margin: 0 0 var(--space-sm);
      font-size: var(--font-size-xl);
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .empty-text {
      margin: 0 0 var(--space-xl);
      color: var(--color-text-secondary);
    }
  `,
})
export class ProjectListComponent implements OnInit {
  private projectService = inject(ProjectService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  projects = signal<Project[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loading.set(true);
    this.projectService.list().subscribe({
      next: (projects) => {
        this.projects.set(projects ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreateDialog() {
    const ref = this.dialog.open(CreateProjectDialogComponent, {
      width: '400px',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadProjects();
    });
  }

  openProject(project: Project) {
    this.router.navigate(['/projects', project.id]);
  }

  deleteProject(id: string) {
    this.projectService.delete(id).subscribe(() => this.loadProjects());
  }

  openProfile() {
    this.router.navigate(['/profile']);
  }

  logout() {
    this.auth.logout();
  }
}
