import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from "@angular/common/http";
import {HttpTestingController, provideHttpClientTesting} from "@angular/common/http/testing";
import {firstValueFrom} from "rxjs";
import {TimezoneService} from './timezone.service';
import {$ZodError} from "zod/v4/core";
import {TimezoneRequest} from "../model/timezone.model";

describe('TimezoneService', () => {
  let service: TimezoneService;
  let httpTesting: HttpTestingController;

  const timezoneJson = () => ({
    id: 1,
    label: 'Tahiti',
    offsetUTC: 'UTC-10',
    audit: {createDate: '2026-01-01T10:00:00.123456Z', updateDate: '2026-01-02T10:00:00Z'}
  });
  const request: TimezoneRequest = {label: 'Tahiti', offsetUTC: 'UTC-10'};

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TimezoneService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('getAllTimezones envoie la pagination et convertit les dates d\'audit', async () => {
    const result = firstValueFrom(service.getAllTimezones(2, 20));

    const req = httpTesting.expectOne(r => r.url === 'api/timezones');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('20');
    req.flush({content: [timezoneJson()], totalPages: 1, totalElements: 1, number: 2, size: 20});

    const page = await result;
    expect(page.content[0].audit.createDate).toEqual(new Date('2026-01-01T10:00:00.123Z'));
    expect(page.content[0].audit.updateDate).toEqual(new Date('2026-01-02T10:00:00Z'));
  });

  it('getTimezoneById appelle la ressource et convertit les dates d\'audit', async () => {
    const result = firstValueFrom(service.getTimezoneById(1));

    const req = httpTesting.expectOne('api/timezones/1');
    expect(req.request.method).toBe('GET');
    req.flush(timezoneJson());

    expect((await result).audit.updateDate).toBeInstanceOf(Date);
  });

  it('createTimezone envoie le formulaire en POST', async () => {
    const result = firstValueFrom(service.createTimezone(request));

    const req = httpTesting.expectOne('api/timezones');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(timezoneJson());

    expect((await result).audit.createDate).toBeInstanceOf(Date);
  });

  it('updateTimezone envoie le formulaire en PUT', async () => {
    const result = firstValueFrom(service.updateTimezone(1, request));

    const req = httpTesting.expectOne('api/timezones/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush(timezoneJson());

    expect((await result).id).toBe(1);
  });

  it('deleteTimezone envoie un DELETE', async () => {
    const result = firstValueFrom(service.deleteTimezone(1));

    const req = httpTesting.expectOne('api/timezones/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await result;
  });

  it('calculateDate envoie la demande et convertit les dates calculées', async () => {
    const form = {date: new Date('2026-10-06T10:00:00Z'), timezoneId: 1};
    const result = firstValueFrom(service.calculateDate(form));

    const req = httpTesting.expectOne('api/timezones/calculate-date');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(form);
    req.flush({calculateDateItemList: [{date: '2026-10-06T00:00:00', timezone: timezoneJson()}]});

    const response = await result;
    expect(response.calculateDateItemList[0].date).toEqual(new Date(2026, 9, 6, 0, 0, 0));
  });

  it('rejette une réponse dont le décalage UTC est inconnu', async () => {
    const result = firstValueFrom(service.getTimezoneById(1));

    httpTesting.expectOne('api/timezones/1').flush({...timezoneJson(), offsetUTC: 'UTC+99'});

    await expect(result).rejects.toBeInstanceOf($ZodError);
  });
});
