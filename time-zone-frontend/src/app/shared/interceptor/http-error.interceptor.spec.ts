import {TestBed} from '@angular/core/testing';
import {HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors} from "@angular/common/http";
import {HttpTestingController, provideHttpClientTesting} from "@angular/common/http/testing";
import {MessageService} from "primeng/api";
import {firstValueFrom} from "rxjs";
import {httpErrorInterceptor} from "./http-error.interceptor";

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let messageService: MessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        MessageService
      ]
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    messageService = TestBed.inject(MessageService);
    vi.spyOn(messageService, 'add');
  });

  afterEach(() => httpTesting.verify());

  async function requestFailingWith(flush: (req: ReturnType<HttpTestingController['expectOne']>) => void) {
    const result = firstValueFrom(http.get('api/test'));
    flush(httpTesting.expectOne('api/test'));
    return result.then(
      () => { throw new Error('La requête aurait dû échouer'); },
      (error: HttpErrorResponse) => error
    );
  }

  it('affiche le message renvoyé par le serveur et propage l\'erreur', async () => {
    const error = await requestFailingWith(req =>
      req.flush({message: 'Timezone introuvable'}, {status: 404, statusText: 'Not Found'}));

    expect(error.status).toBe(404);
    expect(messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Timezone introuvable'
    });
  });

  it('affiche un message générique quand le serveur ne renvoie pas de message', async () => {
    await requestFailingWith(req => req.flush(null, {status: 500, statusText: 'Server Error'}));

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({detail: 'Une erreur inattendue s\'est produite.'}));
  });

  it('signale un serveur injoignable en cas d\'erreur réseau', async () => {
    await requestFailingWith(req => req.error(new ProgressEvent('error')));

    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({detail: 'Le serveur est injoignable.'}));
  });

  it('n\'affiche rien quand la requête réussit', async () => {
    const result = firstValueFrom(http.get('api/test'));
    httpTesting.expectOne('api/test').flush({});
    await result;

    expect(messageService.add).not.toHaveBeenCalled();
  });
});
