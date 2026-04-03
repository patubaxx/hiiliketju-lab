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

function assertDailySeriesLength(name: string, values: readonly number[], expected: number): void {
  if (values.length !== expected) {
    throw new RangeError(`${name} must have length ${expected}, got ${values.length}`);
  }
}

function assertNonNegativeFinite(name: string, values: readonly number[]): void {
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (!Number.isFinite(v) || v < 0) {
      throw new RangeError(`${name}[${i}] must be finite and non-negative`);
    }
  }
}

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
 * Resolve CO₂ availability to canonical `kg/day` for each MVP day (365 rows).
 */
export function resolveCo2Series(co2: Co2Input): readonly ResolvedDailyCo2Point[] {
  const annualCo2Kg = annualCo2KtPerYearToKgPerYear(co2.annualAmountKtPerYear);

  switch (co2.availability.mode) {
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
    case CO2_MODE_SEASONAL_DAILY: {
      return buildSeasonalDailyCo2ProfileKg({
        annualCo2Kg,
        monthlyRelativeWeights: co2.availability.monthlyRelativeWeights,
      });
    }
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
