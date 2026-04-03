import {
  ELECTRICITY_MODE_CONSTANT,
  ELECTRICITY_MODE_DAILY_SERIES,
  ELECTRICITY_MODE_HISTORICAL_IMPORTED,
  ELECTRICITY_MODE_HOURLY_SERIES,
  type ElectricityPriceInput,
} from "@/core/domain/scenario";
import {
  SCENARIO_HOURLY_SLOTS,
  SCENARIO_PERIOD_DAYS,
  type ResolvedDailyElectricityPricePoint,
  mvpDayIndexToCalendar,
} from "@/core/domain/temporal";

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

function aggregateHourlyPricesToDailyMean(eurPerMwh: readonly number[]): number[] {
  const daily: number[] = [];
  for (let d = 0; d < SCENARIO_PERIOD_DAYS; d++) {
    let sum = 0;
    const base = d * 24;
    for (let h = 0; h < 24; h++) {
      sum += eurPerMwh[base + h]!;
    }
    daily.push(sum / 24);
  }
  return daily;
}

function mapDailyPrices(prices: readonly number[]): readonly ResolvedDailyElectricityPricePoint[] {
  const out: ResolvedDailyElectricityPricePoint[] = [];
  for (let d = 0; d < SCENARIO_PERIOD_DAYS; d++) {
    const cal = mvpDayIndexToCalendar(d);
    out.push({
      dayIndex: d,
      dateLabel: cal.dateLabel,
      electricityPriceEurPerMWh: prices[d]!,
    });
  }
  return out;
}

/**
 * Resolve electricity price to one EUR/MWh value per MVP day (365 rows).
 */
export function resolveElectricityPriceSeries(
  electricity: ElectricityPriceInput,
): readonly ResolvedDailyElectricityPricePoint[] {
  switch (electricity.mode) {
    case ELECTRICITY_MODE_CONSTANT: {
      const p = electricity.priceEurPerMwh;
      if (!Number.isFinite(p) || p < 0) {
        throw new RangeError("Constant electricity price must be finite and non-negative");
      }
      return mapDailyPrices(Array.from({ length: SCENARIO_PERIOD_DAYS }, () => p));
    }
    case ELECTRICITY_MODE_DAILY_SERIES: {
      const series = electricity.dailyPricesEurPerMwh;
      assertDailySeriesLength("dailyPricesEurPerMwh", series, SCENARIO_PERIOD_DAYS);
      assertNonNegativeFinite("dailyPricesEurPerMwh", series);
      return mapDailyPrices(series);
    }
    case ELECTRICITY_MODE_HOURLY_SERIES: {
      const hourly = electricity.hourlyPricesEurPerMwh;
      assertDailySeriesLength("hourlyPricesEurPerMwh", hourly, SCENARIO_HOURLY_SLOTS);
      assertNonNegativeFinite("hourlyPricesEurPerMwh", hourly);
      return mapDailyPrices(aggregateHourlyPricesToDailyMean(hourly));
    }
    case ELECTRICITY_MODE_HISTORICAL_IMPORTED: {
      if (electricity.resolution === "daily") {
        const series = electricity.pricesEurPerMwh;
        assertDailySeriesLength("historical prices (daily)", series, SCENARIO_PERIOD_DAYS);
        assertNonNegativeFinite("historical prices (daily)", series);
        return mapDailyPrices(series);
      }
      const hourly = electricity.pricesEurPerMwh;
      assertDailySeriesLength("historical prices (hourly)", hourly, SCENARIO_HOURLY_SLOTS);
      assertNonNegativeFinite("historical prices (hourly)", hourly);
      return mapDailyPrices(aggregateHourlyPricesToDailyMean(hourly));
    }
    default: {
      const _exhaustive: never = electricity;
      return _exhaustive;
    }
  }
}
