import { buildSeasonalDailyCo2ProfileKg } from "@/core/calculation/build-seasonal-daily-co2-profile";
import {
  CO2_MODE_FLAT_ANNUAL,
  CO2_MODE_SEASONAL_DAILY,
  CO2_MODE_TIME_SERIES_DAILY,
  CO2_MODE_TIME_SERIES_HOURLY,
  type Co2Input,
} from "@/core/domain/scenario";
import {
  SCENARIO_HOURLY_SLOTS,
  SCENARIO_PERIOD_DAYS,
  type ResolvedDailyCo2Point,
  mvpDayIndexToCalendar,
} from "@/core/domain/temporal";
import { annualCo2KtPerYearToKgPerYear } from "@/core/domain/units";

/**
 * Series length guard. Keep behavior aligned with the duplicate in `resolve-electricity-price-series.ts`
 * so CO₂ and electricity validation stay consistent for maintainers.
 */
function assertDailySeriesLength(name: string, values: readonly number[], expected: number): void {
  if (values.length !== expected) {
    throw new RangeError(`${name} must have length ${expected}, got ${values.length}`);
  }
}

/**
 * Non-negativity / finiteness guard. Mirrored in `resolve-electricity-price-series.ts` — change both if rules evolve.
 */
function assertNonNegativeFinite(name: string, values: readonly number[]): void {
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (!Number.isFinite(v) || v < 0) {
      throw new RangeError(`${name}[${i}] must be finite and non-negative`);
    }
  }
}

/**
 * Hourly CO₂ mass (kg per hour, length 8760) → daily kg/day by summing each calendar day’s 24 hours.
 * Sum preserves total annual CO₂ mass when moving from hourly availability to the daily-first engine.
 */
function aggregateHourlyCo2ToDailyKg(hourlyKg: readonly number[]): number[] {
  const daily: number[] = [];
  for (let d = 0; d < SCENARIO_PERIOD_DAYS; d++) {
    let sum = 0;
    const base = d * 24;
    for (let h = 0; h < 24; h++) {
      sum += hourlyKg[base + h]!;
    }
    daily.push(sum);
  }
  return daily;
}

/**
 * Resolve CO₂ availability to canonical kg/day for each MVP day (always 365 rows; see `SCENARIO_PERIOD_DAYS`).
 * Annual kt/year on `co2` is converted to kg/year, then distributed or read per mode below.
 */
export function resolveCo2Series(co2: Co2Input): readonly ResolvedDailyCo2Point[] {
  const annualCo2Kg = annualCo2KtPerYearToKgPerYear(co2.annualAmountKtPerYear);

  switch (co2.availability.mode) {
    /** No extra series: uniform kg/day = annual kg / 365. */
    case CO2_MODE_FLAT_ANNUAL: {
      const perDay = annualCo2Kg / SCENARIO_PERIOD_DAYS;
      const out: ResolvedDailyCo2Point[] = [];
      for (let d = 0; d < SCENARIO_PERIOD_DAYS; d++) {
        const cal = mvpDayIndexToCalendar(d);
        out.push({
          dayIndex: d,
          dateLabel: cal.dateLabel,
          monthIndex: cal.monthIndex,
          dayOfMonth: cal.dayOfMonth,
          availableCO2Kg: perDay,
        });
      }
      return out;
    }
    /** Twelve relative weights → monthly masses → uniform kg/day within each month (non-leap calendar). */
    case CO2_MODE_SEASONAL_DAILY: {
      return buildSeasonalDailyCo2ProfileKg({
        annualCo2Kg,
        monthlyRelativeWeights: co2.availability.monthlyRelativeWeights,
      });
    }
    /** Input: `dailyAvailableCo2Kg` length 365 (kg/day). No harmonization beyond validation. */
    case CO2_MODE_TIME_SERIES_DAILY: {
      const series = co2.availability.dailyAvailableCo2Kg;
      assertDailySeriesLength("dailyAvailableCo2Kg", series, SCENARIO_PERIOD_DAYS);
      assertNonNegativeFinite("dailyAvailableCo2Kg", series);
      const out: ResolvedDailyCo2Point[] = [];
      for (let d = 0; d < SCENARIO_PERIOD_DAYS; d++) {
        const cal = mvpDayIndexToCalendar(d);
        out.push({
          dayIndex: d,
          dateLabel: cal.dateLabel,
          monthIndex: cal.monthIndex,
          dayOfMonth: cal.dayOfMonth,
          availableCO2Kg: series[d]!,
        });
      }
      return out;
    }
    /**
     * Input: `hourlyAvailableCo2Kg` length 8760 (kg CO₂ per hour). Harmonization: sum each day’s 24 hours → kg/day
     * (conserves mass into the daily engine).
     */
    case CO2_MODE_TIME_SERIES_HOURLY: {
      const hourly = co2.availability.hourlyAvailableCo2Kg;
      assertDailySeriesLength("hourlyAvailableCo2Kg", hourly, SCENARIO_HOURLY_SLOTS);
      assertNonNegativeFinite("hourlyAvailableCo2Kg", hourly);
      const dailyKg = aggregateHourlyCo2ToDailyKg(hourly);
      const out: ResolvedDailyCo2Point[] = [];
      for (let d = 0; d < SCENARIO_PERIOD_DAYS; d++) {
        const cal = mvpDayIndexToCalendar(d);
        out.push({
          dayIndex: d,
          dateLabel: cal.dateLabel,
          monthIndex: cal.monthIndex,
          dayOfMonth: cal.dayOfMonth,
          availableCO2Kg: dailyKg[d]!,
        });
      }
      return out;
    }
    default: {
      const _exhaustive: never = co2.availability;
      return _exhaustive;
    }
  }
}
