import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AdministrationComponent } from './administration.component';
import { PlaceService } from '../../shared/service/place.service';
import { aPage, aPlace, aZoneIdPlace } from '../../../testing/place.fixture';
import { MessageService } from 'primeng/api';

describe('AdministrationComponent', () => {
  let fixture: ComponentFixture<AdministrationComponent>;
  const placeService = {
    getAllPlaces: vi.fn<PlaceService['getAllPlaces']>(),
    deletePlace: vi.fn<PlaceService['deletePlace']>(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      imports: [AdministrationComponent],
      providers: [
        provideRouter([]),
        { provide: PlaceService, useValue: placeService },
        MessageService,
      ],
    });
    vi.spyOn(TestBed.inject(MessageService), 'add');
  });

  async function render() {
    fixture = TestBed.createComponent(AdministrationComponent);
    await fixture.whenStable();
  }

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function clickButton(selector: string) {
    element().querySelector<HTMLButtonElement>(`${selector} button`)!.click();
  }

  // La boîte de confirmation peut être rendue hors du composant : on la cherche dans tout le document
  async function clickInConfirmDialog(label: string) {
    await fixture.whenStable();
    const button = [
      ...document.querySelectorAll<HTMLButtonElement>('.p-confirmdialog button'),
    ].find((it) => it.textContent?.trim() === label);
    button!.click();
    await fixture.whenStable();
  }

  it('affiche la liste des lieux de la première page', async () => {
    placeService.getAllPlaces.mockReturnValue(
      of(aPage([aPlace({ id: 1, label: 'Tahiti' }), aZoneIdPlace({ id: 2, label: 'Paris' })])),
    );

    await render();

    expect(placeService.getAllPlaces).toHaveBeenCalledWith(0, 10);
    const labels = [...element().querySelectorAll('.resultat .grow')].map((it) => it.textContent);
    expect(labels).toEqual(['Tahiti', 'Paris']);
  });

  it('donne un libellé accessible aux boutons réduits à une icône', async () => {
    placeService.getAllPlaces.mockReturnValue(of(aPage([aPlace({ id: 1, label: 'Tahiti' })])));

    await render();

    const labels = [...element().querySelectorAll('p-button button')].map((it) =>
      it.getAttribute('aria-label'),
    );
    expect(labels).toEqual([
      'Ajouter un lieu',
      'Modifier Tahiti',
      'Voir Tahiti',
      'Supprimer Tahiti',
    ]);
  });

  it('affiche un indicateur pendant le chargement', async () => {
    placeService.getAllPlaces.mockReturnValue(new Subject());

    await render();

    expect(element().querySelector('p-progressSpinner')?.getAttribute('aria-label')).toBe(
      'Chargement des lieux',
    );
  });

  it("indique qu'aucun lieu n'est configuré", async () => {
    placeService.getAllPlaces.mockReturnValue(of(aPage([])));

    await render();

    expect(element().textContent).toContain('Aucun lieu configuré.');
  });

  it('propose de réessayer quand le chargement échoue', async () => {
    placeService.getAllPlaces.mockReturnValueOnce(throwError(() => new Error('500')));
    placeService.getAllPlaces.mockReturnValueOnce(of(aPage([aPlace({ label: 'Tahiti' })])));

    await render();
    expect(element().textContent).toContain('Impossible de charger les lieux.');

    clickButton('p-button[label="Réessayer"]');
    await fixture.whenStable();

    expect(placeService.getAllPlaces).toHaveBeenCalledTimes(2);
    expect(element().textContent).toContain('Tahiti');
  });

  it('charge la page demandée via le paginator', async () => {
    placeService.getAllPlaces.mockReturnValue(
      of(aPage([aPlace()], { totalElements: 25, totalPages: 3 })),
    );

    await render();
    element().querySelectorAll<HTMLButtonElement>('.p-paginator-page')[1].click();
    await fixture.whenStable();

    expect(placeService.getAllPlaces).toHaveBeenLastCalledWith(1, 10);
  });

  it('supprime un lieu puis recharge la page courante', async () => {
    placeService.getAllPlaces.mockReturnValueOnce(of(aPage([aPlace({ id: 1, label: 'Tahiti' })])));
    placeService.getAllPlaces.mockReturnValueOnce(of(aPage([])));
    placeService.deletePlace.mockReturnValue(of(undefined));

    await render();
    clickButton('p-button[icon="pi pi-trash"]');
    await clickInConfirmDialog('Supprimer');

    expect(placeService.deletePlace).toHaveBeenCalledWith(1);
    expect(TestBed.inject(MessageService).add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        detail: 'Lieu « Tahiti » supprimé.',
      }),
    );
    expect(placeService.getAllPlaces).toHaveBeenCalledTimes(2);
    expect(element().textContent).toContain('Aucun lieu configuré.');
  });

  it("revient à la page précédente quand le dernier lieu d'une page est supprimée", async () => {
    placeService.getAllPlaces.mockReturnValue(
      of(aPage([aPlace()], { totalElements: 11, totalPages: 2 })),
    );
    placeService.deletePlace.mockReturnValue(of(undefined));

    await render();
    element().querySelectorAll<HTMLButtonElement>('.p-paginator-page')[1].click();
    await fixture.whenStable();
    expect(placeService.getAllPlaces).toHaveBeenLastCalledWith(1, 10);

    placeService.getAllPlaces.mockReturnValue(
      of(aPage([], { totalElements: 10, totalPages: 1, number: 1 })),
    );
    clickButton('p-button[icon="pi pi-trash"]');
    await clickInConfirmDialog('Supprimer');

    expect(placeService.getAllPlaces).toHaveBeenLastCalledWith(0, 10);
  });

  it('demande confirmation en rappelant le lieu à supprimer', async () => {
    placeService.getAllPlaces.mockReturnValue(of(aPage([aPlace({ id: 1, label: 'Tahiti' })])));

    await render();
    clickButton('p-button[icon="pi pi-trash"]');
    await fixture.whenStable();

    expect(document.querySelector('.p-confirmdialog')?.textContent).toContain(
      'Supprimer le lieu « Tahiti » ?',
    );
    expect(placeService.deletePlace).not.toHaveBeenCalled();
  });

  it('ne supprime rien quand la suppression est annulée', async () => {
    placeService.getAllPlaces.mockReturnValue(of(aPage([aPlace({ id: 1, label: 'Tahiti' })])));

    await render();
    clickButton('p-button[icon="pi pi-trash"]');
    await clickInConfirmDialog('Annuler');

    expect(placeService.deletePlace).not.toHaveBeenCalled();
    expect(placeService.getAllPlaces).toHaveBeenCalledTimes(1);
  });

  it('ne recharge pas la liste quand la suppression échoue', async () => {
    placeService.getAllPlaces.mockReturnValue(of(aPage([aPlace()])));
    placeService.deletePlace.mockReturnValue(throwError(() => new Error('500')));

    await render();
    clickButton('p-button[icon="pi pi-trash"]');
    await clickInConfirmDialog('Supprimer');

    expect(placeService.getAllPlaces).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(MessageService).add).not.toHaveBeenCalled();
  });
});
