import { TimezoneResponse } from '../app/shared/model/timezone.model';
import { Page } from '../app/shared/model/page.model';

export function aTimezone(overrides: Partial<TimezoneResponse> = {}): TimezoneResponse {
  return {
    id: 1,
    label: 'Tahiti',
    offsetUTC: 'UTC-10',
    audit: {
      createDate: new Date('2026-01-01T10:00:00Z'),
      updateDate: new Date('2026-01-02T10:00:00Z'),
    },
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
