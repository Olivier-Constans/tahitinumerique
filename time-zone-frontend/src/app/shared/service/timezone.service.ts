import { inject, Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {TimezoneRequest, TimezoneResponse} from "../model/timezone.model";
import {Page, pageOf} from "../model/page.model";
import {CalculateDateResponse, CalculateDateRequest} from "../model/calculateDate.model";

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
    return this._http.get<unknown>(`${this.baseUrl}`, { params })
      .pipe(map((json) => TimezonePage.parse(json)));
  }

  createTimezone(form: TimezoneRequest): Observable<TimezoneResponse> {
    return this._http.post<unknown>(`${this.baseUrl}`, form)
      .pipe(map((json) => TimezoneResponse.parse(json)));
  }

  getTimezoneById(id: number): Observable<TimezoneResponse> {
    return this._http.get<unknown>(`${this.baseUrl}/${id}`)
      .pipe(map((json) => TimezoneResponse.parse(json)));
  }

  updateTimezone(id: number, form: TimezoneRequest): Observable<TimezoneResponse> {
    return this._http.put<unknown>(`${this.baseUrl}/${id}`, form)
      .pipe(map((json) => TimezoneResponse.parse(json)));
  }

  deleteTimezone(id: number): Observable<void> {
    return this._http.delete<void>(`${this.baseUrl}/${id}`);
  }

  calculateDate(form: CalculateDateRequest): Observable<CalculateDateResponse> {
    return this._http.post<unknown>(`${this.baseUrl}/calculate-date`, form)
      .pipe(map((json) => CalculateDateResponse.parse(json)));
  }
}
