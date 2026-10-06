import {RedirectCommand, ResolveFn, Router, Routes} from "@angular/router";
import {inject} from "@angular/core";
import {catchError, of} from "rxjs";
import {TimezoneService} from "../../../shared/service/timezone.service";
import {TimezoneResponse} from "../../../shared/model/timezone.model";

export const resolveFn: ResolveFn<TimezoneResponse> = (route) => {
  const service = inject(TimezoneService)
  const router = inject(Router)
  return service.getTimezoneById(Number(route.paramMap.get('id'))).pipe(
    catchError(() => of(new RedirectCommand(router.parseUrl('/404'))))
  )
}

export const routes: Routes = [
  {
    path: 'new',
    loadComponent: () => import('./timezone-edit/timezone-edit.component').then(mod => mod.TimezoneEditComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./timezone.component').then(mod => mod.TimezoneComponent),
    resolve: { data: resolveFn}
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./timezone-edit/timezone-edit.component').then(mod => mod.TimezoneEditComponent),
    resolve: { data: resolveFn}
  }
];
