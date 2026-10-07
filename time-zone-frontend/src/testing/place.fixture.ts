import {
  ZONE_ID,
  ZONE_OFFSET_FIXED,
  ZoneIdPlaceResponse,
  ZoneOffsetFixedPlaceResponse,
} from '../app/shared/model/place.model';
import { Page } from '../app/shared/model/page.model';

const audit = () => ({
  createDate: new Date('2026-01-01T10:00:00Z'),
  updateDate: new Date('2026-01-02T10:00:00Z'),
});

export function aPlace(
  overrides: Partial<ZoneOffsetFixedPlaceResponse> = {},
): ZoneOffsetFixedPlaceResponse {
  return {
    id: 1,
    type: ZONE_OFFSET_FIXED,
    label: 'Tahiti',
    zoneOffset: '-10:00',
    audit: audit(),
    ...overrides,
  };
}

export function aZoneIdPlace(overrides: Partial<ZoneIdPlaceResponse> = {}): ZoneIdPlaceResponse {
  return {
    id: 2,
    type: ZONE_ID,
    label: 'Paris',
    zoneId: 'Europe/Paris',
    audit: audit(),
    ...overrides,
  };
}

export function aPage<T>(content: T[], overrides: Partial<Page<T>> = {}): Page<T> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    size: 10,
    ...overrides,
  };
}
