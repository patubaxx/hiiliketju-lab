/** Harmonized / resolved CO₂ mass available per day (internal canonical unit: kg/day). */
export type ResolvedDailyCo2Point = {
  readonly dayIndex: number;
  readonly dateLabel: string;
  readonly monthIndex: number;
  readonly dayOfMonth: number;
  readonly availableCO2Kg: number;
};

/** Harmonized / resolved electricity price per day (EUR/MWh). */
export type ResolvedDailyElectricityPricePoint = {
  readonly dayIndex: number;
  readonly dateLabel: string;
  readonly electricityPriceEurPerMWh: number;
};

/** MVP fixed horizon (non-leap year). */
export const SCENARIO_PERIOD_DAYS = 365 as const;
export type ScenarioPeriodDays = typeof SCENARIO_PERIOD_DAYS;

/** Hourly slots in the MVP 365-day window (365 × 24). */
export const SCENARIO_HOURLY_SLOTS = 8760 as const;

/**
 * Days per calendar month for a non-leap year (Jan..Dec).
 * Used for seasonal_daily distribution and calendar indexing.
 */
export const NON_LEAP_MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

/** Cumulative day index at start of each month (0-based month index). */
export const MONTH_START_DAY_INDEX: readonly number[] = (() => {
  const starts: number[] = [];
  let acc = 0;
  for (let m = 0; m < 12; m++) {
    starts.push(acc);
    acc += NON_LEAP_MONTH_DAYS[m]!;
  }
  return starts;
})();

export type CalendarCoords = {
  readonly monthIndex: number;
  readonly dayOfMonth: number;
  /** ISO date label (YYYY-MM-DD) for a fixed non-leap reference year. */
  readonly dateLabel: string;
};

const MVP_CALENDAR_YEAR = 2023;

/**
 * Map linear day index 0..364 to calendar coordinates in a fixed non-leap year.
 * Deterministic for harmonization and exports.
 */
export function mvpDayIndexToCalendar(dayIndex: number): CalendarCoords {
  if (dayIndex < 0 || dayIndex >= SCENARIO_PERIOD_DAYS) {
    throw new RangeError(`dayIndex must be in [0, ${SCENARIO_PERIOD_DAYS - 1}], got ${dayIndex}`);
  }
  for (let m = 11; m >= 0; m--) {
    const start = MONTH_START_DAY_INDEX[m]!;
    if (dayIndex >= start) {
      const dayOfMonth = dayIndex - start + 1;
      const mm = String(m + 1).padStart(2, "0");
      const dd = String(dayOfMonth).padStart(2, "0");
      return {
        monthIndex: m,
        dayOfMonth,
        dateLabel: `${MVP_CALENDAR_YEAR}-${mm}-${dd}`,
      };
    }
  }
  throw new Error("unreachable: dayIndex not in any month");
}

/**
 * @returns monthIndex 0..11 for a day index 0..364.
 */
export function monthIndexForDayIndex(dayIndex: number): number {
  return mvpDayIndexToCalendar(dayIndex).monthIndex;
}

export function buildEmptyResolvedDailyCo2Series(
  mapMass: (dayIndex: number, cal: CalendarCoords) => number,
): readonly ResolvedDailyCo2Point[] {
  const out: ResolvedDailyCo2Point[] = [];
  for (let d = 0; d < SCENARIO_PERIOD_DAYS; d++) {
    const cal = mvpDayIndexToCalendar(d);
    out.push({
      dayIndex: d,
      dateLabel: cal.dateLabel,
      monthIndex: cal.monthIndex,
      dayOfMonth: cal.dayOfMonth,
      availableCO2Kg: mapMass(d, cal),
    });
  }
  return out;
}
