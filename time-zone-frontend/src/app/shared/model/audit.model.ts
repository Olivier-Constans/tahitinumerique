import * as z from "zod/mini";
import {isoDate} from "./date.model";

export const AuditResponse = z.object({
  createDate: isoDate,
  updateDate: isoDate
});

export type AuditResponse = z.infer<typeof AuditResponse>;
