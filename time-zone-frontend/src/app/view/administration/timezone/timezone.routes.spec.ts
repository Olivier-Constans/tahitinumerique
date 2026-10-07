import {TestBed} from '@angular/core/testing';
import {provideRouter, Router, withComponentInputBinding} from "@angular/router";
import {RouterTestingHarness} from "@angular/router/testing";
import {of, Subject, throwError} from "rxjs";
import {routes} from "../../../app.routes";
import {TimezoneService} from "../../../shared/service/timezone.service";
import {aTimezone} from "../../../../testing/timezone.fixture";
import {OffsetUTC} from "../../../shared/model/offsetUTC.model";
import {TimezoneEditComponent} from "./timezone-edit/timezone-edit.component";
import {HttpErrorResponse} from "@angular/common/http";
import {MessageService} from "primeng/api";

describe('Routes timezone (consultation, création, modification)', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  const timezoneService = {
    getTimezoneById: vi.fn<TimezoneService['getTimezoneById']>(),
    createTimezone: vi.fn<TimezoneService['createTimezone']>(),
    updateTimezone: vi.fn<TimezoneService['updateTimezone']>()
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        {provide: TimezoneService, useValue: timezoneService},
        MessageService
      ]
    });
    vi.spyOn(TestBed.inject(MessageService), 'add');
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  function element(): HTMLElement {
    return harness.routeNativeElement!;
  }

  function fillLabel(value: string) {
    const input = element().querySelector<HTMLInputElement>('input#label')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function selectOffset(offset: OffsetUTC) {
    const component = harness.routeDebugElement!.componentInstance as TimezoneEditComponent;
    component.form.controls.offsetUTC.setValue(offset);
  }

  async function submit() {
    element().querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await harness.fixture.whenStable();
  }

  describe('consultation', () => {
    it('affiche la timezone chargée par le resolver', async () => {
      timezoneService.getTimezoneById.mockReturnValue(of(aTimezone({id: 5, label: 'Paris', offsetUTC: 'UTC+01'})));

      await harness.navigateByUrl('/admin/timezone/5');

      expect(timezoneService.getTimezoneById).toHaveBeenCalledWith(5);
      expect(element().querySelector('h2')?.textContent).toBe('Paris');
      expect(element().textContent).toMatch(/Modifié le 02\/01\/2026 à \d{2}:\d{2}/);
      expect(element().textContent).toContain('Décalage UTC : UTC+01');
    });

    it('redirige vers la 404 quand la timezone est introuvable', async () => {
      timezoneService.getTimezoneById.mockReturnValue(throwError(() => new HttpErrorResponse({status: 404})));

      await harness.navigateByUrl('/admin/timezone/99');

      expect(router.url).toBe('/404');
      expect(element().textContent).toContain('Page introuvable');
    });

    it('annule la navigation sans rediriger vers la 404 pour une autre erreur', async () => {
      await harness.navigateByUrl('/admin/timezone/new');
      timezoneService.getTimezoneById.mockReturnValue(throwError(() => new HttpErrorResponse({status: 500})));

      await harness.navigateByUrl('/admin/timezone/99');

      expect(router.url).toBe('/admin/timezone/new');
    });
  });

  describe('création', () => {
    beforeEach(async () => {
      await harness.navigateByUrl('/admin/timezone/new');
    });

    it('affiche un formulaire vide dont la validation est désactivée', () => {
      expect(element().querySelector('h2')?.textContent).toContain('Nouveau fuseau horaire');
      expect(element().querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    });

    it('crée la timezone puis redirige vers sa consultation', async () => {
      const created = aTimezone({id: 7, label: 'Tokyo'});
      timezoneService.createTimezone.mockReturnValue(of(created));
      timezoneService.getTimezoneById.mockReturnValue(of(created));

      fillLabel('Tokyo');
      selectOffset('UTC+09');
      await harness.fixture.whenStable();
      await submit();

      expect(timezoneService.createTimezone).toHaveBeenCalledWith({label: 'Tokyo', offsetUTC: 'UTC+09'});
      expect(TestBed.inject(MessageService).add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'success',
        detail: 'Fuseau horaire « Tokyo » créé.'
      }));
      expect(router.url).toBe('/admin/timezone/7');
    });

    it('désactive le bouton pendant l\'enregistrement', async () => {
      const pending = new Subject<ReturnType<typeof aTimezone>>();
      timezoneService.createTimezone.mockReturnValue(pending);

      fillLabel('Tokyo');
      selectOffset('UTC+09');
      await harness.fixture.whenStable();
      await submit();

      expect(element().querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
      await submit();
      expect(timezoneService.createTimezone).toHaveBeenCalledTimes(1);
    });

    it('reste sur le formulaire en cas d\'erreur', async () => {
      timezoneService.createTimezone.mockReturnValue(throwError(() => new Error('500')));

      fillLabel('Tokyo');
      selectOffset('UTC+09');
      await harness.fixture.whenStable();
      await submit();

      expect(router.url).toBe('/admin/timezone/new');
    });
  });

  describe('modification', () => {
    const timezone = aTimezone({id: 5, label: 'Tahiti'});

    beforeEach(async () => {
      timezoneService.getTimezoneById.mockReturnValue(of(timezone));
      await harness.navigateByUrl('/admin/timezone/5/edit');
    });

    it('pré-remplit le formulaire avec la timezone', () => {
      expect(element().querySelector('h2')?.textContent).toContain('Modification du fuseau horaire "Tahiti"');
      expect(element().querySelector<HTMLInputElement>('input#label')!.value).toBe('Tahiti');
      expect(element().querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
    });

    it('met à jour la timezone puis redirige vers sa consultation', async () => {
      timezoneService.updateTimezone.mockReturnValue(of({...timezone, label: 'Papeete'}));

      fillLabel('Papeete');
      await submit();

      expect(timezoneService.updateTimezone).toHaveBeenCalledWith(5, {label: 'Papeete', offsetUTC: timezone.offsetUTC});
      expect(TestBed.inject(MessageService).add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'success',
        detail: 'Fuseau horaire « Papeete » modifié.'
      }));
      expect(router.url).toBe('/admin/timezone/5');
    });

    it('reste sur le formulaire en cas d\'erreur', async () => {
      timezoneService.updateTimezone.mockReturnValue(throwError(() => new Error('500')));

      fillLabel('Papeete');
      await submit();

      expect(router.url).toBe('/admin/timezone/5/edit');
    });
  });
});
