import { DateTime } from 'luxon';
export class DateUtil {
  private constructor() {}

  static get now(): Date {
    return DateTime.utc().toJSDate();
  }
}
