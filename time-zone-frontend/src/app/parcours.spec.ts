import {TestBed} from '@angular/core/testing';
import {provideHttpClient, withInterceptors} from "@angular/common/http";
import {HttpTestingController, provideHttpClientTesting, RequestMatch, TestRequest} from "@angular/common/http/testing";
import {provideRouter, Router, withComponentInputBinding} from "@angular/router";
import {RouterTestingHarness} from "@angular/router/testing";
import {MessageService} from "primeng/api";
import {routes} from "./app.routes";
import {httpErrorInterceptor} from "./shared/interceptor/http-error.interceptor";
import {TimezoneEditComponent} from "./view/administration/timezone/timezone-edit/timezone-edit.component";
import {HomeComponent} from "./view/home/home.component";
import {OffsetUTC} from "./shared/model/offsetUTC.model";

// Parcours complet à travers les vraies routes, le vrai service et l'intercepteur : seul le back est simulé
describe('Parcours : création de deux fuseaux puis calcul', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let httpTesting: HttpTestingController;

  const audit = {createDate: '2026-10-06T08:00:00Z', updateDate: '2026-10-06T08:00:00Z'};
  const tahiti = {id: 1, label: 'Tahiti', offsetUTC: 'UTC-10', audit};
  const paris = {id: 2, label: 'Paris', offsetUTC: 'UTC+02', audit};

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        MessageService
      ]
    });
    router = TestBed.inject(Router);
    httpTesting = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => httpTesting.verify());

  function element(): HTMLElement {
    return harness.routeNativeElement!;
  }

  // whenStable attend la fin des requêtes HTTP en cours : on attend donc la requête avant de la résoudre
  async function expectRequest(match: string | RequestMatch): Promise<TestRequest> {
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
      const requests = httpTesting.match(match);
      if (requests.length === 1) {
        return requests[0];
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    return httpTesting.expectOne(match);
  }

  async function createTimezone(timezone: {id: number, label: string, offsetUTC: string}) {
    await harness.navigateByUrl('/admin/timezone/new');
    const input = element().querySelector<HTMLInputElement>('input#label')!;
    input.value = timezone.label;
    input.dispatchEvent(new Event('input'));
    const component = harness.routeDebugElement!.componentInstance as TimezoneEditComponent;
    component.form.controls.offsetUTC.setValue(timezone.offsetUTC as OffsetUTC);
    await harness.fixture.whenStable();
    element().querySelector<HTMLButtonElement>('button[type="submit"]')!.click();

    const post = await expectRequest({method: 'POST', url: 'api/timezones'});
    expect(post.request.body).toEqual({label: timezone.label, offsetUTC: timezone.offsetUTC});
    post.flush({...timezone, audit});

    // Redirection vers la consultation, chargée par le resolver
    (await expectRequest(`api/timezones/${timezone.id}`)).flush({...timezone, audit});
    await harness.fixture.whenStable();
    expect(router.url).toBe(`/admin/timezone/${timezone.id}`);
    expect(element().querySelector('h2')?.textContent).toBe(timezone.label);
  }

  it('crée deux fuseaux puis calcule une date dans chacun', async () => {
    await createTimezone(tahiti);
    await createTimezone(paris);

    void router.navigateByUrl('/');
    (await expectRequest({method: 'GET', url: 'api/timezones?page=0&size=10'}))
      .flush({content: [tahiti, paris], totalPages: 1, totalElements: 2, number: 0, size: 10});
    await harness.fixture.whenStable();

    const home = harness.routeDebugElement!.componentInstance as HomeComponent;
    home.form.setValue({timezone: home.timezones()[0], dateSearch: new Date(2026, 9, 6, 10, 0)});
    await harness.fixture.whenStable();
    element().querySelector<HTMLButtonElement>('button[type="submit"]')!.click();

    const calculate = await expectRequest({method: 'POST', url: 'api/timezones/calculate-date'});
    expect(calculate.request.body).toEqual({date: new Date('2026-10-06T10:00:00Z'), timezoneId: 1});
    calculate.flush({calculateDateItemList: [
      {date: '2026-10-06T20:00:00Z', timezone: tahiti},
      {date: '2026-10-07T08:00:00Z', timezone: paris}
    ]});
    await harness.fixture.whenStable();

    expect(element().textContent).toContain('Résultats');
    expect(element().textContent).toContain('Tahiti :');
    expect(element().textContent).toContain('Paris :');
  }, 15000);
});
