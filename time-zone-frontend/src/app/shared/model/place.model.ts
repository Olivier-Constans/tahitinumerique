import * as z from 'zod/mini';
import { AuditResponse } from './audit.model';

// Valeurs du champ type, identiques aux discriminants du back (ZoneOffsetFixedPlace.TYPE, ZoneIdPlace.TYPE)
export const ZONE_OFFSET_FIXED = 'ZONE_OFFSET_FIXED';
export const ZONE_ID = 'ZONE_ID';

export const PlaceType = z.enum([ZONE_OFFSET_FIXED, ZONE_ID]);

export type PlaceType = z.infer<typeof PlaceType>;

// Décalage ISO-8601 renvoyé par le back (ZoneOffset Java) : -10:00, +05:45, ou Z pour UTC
export const ZoneOffset = z.string().check(z.regex(/^(Z|[+-]\d{2}:\d{2})$/));

const placeShape = {
  id: z.number(),
  label: z.string(),
  audit: AuditResponse,
};

export const ZoneOffsetFixedPlaceResponse = z.object({
  ...placeShape,
  type: z.literal(ZONE_OFFSET_FIXED),
  zoneOffset: ZoneOffset,
});

export const ZoneIdPlaceResponse = z.object({
  ...placeShape,
  type: z.literal(ZONE_ID),
  zoneId: z.string(),
});

export const PlaceResponse = z.discriminatedUnion('type', [
  ZoneOffsetFixedPlaceResponse,
  ZoneIdPlaceResponse,
]);

export type ZoneOffsetFixedPlaceResponse = z.infer<typeof ZoneOffsetFixedPlaceResponse>;
export type ZoneIdPlaceResponse = z.infer<typeof ZoneIdPlaceResponse>;
export type PlaceResponse = z.infer<typeof PlaceResponse>;

export type PlaceRequest =
  | { type: typeof ZONE_OFFSET_FIXED; label: string; zoneOffset: string }
  | { type: typeof ZONE_ID; label: string; zoneId: string };

export const ZoneIds = z.array(z.string());

export const ZoneOffsets = z.array(ZoneOffset);

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  [ZONE_OFFSET_FIXED]: 'Décalage UTC fixe',
  [ZONE_ID]: 'Zone IANA',
};

// Libellé d'un décalage ISO-8601 : -10:00 devient UTC-10:00, Z devient UTC
export function formatZoneOffset(zoneOffset: string): string {
  return zoneOffset === 'Z' ? 'UTC' : `UTC${zoneOffset}`;
}
