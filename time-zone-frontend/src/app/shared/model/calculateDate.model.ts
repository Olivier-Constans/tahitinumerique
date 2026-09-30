import {TimezoneResponse} from "./timezone.model";

export interface CaculateDateItemResponse {
  date: Date;
  timezone: TimezoneResponse;
}
export interface CaculateDateResponse {
  calculateDateItemList: CaculateDateItemResponse[];
}

export interface CaculateDateResquest {
  date: Date;
  timezoneId: number;
}
