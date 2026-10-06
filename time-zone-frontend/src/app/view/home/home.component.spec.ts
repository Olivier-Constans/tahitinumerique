import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from "@angular/router";
import {of, throwError} from "rxjs";
import {HomeComponent} from './home.component';
import {TimezoneService} from "../../shared/service/timezone.service";
import {aPage, aTimezone} from "../../../testing/timezone.fixture";

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  const tahiti = aTimezone({id: 1, label: 'tahiti'});
  const paris = aTimezone({id: 2, label: 'paris'});
  const timezoneService = {
    getAllTimezones: vi.fn<TimezoneService['getAllTimezones']>(),
    calculateDate: vi.fn<TimezoneService['calculateDate']>()
  };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        {provide: TimezoneService, useValue: timezoneService}
      ]
    });
  });

  async function render() {
    fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
  }

  function element(): HTMLElement {
    return fixture.nativeElement;
  }

  it('propose de réessayer quand le chargement des timezones échoue', async () => {
    timezoneService.getAllTimezones.mockReturnValueOnce(throwError(() => new Error('500')));
    timezoneService.getAllTimezones.mockReturnValueOnce(of(aPage([tahiti, paris])));

    await render();
    expect(element().textContent).toContain('Impossible de charger les fuseaux horaires.');

    element().querySelector<HTMLButtonElement>('p-button[label="Réessayer"] button')!.click();
    await fixture.whenStable();

    expect(element().querySelector('form')).not.toBeNull();
  });

  it('invite à configurer des timezones quand il y en a moins de deux', async () => {
    timezoneService.getAllTimezones.mockReturnValue(of(aPage([tahiti])));

    await render();

    expect(element().textContent).toContain('Veuillez configurer 2 fuseaux horaires');
    expect(element().querySelector('a')?.getAttribute('href')).toBe('/admin/timezone/new');
    expect(element().querySelector('form')).toBeNull();
  });

  it('calcule la date dans chaque timezone et affiche les résultats', async () => {
    timezoneService.getAllTimezones.mockReturnValue(of(aPage([tahiti, paris])));
    timezoneService.calculateDate.mockReturnValue(of({
      calculateDateItemList: [
        {timezone: tahiti, date: new Date(2026, 9, 6, 10, 0)},
        {timezone: paris, date: new Date(2026, 9, 6, 22, 0)}
      ]
    }));

    await render();
    const submit = element().querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submit.disabled).toBe(true);

    fixture.componentInstance.form.setValue({timezone: tahiti, dateSearch: new Date(2026, 9, 6, 10, 0, 0)});
    await fixture.whenStable();
    submit.click();
    await fixture.whenStable();

    // L'heure saisie est transmise telle quelle, sans décalage lié au fuseau du navigateur
    expect(timezoneService.calculateDate).toHaveBeenCalledWith({
      date: new Date('2026-10-06T10:00:00.000Z'),
      timezoneId: 1
    });
    const results = [...element().querySelectorAll('h2 ~ div')].map(it => it.textContent?.replace(/\s+/g, ' ').trim());
    expect(results).toEqual(['tahiti: 06/10/2026 à 10:00', 'paris: 06/10/2026 à 22:00']);
  });

  describe('chargement progressif des timezones dans la liste', () => {
    const firstPage = Array.from({length: 10}, (_, i) => aTimezone({id: i, label: `tz ${i}`}));

    it('charge la page suivante à l\'approche de la fin de la liste', async () => {
      timezoneService.getAllTimezones.mockReturnValueOnce(of(aPage(firstPage, {totalElements: 12, totalPages: 2})));
      timezoneService.getAllTimezones.mockReturnValueOnce(of(aPage([tahiti, paris], {totalElements: 12, totalPages: 2, number: 1})));
      await render();

      fixture.componentInstance.onLazyLoadTimezone({first: 0, last: 6});

      expect(timezoneService.getAllTimezones).toHaveBeenLastCalledWith(1, 10);
      expect(fixture.componentInstance.timezones()).toEqual([...firstPage, tahiti, paris]);
    });

    it('ne charge rien tant que la fin de la liste n\'est pas proche', async () => {
      timezoneService.getAllTimezones.mockReturnValue(of(aPage(firstPage, {totalElements: 12, totalPages: 2})));
      await render();

      fixture.componentInstance.onLazyLoadTimezone({first: 0, last: 4});

      expect(timezoneService.getAllTimezones).toHaveBeenCalledTimes(1);
    });

    it('ne charge rien quand toutes les pages sont déjà chargées', async () => {
      timezoneService.getAllTimezones.mockReturnValue(of(aPage(firstPage)));
      await render();

      fixture.componentInstance.onLazyLoadTimezone({first: 0, last: 9});

      expect(timezoneService.getAllTimezones).toHaveBeenCalledTimes(1);
    });
  });
});
