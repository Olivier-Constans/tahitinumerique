import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { routes } from '../../../app.routes';
import { PlaceService } from '../../../shared/service/place.service';
import { aPlace, aZoneIdPlace } from '../../../../testing/place.fixture';
import { PlaceEditComponent } from './place-edit/place-edit.component';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';

describe('Routes place (consultation, création, modification)', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  const placeService = {
    getPlaceById: vi.fn<PlaceService['getPlaceById']>(),
    createPlace: vi.fn<PlaceService['createPlace']>(),
    updatePlace: vi.fn<PlaceService['updatePlace']>(),
    getAllZoneIds: vi.fn<PlaceService['getAllZoneIds']>(),
    getAllZoneOffsets: vi.fn<PlaceService['getAllZoneOffsets']>(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    placeService.getAllZoneIds.mockReturnValue(of(['Europe/Paris', 'Pacific/Tahiti']));
    placeService.getAllZoneOffsets.mockReturnValue(of(['-10:00', 'Z', '+01:00', '+09:00']));
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: PlaceService, useValue: placeService },
        MessageService,
      ],
    });
    vi.spyOn(TestBed.inject(MessageService), 'add');
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  function element(): HTMLElement {
    return harness.routeNativeElement!;
  }

  function component(): PlaceEditComponent {
    return harness.routeDebugElement!.componentInstance as PlaceEditComponent;
  }

  function submitButton(): HTMLButtonElement {
    return element().querySelector<HTMLButtonElement>('button[type="submit"]')!;
  }

  function fillLabel(value: string) {
    const input = element().querySelector<HTMLInputElement>('input#label')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function selectOffset(offset: string) {
    component().form.controls.zoneOffset.setValue(offset);
  }

  function selectZoneId(zoneId: string) {
    component().form.controls.zoneId.setValue(zoneId);
  }

  async function chooseType(label: string) {
    const button = [
      ...element().querySelectorAll<HTMLElement>('p-selectbutton [role="button"]'),
    ].find((it) => it.textContent?.trim() === label);
    button!.click();
    await harness.fixture.whenStable();
  }

  async function submit() {
    submitButton().click();
    await harness.fixture.whenStable();
  }

  describe('consultation', () => {
    it('affiche un lieu à décalage fixe chargé par le resolver', async () => {
      placeService.getPlaceById.mockReturnValue(
        of(aPlace({ id: 5, label: 'Paris', zoneOffset: '+01:00' })),
      );

      await harness.navigateByUrl('/admin/place/5');

      expect(placeService.getPlaceById).toHaveBeenCalledWith(5);
      expect(element().querySelector('h2')?.textContent).toBe('Paris');
      expect(element().textContent).toMatch(/Modifié le 02\/01\/2026 à \d{2}:\d{2}/);
      expect(element().textContent).toContain('Type : Décalage UTC fixe');
      expect(element().textContent).toContain('Décalage UTC : UTC+01:00');
    });

    it('affiche un lieu rattaché à une zone IANA', async () => {
      placeService.getPlaceById.mockReturnValue(of(aZoneIdPlace({ id: 6 })));

      await harness.navigateByUrl('/admin/place/6');

      expect(element().textContent).toContain('Type : Zone IANA');
      expect(element().textContent).toContain('Zone IANA : Europe/Paris');
      expect(element().textContent).not.toContain('Décalage UTC :');
    });

    it('redirige vers la 404 quand le lieu est introuvable', async () => {
      placeService.getPlaceById.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404 })),
      );

      await harness.navigateByUrl('/admin/place/99');

      expect(router.url).toBe('/404');
      expect(element().textContent).toContain('Page introuvable');
    });

    it('annule la navigation sans rediriger vers la 404 pour une autre erreur', async () => {
      await harness.navigateByUrl('/admin/place/new');
      placeService.getPlaceById.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 500 })),
      );

      await harness.navigateByUrl('/admin/place/99');

      expect(router.url).toBe('/admin/place/new');
    });
  });

  describe('création', () => {
    beforeEach(async () => {
      await harness.navigateByUrl('/admin/place/new');
    });

    it('affiche un formulaire vide, en décalage fixe, dont la validation est désactivée', () => {
      expect(element().querySelector('h2')?.textContent).toContain('Nouveau lieu');
      expect(component().form.controls.type.value).toBe('ZONE_OFFSET_FIXED');
      expect(element().querySelector('#zoneOffset')).not.toBeNull();
      expect(element().querySelector('#zoneId')).toBeNull();
      expect(submitButton().disabled).toBe(true);
      expect(element().querySelector('p-message')).toBeNull();
    });

    it("refuse un nom composé uniquement d'espaces et l'explique sous le champ", async () => {
      fillLabel('   ');
      selectOffset('+09:00');
      element().querySelector<HTMLInputElement>('input#label')!.dispatchEvent(new Event('blur'));
      await harness.fixture.whenStable();

      const input = element().querySelector<HTMLInputElement>('input#label')!;
      expect(element().querySelector('#label-error')?.textContent?.trim()).toBe(
        'Le nom est obligatoire.',
      );
      expect(input.getAttribute('aria-describedby')).toBe('label-error');
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(submitButton().disabled).toBe(true);
    });

    it('signale un décalage UTC manquant et relie le message au champ', async () => {
      const combobox = element().querySelector<HTMLElement>('#zoneOffset')!;
      expect(combobox.getAttribute('aria-describedby')).toBeNull();
      expect(combobox.getAttribute('aria-invalid')).not.toBe('true');

      combobox.dispatchEvent(new Event('blur'));
      await harness.fixture.whenStable();

      expect(element().querySelector('#zoneOffset-error')?.textContent?.trim()).toBe(
        'Le décalage UTC est obligatoire.',
      );
      expect(combobox.getAttribute('aria-describedby')).toBe('zoneOffset-error');
      expect(combobox.getAttribute('aria-invalid')).toBe('true');
    });

    it('limite le nom à 100 caractères', async () => {
      const input = element().querySelector<HTMLInputElement>('input#label')!;
      expect(input.getAttribute('maxlength')).toBe('100');

      fillLabel('a'.repeat(101));
      input.dispatchEvent(new Event('blur'));
      await harness.fixture.whenStable();

      expect(element().querySelector('#label-error')?.textContent?.trim()).toBe(
        'Le nom ne doit pas dépasser 100 caractères.',
      );
    });

    it('envoie le nom sans les espaces superflus', async () => {
      placeService.createPlace.mockReturnValue(new Subject());

      fillLabel('  Tokyo ');
      selectOffset('+09:00');
      await harness.fixture.whenStable();
      await submit();

      expect(placeService.createPlace).toHaveBeenCalledWith({
        type: 'ZONE_OFFSET_FIXED',
        label: 'Tokyo',
        zoneOffset: '+09:00',
      });
    });

    it('crée le lieu puis redirige vers sa consultation', async () => {
      const created = aPlace({ id: 7, label: 'Tokyo' });
      placeService.createPlace.mockReturnValue(of(created));
      placeService.getPlaceById.mockReturnValue(of(created));

      fillLabel('Tokyo');
      selectOffset('+09:00');
      await harness.fixture.whenStable();
      await submit();

      expect(placeService.createPlace).toHaveBeenCalledWith({
        type: 'ZONE_OFFSET_FIXED',
        label: 'Tokyo',
        zoneOffset: '+09:00',
      });
      expect(TestBed.inject(MessageService).add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          detail: 'Lieu « Tokyo » créé.',
        }),
      );
      expect(router.url).toBe('/admin/place/7');
    });

    it('affiche le choix de la zone IANA quand ce type est sélectionné', async () => {
      await chooseType('Zone IANA');

      expect(component().form.controls.type.value).toBe('ZONE_ID');
      expect(element().querySelector('#zoneId')).not.toBeNull();
      expect(element().querySelector('#zoneOffset')).toBeNull();
      expect(placeService.getAllZoneIds).toHaveBeenCalled();
    });

    it('exige une zone IANA, même si un décalage avait été choisi', async () => {
      fillLabel('Paris');
      selectOffset('+01:00');
      await chooseType('Zone IANA');

      expect(submitButton().disabled).toBe(true);

      selectZoneId('Europe/Paris');
      await harness.fixture.whenStable();

      expect(submitButton().disabled).toBe(false);
    });

    it('crée un lieu rattaché à une zone IANA', async () => {
      placeService.createPlace.mockReturnValue(new Subject());

      fillLabel('Paris');
      selectOffset('+01:00');
      await chooseType('Zone IANA');
      selectZoneId('Europe/Paris');
      await harness.fixture.whenStable();
      await submit();

      // Le décalage saisi avant le changement de type n'est pas envoyé
      expect(placeService.createPlace).toHaveBeenCalledWith({
        type: 'ZONE_ID',
        label: 'Paris',
        zoneId: 'Europe/Paris',
      });
    });

    it("désactive le bouton pendant l'enregistrement", async () => {
      const pending = new Subject<ReturnType<typeof aPlace>>();
      placeService.createPlace.mockReturnValue(pending);

      fillLabel('Tokyo');
      selectOffset('+09:00');
      await harness.fixture.whenStable();
      await submit();

      expect(submitButton().disabled).toBe(true);
      await submit();
      expect(placeService.createPlace).toHaveBeenCalledTimes(1);
    });

    it("reste sur le formulaire en cas d'erreur", async () => {
      placeService.createPlace.mockReturnValue(throwError(() => new Error('500')));

      fillLabel('Tokyo');
      selectOffset('+09:00');
      await harness.fixture.whenStable();
      await submit();

      expect(router.url).toBe('/admin/place/new');
    });
  });

  describe('modification', () => {
    const place = aPlace({ id: 5, label: 'Tahiti' });

    beforeEach(async () => {
      placeService.getPlaceById.mockReturnValue(of(place));
      await harness.navigateByUrl('/admin/place/5/edit');
    });

    it('pré-remplit le formulaire avec le lieu', () => {
      expect(element().querySelector('h2')?.textContent).toContain('Modification du lieu "Tahiti"');
      expect(element().querySelector<HTMLInputElement>('input#label')!.value).toBe('Tahiti');
      expect(component().form.controls.zoneOffset.value).toBe('-10:00');
      expect(submitButton().disabled).toBe(false);
    });

    it('met à jour le lieu puis redirige vers sa consultation', async () => {
      placeService.updatePlace.mockReturnValue(of({ ...place, label: 'Papeete' }));

      fillLabel('Papeete');
      await submit();

      expect(placeService.updatePlace).toHaveBeenCalledWith(5, {
        type: 'ZONE_OFFSET_FIXED',
        label: 'Papeete',
        zoneOffset: place.zoneOffset,
      });
      expect(TestBed.inject(MessageService).add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          detail: 'Lieu « Papeete » modifié.',
        }),
      );
      expect(router.url).toBe('/admin/place/5');
    });

    it("change l'implémentation du lieu en zone IANA", async () => {
      placeService.updatePlace.mockReturnValue(new Subject());

      await chooseType('Zone IANA');
      selectZoneId('Pacific/Tahiti');
      await harness.fixture.whenStable();
      await submit();

      expect(placeService.updatePlace).toHaveBeenCalledWith(5, {
        type: 'ZONE_ID',
        label: 'Tahiti',
        zoneId: 'Pacific/Tahiti',
      });
    });

    it("reste sur le formulaire en cas d'erreur", async () => {
      placeService.updatePlace.mockReturnValue(throwError(() => new Error('500')));

      fillLabel('Papeete');
      await submit();

      expect(router.url).toBe('/admin/place/5/edit');
    });
  });

  describe("modification d'un lieu rattaché à une zone IANA", () => {
    it('pré-remplit le type et la zone', async () => {
      placeService.getPlaceById.mockReturnValue(of(aZoneIdPlace({ id: 6 })));

      await harness.navigateByUrl('/admin/place/6/edit');

      expect(component().form.controls.type.value).toBe('ZONE_ID');
      expect(component().form.controls.zoneId.value).toBe('Europe/Paris');
      expect(element().querySelector('#zoneId')).not.toBeNull();
      expect(element().querySelector('#zoneOffset')).toBeNull();
      expect(submitButton().disabled).toBe(false);
    });
  });
});
