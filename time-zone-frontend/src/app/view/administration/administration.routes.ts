import { Routes } from '@angular/router';

export const TIMEZONE_PATH = 'timezone';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./administration.component').then((mod) => mod.AdministrationComponent),
  },
  {
    path: TIMEZONE_PATH,
    loadChildren: () => import('./timezone/timezone.routes').then((mod) => mod.routes),
  },
];
