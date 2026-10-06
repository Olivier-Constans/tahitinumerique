import {TimezoneResponse} from "./timezone.model";

export interface CalculateDateItemResponse {
  date: Date;
  timezone: TimezoneResponse;
}
export interface CalculateDateResponse {
  calculateDateItemList: CalculateDateItemResponse[];
}

export interface CalculateDateRequest {
  date: Date;
  timezoneId: number;
}
