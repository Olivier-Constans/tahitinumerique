import * as z from 'zod/mini';
import { PlaceResponse } from './place.model';
import { isoDate } from './date.model';

export const CalculateDateItemResponse = z.object({
  date: isoDate,
  place: PlaceResponse,
});

export type CalculateDateItemResponse = z.infer<typeof CalculateDateItemResponse>;

export const CalculateDateResponse = z.object({
  calculateDateItemList: z.array(CalculateDateItemResponse),
});

export type CalculateDateResponse = z.infer<typeof CalculateDateResponse>;

export interface CalculateDateRequest {
  date: Date;
  placeId: number;
}
