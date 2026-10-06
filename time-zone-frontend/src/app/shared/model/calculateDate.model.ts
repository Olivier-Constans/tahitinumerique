import {TimezoneResponse} from "./timezone.model";

export interface CalculateDateItemResponse {
  date: Date;
  timezone: TimezoneResponse;
}
export interface CalculateDateResponse {
  calculateDateItemList: CalculateDateItemResponse[];
}

export interface CalculateDateResquest {
  date: Date;
  timezoneId: number;
}
