import {toDate} from "../service/date.function";

export interface AuditResponse {
  createDate: Date;
  updateDate: Date;
}

export interface AuditableResponse {
  audit: AuditResponse;
}

export function auditResponseTransform<T extends AuditableResponse>(data: T): T {
  data.audit.createDate = toDate((data.audit.createDate as unknown) as string);
  data.audit.updateDate = toDate((data.audit.updateDate as unknown) as string);
  return data;
}
