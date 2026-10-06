import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from "@angular/router";
import {of, throwError} from "rxjs";
import {AdministrationComponent} from './administration.component';
import {TimezoneService} from "../../shared/service/timezone.service";
import {aPage, aTimezone} from "../../../testing/timezone.fixture";

describe('AdministrationComponent', () => {
  let fixture: ComponentFixture<AdministrationComponent>;
  const timezoneService = {
    getAllTimezones: vi.fn<TimezoneService['getAllTimezones']>(),
    deleteTimezone: vi.fn<TimezoneService['deleteTimezone']>()
  };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      imports: [AdministrationComponent],
      providers: [
        provideRouter([]),
        {provide: TimezoneService, useValue: timezoneService}
      ]
    });
  });

  async function render() {
    fixture = TestBed.createComponent(AdministrationComponent);
    await fixture.whenStable();
  }

  function element(): HTMLElement {
    return fixture.nativeElement;
  }

  function clickButton(selector: string) {
    element().querySelector<HTMLButtonElement>(`${selector} button`)!.click();
  }

  it('affiche la liste des timezones de la première page', async () => {
    timezoneService.getAllTimezones.mockReturnValue(of(aPage([aTimezone({id: 1, label: 'Tahiti'}), aTimezone({id: 2, label: 'Paris'})])));

    await render();

    expect(timezoneService.getAllTimezones).toHaveBeenCalledWith(0, 10);
    const labels = [...element().querySelectorAll('.resultat .flex-grow-1')].map(it => it.textContent);
    expect(labels).toEqual(['Tahiti', 'Paris']);
  });

  it('indique qu\'aucune timezone n\'est configurée', async () => {
    timezoneService.getAllTimezones.mockReturnValue(of(aPage([])));

    await render();

    expect(element().textContent).toContain('Pas de timezone configurée');
  });

  it('propose de réessayer quand le chargement échoue', async () => {
    timezoneService.getAllTimezones.mockReturnValueOnce(throwError(() => new Error('500')));
    timezoneService.getAllTimezones.mockReturnValueOnce(of(aPage([aTimezone({label: 'Tahiti'})])));

    await render();
    expect(element().textContent).toContain('Impossible de charger les fuseaux horaires.');

    clickButton('p-button[label="Réessayer"]');
    await fixture.whenStable();

    expect(timezoneService.getAllTimezones).toHaveBeenCalledTimes(2);
    expect(element().textContent).toContain('Tahiti');
  });

  it('charge la page demandée via le paginator', async () => {
    timezoneService.getAllTimezones.mockReturnValue(of(aPage([aTimezone()], {totalElements: 25, totalPages: 3})));

    await render();
    element().querySelectorAll<HTMLButtonElement>('.p-paginator-page')[1].click();
    await fixture.whenStable();

    expect(timezoneService.getAllTimezones).toHaveBeenLastCalledWith(1, 10);
  });

  it('supprime une timezone puis recharge la page courante', async () => {
    timezoneService.getAllTimezones.mockReturnValueOnce(of(aPage([aTimezone({id: 1, label: 'Tahiti'})])));
    timezoneService.getAllTimezones.mockReturnValueOnce(of(aPage([])));
    timezoneService.deleteTimezone.mockReturnValue(of(undefined));

    await render();
    clickButton('p-button[icon="pi pi-trash"]');
    await fixture.whenStable();

    expect(timezoneService.deleteTimezone).toHaveBeenCalledWith(1);
    expect(timezoneService.getAllTimezones).toHaveBeenCalledTimes(2);
    expect(element().textContent).toContain('Pas de timezone configurée');
  });

  it('revient à la page précédente quand la dernière timezone d\'une page est supprimée', async () => {
    timezoneService.getAllTimezones.mockReturnValue(of(aPage([aTimezone()], {totalElements: 11, totalPages: 2})));
    timezoneService.deleteTimezone.mockReturnValue(of(undefined));

    await render();
    element().querySelectorAll<HTMLButtonElement>('.p-paginator-page')[1].click();
    await fixture.whenStable();
    expect(timezoneService.getAllTimezones).toHaveBeenLastCalledWith(1, 10);

    timezoneService.getAllTimezones.mockReturnValue(of(aPage([], {totalElements: 10, totalPages: 1, number: 1})));
    clickButton('p-button[icon="pi pi-trash"]');
    await fixture.whenStable();

    expect(timezoneService.getAllTimezones).toHaveBeenLastCalledWith(0, 10);
  });

  it('ne recharge pas la liste quand la suppression échoue', async () => {
    timezoneService.getAllTimezones.mockReturnValue(of(aPage([aTimezone()])));
    timezoneService.deleteTimezone.mockReturnValue(throwError(() => new Error('500')));

    await render();
    clickButton('p-button[icon="pi pi-trash"]');
    await fixture.whenStable();

    expect(timezoneService.getAllTimezones).toHaveBeenCalledTimes(1);
  });
});
