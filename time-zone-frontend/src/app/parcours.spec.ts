import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  RequestMatch,
  TestRequest,
} from '@angular/common/http/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MessageService } from 'primeng/api';
import { routes } from './app.routes';
import { httpErrorInterceptor } from './shared/interceptor/http-error.interceptor';
import { responseValidationInterceptor } from './shared/interceptor/response-validation.interceptor';
import { PlaceEditComponent } from './view/administration/place/place-edit/place-edit.component';
import { HomeComponent } from './view/home/home.component';

// Parcours complet à travers les vraies routes, le vrai service et l'intercepteur : seul le back est simulé
describe('Parcours : création de deux lieux puis calcul', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let httpTesting: HttpTestingController;

  const audit = { createDate: '2026-10-06T08:00:00Z', updateDate: '2026-10-06T08:00:00Z' };
  const tahiti = {
    id: 1,
    type: 'ZONE_OFFSET_FIXED',
    label: 'Tahiti',
    zoneOffset: '-10:00',
    audit,
  } as const;
  const paris = { id: 2, type: 'ZONE_ID', label: 'Paris', zoneId: 'Europe/Paris', audit } as const;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(withInterceptors([responseValidationInterceptor, httpErrorInterceptor])),
        provideHttpClientTesting(),
        MessageService,
      ],
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
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return httpTesting.expectOne(match);
  }

  async function createPlace(place: typeof tahiti | typeof paris) {
    await harness.navigateByUrl('/admin/place/new');
    (await expectRequest('api/places/zone-ids')).flush(['Europe/Paris', 'Pacific/Tahiti']);
    (await expectRequest('api/places/zone-offsets')).flush(['-10:00', 'Z', '+01:00']);
    const input = element().querySelector<HTMLInputElement>('input#label')!;
    input.value = place.label;
    input.dispatchEvent(new Event('input'));
    const component = harness.routeDebugElement!.componentInstance as PlaceEditComponent;
    if (place.type === 'ZONE_ID') {
      component.form.controls.type.setValue('ZONE_ID');
      component.form.controls.zoneId.setValue(place.zoneId);
    } else {
      component.form.controls.zoneOffset.setValue(place.zoneOffset);
    }
    await harness.fixture.whenStable();
    element().querySelector<HTMLButtonElement>('button[type="submit"]')!.click();

    const post = await expectRequest({ method: 'POST', url: 'api/places' });
    expect(post.request.body).toEqual(
      place.type === 'ZONE_ID'
        ? { type: place.type, label: place.label, zoneId: place.zoneId }
        : { type: place.type, label: place.label, zoneOffset: place.zoneOffset },
    );
    post.flush(place);

    // Redirection vers la consultation, chargée par le resolver
    (await expectRequest(`api/places/${place.id}`)).flush(place);
    await harness.fixture.whenStable();
    expect(router.url).toBe(`/admin/place/${place.id}`);
    expect(element().querySelector('h2')?.textContent).toBe(place.label);
  }

  it('crée un lieu de chaque type puis calcule une date dans chacun', async () => {
    await createPlace(tahiti);
    await createPlace(paris);

    void router.navigateByUrl('/');
    (await expectRequest({ method: 'GET', url: 'api/places?page=0&size=10' })).flush({
      content: [tahiti, paris],
      totalPages: 1,
      totalElements: 2,
      number: 0,
      size: 10,
    });
    await harness.fixture.whenStable();

    const home = harness.routeDebugElement!.componentInstance as HomeComponent;
    home.form.setValue({ place: home.places()[0], dateSearch: new Date(2026, 9, 6, 10, 0) });
    await harness.fixture.whenStable();
    element().querySelector<HTMLButtonElement>('button[type="submit"]')!.click();

    const calculate = await expectRequest({ method: 'POST', url: 'api/places/calculate-date' });
    expect(calculate.request.body).toEqual({
      date: new Date('2026-10-06T10:00:00Z'),
      placeId: 1,
    });
    calculate.flush({
      calculateDateItemList: [
        { date: '2026-10-06T20:00:00Z', place: tahiti },
        { date: '2026-10-07T08:00:00Z', place: paris },
      ],
    });
    await harness.fixture.whenStable();

    expect(element().textContent).toContain('Résultats');
    expect(element().textContent).toContain('Tahiti :');
    expect(element().textContent).toContain('Paris :');
  }, 15000);
});
