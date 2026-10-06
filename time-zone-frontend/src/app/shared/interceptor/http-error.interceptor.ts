import {HttpErrorResponse, HttpInterceptorFn} from "@angular/common/http";
import {inject} from "@angular/core";
import {MessageService} from "primeng/api";
import {catchError, throwError} from "rxjs";
import {ErrorMessageResponse} from "../model/error.model";

// Affiche un toast pour toute erreur HTTP puis la propage : chaque appelant reste libre de gérer son propre état
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: errorMessage(error)
      });
      return throwError(() => error);
    })
  );
};

function errorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Le serveur est injoignable.';
  }
  const body = error.error as ErrorMessageResponse | null;
  return body?.message ?? 'Une erreur inattendue s\'est produite.';
}
