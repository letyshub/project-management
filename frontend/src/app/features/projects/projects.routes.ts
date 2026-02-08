import { Routes } from '@angular/router';

export const PROJECTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./project-list/project-list.component').then(
        (m) => m.ProjectListComponent,
      ),
  },
  {
    path: ':projectID',
    loadComponent: () =>
      import('./project-detail/project-detail.component').then(
        (m) => m.ProjectDetailComponent,
      ),
  },
];
