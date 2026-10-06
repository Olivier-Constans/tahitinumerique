import { inject, Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {TimezoneRequest, TimezoneResponse} from "../model/timezone.model";
import {Page} from "../model/page.model";
import {auditResponseTransform} from "../model/audit.model";
import {CaculateDateResponse, CaculateDateResquest} from "../model/calculateDate.model";
import {toDate} from "./date.function";

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
    return this._http.get<Page<TimezoneResponse>>(`${this.baseUrl}`, { params })
      .pipe(map((page) => {
        page.content.forEach(auditResponseTransform)
        return page
      }));
  }

  createTimezone(form: TimezoneRequest): Observable<TimezoneResponse> {
    return this._http.post<TimezoneResponse>(`${this.baseUrl}`, form)
      .pipe(map(auditResponseTransform));
  }

  getTimezoneById(id: number): Observable<TimezoneResponse> {
    return this._http.get<TimezoneResponse>(`${this.baseUrl}/${id}`)
      .pipe(map(auditResponseTransform));
  }

  updateTimezone(id: number, form: TimezoneRequest): Observable<TimezoneResponse> {
    return this._http.put<TimezoneResponse>(`${this.baseUrl}/${id}`, form)
      .pipe(map(auditResponseTransform));
  }

  deleteTimezone(id: number): Observable<void> {
    return this._http.delete<void>(`${this.baseUrl}/${id}`);
  }

  calculateDate(form: CaculateDateResquest): Observable<CaculateDateResponse> {
    return this._http.post<CaculateDateResponse>(`${this.baseUrl}/calculate-date`, form).pipe(
      map((data) => {
        data.calculateDateItemList.forEach((it) => {
          it.date = toDate(it.date as unknown as string)
        })
        return data
      }))
  }
}
