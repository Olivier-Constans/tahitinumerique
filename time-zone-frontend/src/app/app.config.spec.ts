import {TestBed} from '@angular/core/testing';
import {LOCALE_ID} from "@angular/core";
import {DatePipe} from "@angular/common";
import {appConfig} from "./app.config";

describe('appConfig', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({providers: appConfig.providers});
  });

  it('utilise la locale française pour les pipes', () => {
    const locale = TestBed.inject(LOCALE_ID);

    expect(locale).toBe('fr');
    expect(new DatePipe(locale).transform(new Date(2026, 9, 6), 'EEEE d MMMM')).toBe('mardi 6 octobre');
  });
});
