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
    <mat-toolbar color="primary">
      <span>Projects</span>
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
          <h2>My Projects</h2>
          <button mat-flat-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon> New Project
          </button>
        </div>

        @if (projects().length === 0) {
          <div class="empty">
            <mat-icon class="empty-icon">folder_open</mat-icon>
            <p>No projects yet. Create your first project to get started.</p>
          </div>
        } @else {
          <div class="grid">
            @for (project of projects(); track project.id) {
              <mat-card
                class="project-card"
                (click)="openProject(project)"
                tabindex="0"
              >
                <mat-card-header>
                  <mat-card-title>{{ project.name }}</mat-card-title>
                  <span class="spacer"></span>
                  <button
                    mat-icon-button
                    [matMenuTriggerFor]="projectMenu"
                    (click)="$event.stopPropagation()"
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
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .project-card {
      cursor: pointer;
      transition: box-shadow 0.2s;
    }
    .project-card:hover {
      box-shadow:
        0 4px 8px rgba(0, 0, 0, 0.12),
        0 2px 4px rgba(0, 0, 0, 0.08);
    }
    .project-card mat-card-header {
      display: flex;
      align-items: center;
    }
    .description {
      color: #666;
      font-size: 14px;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .empty {
      text-align: center;
      padding: 48px;
      color: #999;
    }
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
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
