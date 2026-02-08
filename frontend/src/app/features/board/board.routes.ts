import { Routes } from '@angular/router';

export const BOARD_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./board-view/board-view.component').then(
        (m) => m.BoardViewComponent
      ),
  },
];
