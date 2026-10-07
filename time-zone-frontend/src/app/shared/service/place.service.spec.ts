import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { PlaceService } from './place.service';
import { $ZodError } from 'zod/v4/core';
import { PlaceRequest } from '../model/place.model';
import { MessageService } from 'primeng/api';
import { responseValidationInterceptor } from '../interceptor/response-validation.interceptor';

describe('PlaceService', () => {
  let service: PlaceService;
  let httpTesting: HttpTestingController;

  const audit = { createDate: '2026-01-01T10:00:00.123456Z', updateDate: '2026-01-02T10:00:00Z' };
  const placeJson = () => ({
    id: 1,
    type: 'ZONE_OFFSET_FIXED',
    label: 'Tahiti',
    zoneOffset: '-10:00',
    audit,
  });
  const zoneIdPlaceJson = () => ({
    id: 2,
    type: 'ZONE_ID',
    label: 'Paris',
    zoneId: 'Europe/Paris',
    audit,
  });
  const request: PlaceRequest = {
    type: 'ZONE_OFFSET_FIXED',
    label: 'Tahiti',
    zoneOffset: '-10:00',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([responseValidationInterceptor])),
        provideHttpClientTesting(),
        MessageService,
      ],
    });
    service = TestBed.inject(PlaceService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it("getAllPlaces envoie la pagination, accepte les deux types et convertit les dates d'audit", async () => {
    const result = firstValueFrom(service.getAllPlaces(2, 20));

    const req = httpTesting.expectOne((r) => r.url === 'api/places');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('20');
    req.flush({
      content: [placeJson(), zoneIdPlaceJson()],
      totalPages: 1,
      totalElements: 2,
      number: 2,
      size: 20,
    });

    const page = await result;
    expect(page.content[0].audit.createDate).toEqual(new Date('2026-01-01T10:00:00.123Z'));
    expect(page.content[0].audit.updateDate).toEqual(new Date('2026-01-02T10:00:00Z'));
    expect(page.content[1]).toMatchObject({ type: 'ZONE_ID', zoneId: 'Europe/Paris' });
  });

  it("getPlaceById appelle la ressource et convertit les dates d'audit", async () => {
    const result = firstValueFrom(service.getPlaceById(1));

    const req = httpTesting.expectOne('api/places/1');
    expect(req.request.method).toBe('GET');
    req.flush(placeJson());

    expect((await result).audit.updateDate).toBeInstanceOf(Date);
  });

  it('createPlace envoie le formulaire en POST', async () => {
    const result = firstValueFrom(service.createPlace(request));

    const req = httpTesting.expectOne('api/places');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(placeJson());

    expect((await result).audit.createDate).toBeInstanceOf(Date);
  });

  it('updatePlace envoie le formulaire en PUT', async () => {
    const zoneIdRequest: PlaceRequest = { type: 'ZONE_ID', label: 'Paris', zoneId: 'Europe/Paris' };
    const result = firstValueFrom(service.updatePlace(2, zoneIdRequest));

    const req = httpTesting.expectOne('api/places/2');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(zoneIdRequest);
    req.flush(zoneIdPlaceJson());

    expect((await result).id).toBe(2);
  });

  it('deletePlace envoie un DELETE', async () => {
    const result = firstValueFrom(service.deletePlace(1));

    const req = httpTesting.expectOne('api/places/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    await result;
  });

  it('getAllZoneIds charge la liste des zones IANA', async () => {
    const result = firstValueFrom(service.getAllZoneIds());

    const req = httpTesting.expectOne('api/places/zone-ids');
    expect(req.request.method).toBe('GET');
    req.flush(['Europe/Paris', 'Pacific/Tahiti']);

    expect(await result).toEqual(['Europe/Paris', 'Pacific/Tahiti']);
  });

  it('getAllZoneOffsets charge la liste des décalages', async () => {
    const result = firstValueFrom(service.getAllZoneOffsets());

    const req = httpTesting.expectOne('api/places/zone-offsets');
    expect(req.request.method).toBe('GET');
    req.flush(['-10:00', 'Z', '+05:45']);

    expect(await result).toEqual(['-10:00', 'Z', '+05:45']);
  });

  it('calculateDate envoie la demande et convertit les dates calculées', async () => {
    const form = { date: new Date('2026-10-06T10:00:00Z'), placeId: 1 };
    const result = firstValueFrom(service.calculateDate(form));

    const req = httpTesting.expectOne('api/places/calculate-date');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(form);
    req.flush({
      calculateDateItemList: [{ date: '2026-10-06T00:00:00', place: zoneIdPlaceJson() }],
    });

    const response = await result;
    expect(response.calculateDateItemList[0].date).toEqual(new Date(2026, 9, 6, 0, 0, 0));
  });

  it('rejette une réponse dont le décalage UTC est mal formé', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = firstValueFrom(service.getPlaceById(1));

    httpTesting.expectOne('api/places/1').flush({ ...placeJson(), zoneOffset: 'UTC-10' });

    await expect(result).rejects.toBeInstanceOf($ZodError);
  });

  it('rejette une réponse dont le type de lieu est inconnu', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = firstValueFrom(service.getPlaceById(1));

    httpTesting.expectOne('api/places/1').flush({ ...placeJson(), type: 'INCONNU' });

    await expect(result).rejects.toBeInstanceOf($ZodError);
  });
});
