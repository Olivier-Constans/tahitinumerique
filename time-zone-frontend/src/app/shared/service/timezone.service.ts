import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TimezoneRequest, TimezoneResponse } from '../model/timezone.model';
import { Page, pageOf } from '../model/page.model';
import { CalculateDateResponse, CalculateDateRequest } from '../model/calculateDate.model';
import { expecting } from '../interceptor/response-validation.interceptor';

const TimezonePage = pageOf(TimezoneResponse);

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {
  private readonly _http = inject(HttpClient);
  private readonly baseUrl = 'api/timezones';

  getAllTimezones(page: number, size: number): Observable<Page<TimezoneResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this._http.get<Page<TimezoneResponse>>(`${this.baseUrl}`, { params, context: expecting(TimezonePage) });
  }

  createTimezone(form: TimezoneRequest): Observable<TimezoneResponse> {
    return this._http.post<TimezoneResponse>(`${this.baseUrl}`, form, { context: expecting(TimezoneResponse) });
  }

  getTimezoneById(id: number): Observable<TimezoneResponse> {
    return this._http.get<TimezoneResponse>(`${this.baseUrl}/${id}`, { context: expecting(TimezoneResponse) });
  }

  updateTimezone(id: number, form: TimezoneRequest): Observable<TimezoneResponse> {
    return this._http.put<TimezoneResponse>(`${this.baseUrl}/${id}`, form, { context: expecting(TimezoneResponse) });
  }

  deleteTimezone(id: number): Observable<void> {
    return this._http.delete<void>(`${this.baseUrl}/${id}`);
  }

  calculateDate(form: CalculateDateRequest): Observable<CalculateDateResponse> {
    return this._http.post<CalculateDateResponse>(`${this.baseUrl}/calculate-date`, form, { context: expecting(CalculateDateResponse) });
  }
}
