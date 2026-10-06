import {toDate, toUTCDate, transformToUTCDate} from "./date.function";

describe('date.function', () => {

  describe('toDate', () => {
    it('tronque les décimales au-delà de la milliseconde', () => {
      const date = toDate('2026-10-06T10:15:30.123456789Z');

      expect(date.getTime()).toBe(Date.UTC(2026, 9, 6, 10, 15, 30, 123));
    });

    it("interprète une date sans fuseau (LocalDateTime) en heure locale", () => {
      const date = toDate('2026-10-06T10:15:30');

      expect(date).toEqual(new Date(2026, 9, 6, 10, 15, 30));
    });
  });

  describe('transformToUTCDate', () => {
    it("conserve l'heure murale en UTC et met les millisecondes à zéro", () => {
      const date = transformToUTCDate(new Date(2026, 9, 6, 10, 15, 30, 500));

      expect(date.toISOString()).toBe('2026-10-06T10:15:30.000Z');
    });
  });

  describe('toUTCDate', () => {
    it("parse une date locale puis la convertit en UTC à l'identique", () => {
      expect(toUTCDate('2026-10-06T10:15:30.987654').toISOString()).toBe('2026-10-06T10:15:30.000Z');
    });
  });
});
