import { Routes } from '@angular/router';

export const PLACE_PATH = 'place';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./administration.component').then((mod) => mod.AdministrationComponent),
  },
  {
    path: PLACE_PATH,
    loadChildren: () => import('./place/place.routes').then((mod) => mod.routes),
  },
];
