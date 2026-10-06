import {TestBed} from '@angular/core/testing';
import {HttpClient, provideHttpClient, withInterceptors} from "@angular/common/http";
import {HttpTestingController, provideHttpClientTesting} from "@angular/common/http/testing";
import {MessageService} from "primeng/api";
import {firstValueFrom} from "rxjs";
import * as z from "zod/mini";
import {$ZodError} from "zod/v4/core";
import {expecting, responseValidationInterceptor} from "./response-validation.interceptor";
import {httpErrorInterceptor} from "./http-error.interceptor";

describe('responseValidationInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let messageService: MessageService;
  let consoleError: ReturnType<typeof vi.spyOn>;

  // Le schéma convertit la chaîne reçue, pour vérifier que l'appelant obtient bien la sortie du schéma
  const Schema = z.object({value: z.pipe(z.string(), z.transform(value => value.length))});

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([responseValidationInterceptor, httpErrorInterceptor])),
        provideHttpClientTesting(),
        MessageService
      ]
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    messageService = TestBed.inject(MessageService);
    vi.spyOn(messageService, 'add');
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    httpTesting.verify();
    consoleError.mockRestore();
  });

  it('remplace le corps par la sortie du schéma pour une réponse conforme', async () => {
    const result = firstValueFrom(http.get('api/test', {context: expecting(Schema)}));
    httpTesting.expectOne('api/test').flush({value: 'abc'});

    expect(await result).toEqual({value: 3});
    expect(messageService.add).not.toHaveBeenCalled();
  });

  it('signale une réponse non conforme une seule fois puis propage l\'erreur Zod', async () => {
    const result = firstValueFrom(http.get('api/test', {context: expecting(Schema)}));
    httpTesting.expectOne('api/test').flush({value: 42});

    await expect(result).rejects.toBeInstanceOf($ZodError);
    expect(consoleError).toHaveBeenCalledWith('Réponse non conforme au contrat', 'GET', 'api/test', expect.any($ZodError));
    expect(messageService.add).toHaveBeenCalledTimes(1);
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Réponse inattendue du serveur.'
    });
  });

  it('laisse passer la réponse telle quelle sans schéma déclaré', async () => {
    const result = firstValueFrom(http.get('api/test'));
    httpTesting.expectOne('api/test').flush({value: 42});

    expect(await result).toEqual({value: 42});
  });

  it('ne valide pas une réponse en erreur, laissée à httpErrorInterceptor', async () => {
    const result = firstValueFrom(http.get('api/test', {context: expecting(Schema)}));
    httpTesting.expectOne('api/test').flush(null, {status: 500, statusText: 'Server Error'});

    await expect(result).rejects.toMatchObject({status: 500});
    expect(consoleError).not.toHaveBeenCalled();
    expect(messageService.add).toHaveBeenCalledTimes(1);
  });
});
