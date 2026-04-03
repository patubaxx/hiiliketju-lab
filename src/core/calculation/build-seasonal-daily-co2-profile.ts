import type { MonthlyRelativeWeights12 } from "@/core/domain/scenario";
import {
  NON_LEAP_MONTH_DAYS,
  SCENARIO_PERIOD_DAYS,
  type ResolvedDailyCo2Point,
  mvpDayIndexToCalendar,
  monthIndexForDayIndex,
} from "@/core/domain/temporal";

/**
 * Builds a 365-day CO₂ availability profile for `seasonal_daily` mode.
 *
 * Model:
 * - Fixed non-leap calendar (see `mvpDayIndexToCalendar`).
 * - Annual mass `annualCo2Kg` is split across months by relative weights.
 * - Within each month, mass is spread uniformly across each day of that month.
 *
 * Reconciliation:
 * - Per-day values are computed in floating point.
 * - The final day of the MVP year (dayIndex 364, Dec 31) receives a small adjustment so that
 *   the sum of all daily masses equals `annualCo2Kg` exactly (machine arithmetic).
 *   This avoids systematic bias from floating-point accumulation.
 */
export function buildSeasonalDailyCo2ProfileKg(params: {
  readonly annualCo2Kg: number;
  readonly monthlyRelativeWeights: MonthlyRelativeWeights12;
}): readonly ResolvedDailyCo2Point[] {
  const { annualCo2Kg, monthlyRelativeWeights } = params;
  if (annualCo2Kg < 0) {
    throw new RangeError("annualCo2Kg must be non-negative");
  }
  const sumW = monthlyRelativeWeights.reduce((a, b) => a + b, 0);
  if (sumW <= 0) {
    throw new RangeError("monthlyRelativeWeights must sum to a positive value");
  }

  const monthTotalsKg = monthlyRelativeWeights.map((w) => (annualCo2Kg * w) / sumW);

  const floats: number[] = [];
  for (let d = 0; d < SCENARIO_PERIOD_DAYS; d++) {
    const m = monthIndexForDayIndex(d);
    const daysInMonth = NON_LEAP_MONTH_DAYS[m]!;
    const monthTotal = monthTotalsKg[m]!;
    floats.push(monthTotal / daysInMonth);
  }

  let acc = 0;
  for (let i = 0; i < floats.length - 1; i++) {
    acc += floats[i]!;
  }
  floats[floats.length - 1] = annualCo2Kg - acc;

  const out: ResolvedDailyCo2Point[] = [];
  for (let d = 0; d < SCENARIO_PERIOD_DAYS; d++) {
    const cal = mvpDayIndexToCalendar(d);
    out.push({
      dayIndex: d,
      dateLabel: cal.dateLabel,
      monthIndex: cal.monthIndex,
      dayOfMonth: cal.dayOfMonth,
      availableCO2Kg: floats[d]!,
    });
  }
  return out;
}
