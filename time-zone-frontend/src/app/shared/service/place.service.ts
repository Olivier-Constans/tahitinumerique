import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlaceRequest, PlaceResponse, ZoneIds, ZoneOffsets } from '../model/place.model';
import { Page, pageOf } from '../model/page.model';
import { CalculateDateResponse, CalculateDateRequest } from '../model/calculateDate.model';
import { expecting } from '../interceptor/response-validation.interceptor';

const PlacePage = pageOf(PlaceResponse);

@Injectable({
  providedIn: 'root',
})
export class PlaceService {
  private readonly _http = inject(HttpClient);
  private readonly baseUrl = 'api/places';

  getAllPlaces(page: number, size: number): Observable<Page<PlaceResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this._http.get<Page<PlaceResponse>>(`${this.baseUrl}`, {
      params,
      context: expecting(PlacePage),
    });
  }

  createPlace(form: PlaceRequest): Observable<PlaceResponse> {
    return this._http.post<PlaceResponse>(`${this.baseUrl}`, form, {
      context: expecting(PlaceResponse),
    });
  }

  getPlaceById(id: number): Observable<PlaceResponse> {
    return this._http.get<PlaceResponse>(`${this.baseUrl}/${id}`, {
      context: expecting(PlaceResponse),
    });
  }

  updatePlace(id: number, form: PlaceRequest): Observable<PlaceResponse> {
    return this._http.put<PlaceResponse>(`${this.baseUrl}/${id}`, form, {
      context: expecting(PlaceResponse),
    });
  }

  deletePlace(id: number): Observable<void> {
    return this._http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Zones IANA acceptées par le back pour un lieu de type ZONE_ID
  getAllZoneIds(): Observable<string[]> {
    return this._http.get<string[]>(`${this.baseUrl}/zone-ids`, {
      context: expecting(ZoneIds),
    });
  }

  // Décalages acceptés par le back pour un lieu de type ZONE_OFFSET_FIXED, triés
  getAllZoneOffsets(): Observable<string[]> {
    return this._http.get<string[]>(`${this.baseUrl}/zone-offsets`, {
      context: expecting(ZoneOffsets),
    });
  }

  calculateDate(form: CalculateDateRequest): Observable<CalculateDateResponse> {
    return this._http.post<CalculateDateResponse>(`${this.baseUrl}/calculate-date`, form, {
      context: expecting(CalculateDateResponse),
    });
  }
}
