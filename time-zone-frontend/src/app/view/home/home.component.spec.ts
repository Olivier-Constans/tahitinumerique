import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { HomeComponent } from './home.component';
import { PlaceService } from '../../shared/service/place.service';
import { aPage, aPlace, aZoneIdPlace } from '../../../testing/place.fixture';
import { CalculateDateResponse } from '../../shared/model/calculateDate.model';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  const tahiti = aPlace({ id: 1, label: 'tahiti' });
  const paris = aZoneIdPlace({ id: 2, label: 'paris' });
  const placeService = {
    getAllPlaces: vi.fn<PlaceService['getAllPlaces']>(),
    calculateDate: vi.fn<PlaceService['calculateDate']>(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), { provide: PlaceService, useValue: placeService }],
    });
  });

  async function render() {
    fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
  }

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('propose de réessayer quand le chargement des lieux échoue', async () => {
    placeService.getAllPlaces.mockReturnValueOnce(throwError(() => new Error('500')));
    placeService.getAllPlaces.mockReturnValueOnce(of(aPage([tahiti, paris])));

    await render();
    expect(element().textContent).toContain('Impossible de charger les lieux.');

    element().querySelector<HTMLButtonElement>('p-button[label="Réessayer"] button')!.click();
    await fixture.whenStable();

    expect(element().querySelector('form')).not.toBeNull();
  });

  it('invite à configurer des lieux quand il y en a moins de deux', async () => {
    placeService.getAllPlaces.mockReturnValue(of(aPage([tahiti])));

    await render();

    expect(element().textContent).toContain('Veuillez configurer 2 lieux');
    expect(element().querySelector('a')?.getAttribute('href')).toBe('/admin/place/new');
    expect(element().querySelector('form')).toBeNull();
  });

  it('calcule la date dans chaque lieu et affiche les résultats', async () => {
    placeService.getAllPlaces.mockReturnValue(of(aPage([tahiti, paris])));
    placeService.calculateDate.mockReturnValue(
      of({
        calculateDateItemList: [
          { place: tahiti, date: new Date(2026, 9, 6, 10, 0) },
          { place: paris, date: new Date(2026, 9, 6, 22, 0) },
        ],
      }),
    );

    await render();
    const submit = element().querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submit.disabled).toBe(true);

    fixture.componentInstance.form.setValue({
      place: tahiti,
      dateSearch: new Date(2026, 9, 6, 10, 0, 0),
    });
    await fixture.whenStable();
    submit.click();
    await fixture.whenStable();

    // L'heure saisie est transmise telle quelle, sans décalage lié au fuseau du navigateur
    expect(placeService.calculateDate).toHaveBeenCalledWith({
      date: new Date('2026-10-06T10:00:00.000Z'),
      placeId: 1,
    });
    const results = [...element().querySelectorAll('h2 ~ div')].map((it) =>
      it.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(results).toEqual(['tahiti : 06/10/2026 à 10:00', 'paris : 06/10/2026 à 22:00']);
    expect(element().querySelector('h2 + p')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Le 06/10/2026 à 10:00 à tahiti correspond à :',
    );
  });

  it('efface les résultats dès que la saisie est modifiée', async () => {
    placeService.getAllPlaces.mockReturnValue(of(aPage([tahiti, paris])));
    placeService.calculateDate.mockReturnValue(
      of({
        calculateDateItemList: [{ place: tahiti, date: new Date(2026, 9, 6, 10, 0) }],
      }),
    );

    await render();
    fixture.componentInstance.form.setValue({
      place: tahiti,
      dateSearch: new Date(2026, 9, 6, 10, 0, 0),
    });
    fixture.componentInstance.onSubmit();
    await fixture.whenStable();
    expect(element().textContent).toContain('Résultats');

    fixture.componentInstance.form.controls.place.setValue(paris);
    await fixture.whenStable();

    expect(element().textContent).not.toContain('Résultats');
  });

  it("ignore la réponse d'un calcul lancé avant une modification de la saisie", async () => {
    placeService.getAllPlaces.mockReturnValue(of(aPage([tahiti, paris])));
    const pending = new Subject<CalculateDateResponse>();
    placeService.calculateDate.mockReturnValue(pending);

    await render();
    fixture.componentInstance.form.setValue({
      place: tahiti,
      dateSearch: new Date(2026, 9, 6, 10, 0, 0),
    });
    fixture.componentInstance.onSubmit();
    fixture.componentInstance.form.controls.place.setValue(paris);
    pending.next({
      calculateDateItemList: [{ place: tahiti, date: new Date(2026, 9, 6, 10, 0) }],
    });
    await fixture.whenStable();

    expect(pending.observed).toBe(false);
    expect(fixture.componentInstance.calculating()).toBe(false);
    expect(element().textContent).not.toContain('Résultats');
  });

  it('affiche un indicateur pendant le chargement des lieux', async () => {
    placeService.getAllPlaces.mockReturnValue(new Subject());

    await render();

    expect(element().querySelector('p-progressSpinner')?.getAttribute('aria-label')).toBe(
      'Chargement des lieux',
    );
    expect(element().querySelector('form')).toBeNull();
  });

  it('désactive le bouton Calculer pendant le calcul', async () => {
    placeService.getAllPlaces.mockReturnValue(of(aPage([tahiti, paris])));
    const pending = new Subject<never>();
    placeService.calculateDate.mockReturnValue(pending);

    await render();
    fixture.componentInstance.form.setValue({
      place: tahiti,
      dateSearch: new Date(2026, 9, 6, 10, 0, 0),
    });
    await fixture.whenStable();
    const submit = element().querySelector<HTMLButtonElement>('button[type="submit"]')!;
    submit.click();
    await fixture.whenStable();

    expect(submit.disabled).toBe(true);
    fixture.componentInstance.onSubmit();
    expect(placeService.calculateDate).toHaveBeenCalledTimes(1);

    pending.complete();
    await fixture.whenStable();
    expect(submit.disabled).toBe(false);
  });

  describe('chargement progressif des lieux dans la liste', () => {
    const firstPage = Array.from({ length: 10 }, (_, i) => aPlace({ id: i, label: `tz ${i}` }));

    it("charge la page suivante à l'approche de la fin de la liste", async () => {
      placeService.getAllPlaces.mockReturnValueOnce(
        of(aPage(firstPage, { totalElements: 12, totalPages: 2 })),
      );
      placeService.getAllPlaces.mockReturnValueOnce(
        of(aPage([tahiti, paris], { totalElements: 12, totalPages: 2, number: 1 })),
      );
      await render();

      fixture.componentInstance.onLazyLoadPlace({ first: 0, last: 6 });

      expect(placeService.getAllPlaces).toHaveBeenLastCalledWith(1, 10);
      expect(fixture.componentInstance.places()).toEqual([...firstPage, tahiti, paris]);
    });

    it("ne charge rien tant que la fin de la liste n'est pas proche", async () => {
      placeService.getAllPlaces.mockReturnValue(
        of(aPage(firstPage, { totalElements: 12, totalPages: 2 })),
      );
      await render();

      fixture.componentInstance.onLazyLoadPlace({ first: 0, last: 4 });

      expect(placeService.getAllPlaces).toHaveBeenCalledTimes(1);
    });

    it('ne charge rien quand toutes les pages sont déjà chargées', async () => {
      placeService.getAllPlaces.mockReturnValue(of(aPage(firstPage)));
      await render();

      fixture.componentInstance.onLazyLoadPlace({ first: 0, last: 9 });

      expect(placeService.getAllPlaces).toHaveBeenCalledTimes(1);
    });
  });
});
