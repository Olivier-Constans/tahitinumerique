import { RedirectCommand, ResolveFn, Router, Routes } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, EMPTY, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { PlaceService } from '../../../shared/service/place.service';
import { PlaceResponse } from '../../../shared/model/place.model';

export const resolveFn: ResolveFn<PlaceResponse> = (route) => {
  const service = inject(PlaceService);
  const router = inject(Router);
  return service.getPlaceById(Number(route.paramMap.get('id'))).pipe(
    // Seul un 404 mène à la page introuvable ; pour les autres erreurs, déjà signalées par un toast,
    // la navigation est annulée
    catchError((error: unknown) =>
      error instanceof HttpErrorResponse && error.status === 404
        ? of(new RedirectCommand(router.parseUrl('/404')))
        : EMPTY,
    ),
  );
};

export const routes: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./place-edit/place-edit.component').then((mod) => mod.PlaceEditComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./place.component').then((mod) => mod.PlaceComponent),
    resolve: { data: resolveFn },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./place-edit/place-edit.component').then((mod) => mod.PlaceEditComponent),
    resolve: { data: resolveFn },
  },
];
