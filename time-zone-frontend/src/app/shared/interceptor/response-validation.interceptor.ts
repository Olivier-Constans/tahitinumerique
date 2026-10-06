import {HttpContext, HttpContextToken, HttpInterceptorFn, HttpResponse} from "@angular/common/http";
import {inject} from "@angular/core";
import {MessageService} from "primeng/api";
import {map} from "rxjs";
import * as z from "zod/mini";

const RESPONSE_SCHEMA = new HttpContextToken<z.ZodMiniType | null>(() => null);

// Déclare le contrat attendu pour le corps de la réponse : http.get<T>(url, {context: expecting(Schema)})
export function expecting(schema: z.ZodMiniType, context = new HttpContext()): HttpContext {
  return context.set(RESPONSE_SCHEMA, schema);
}

// Valide le corps de la réponse contre le schéma déclaré et le remplace par sa version convertie (dates, etc.).
// Une réponse non conforme est signalée ici, une seule fois, puis l'erreur Zod est propagée aux appelants.
// Doit précéder httpErrorInterceptor dans la liste, pour que ce dernier ne voie que des HttpErrorResponse.
export const responseValidationInterceptor: HttpInterceptorFn = (req, next) => {
  const schema = req.context.get(RESPONSE_SCHEMA);
  if (!schema) {
    return next(req);
  }
  const messageService = inject(MessageService);
  return next(req).pipe(
    map(event => {
      if (!(event instanceof HttpResponse)) {
        return event;
      }
      const result = schema.safeParse(event.body);
      if (!result.success) {
        console.error('Réponse non conforme au contrat', req.method, req.urlWithParams, result.error);
        messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Réponse inattendue du serveur.'
        });
        throw result.error;
      }
      return event.clone({body: result.data});
    })
  );
};
