import * as z from "zod/mini";
import {toDate} from "../service/date.function";

export const isoDate = z.pipe(z.string(), z.transform(toDate));

export const AuditResponse = z.object({
  createDate: isoDate,
  updateDate: isoDate
});

export type AuditResponse = z.infer<typeof AuditResponse>;
