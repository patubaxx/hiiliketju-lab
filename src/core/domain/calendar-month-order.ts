/**
 * 0 = January … 11 = December. Used with `calendar.months.*` i18n keys.
 */
export const CALENDAR_MONTH_ORDER_KEYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export type CalendarMonthMessageKey = (typeof CALENDAR_MONTH_ORDER_KEYS)[number];

export function calendarMonthMessageId(monthIndex0: number): `calendar.months.${CalendarMonthMessageKey}` {
  return `calendar.months.${CALENDAR_MONTH_ORDER_KEYS[monthIndex0]!}`;
}
