import * as z from "zod/mini";
import {AuditResponse} from "./audit.model";
import {OffsetUTC} from "./offsetUTC.model";

export const TimezoneResponse = z.object({
  id: z.number(),
  label: z.string(),
  offsetUTC: OffsetUTC,
  audit: AuditResponse
});

export type TimezoneResponse = z.infer<typeof TimezoneResponse>;

export interface TimezoneRequest {
  label: string;
  offsetUTC: OffsetUTC;
}
