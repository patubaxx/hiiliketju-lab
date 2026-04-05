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

/**
 * Series length guard. Keep behavior aligned with `resolve-co2-series.ts` so temporal validation stays consistent.
 */
function assertDailySeriesLength(name: string, values: readonly number[], expected: number): void {
  if (values.length !== expected) {
    throw new RangeError(`${name} must have length ${expected}, got ${values.length}`);
  }
}

/** Finiteness only; EUR/MWh series may be negative (e.g. spot prices). */
function assertFiniteSeries(name: string, values: readonly number[]): void {
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (!Number.isFinite(v)) {
      throw new RangeError(`${name}[${i}] must be finite`);
    }
  }
}

/**
 * Hourly EUR/MWh (length 8760) → one representative daily EUR/MWh per calendar day using the arithmetic mean
 * of that day’s 24 hours. Mean matches “typical price for the day” for costing MWh that are also summed daily;
 * it does not sum prices (which would be the wrong unit logic for an intensity).
 */
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
 * Resolve electricity to one EUR/MWh value per MVP day (always 365 rows). Hourly-capable modes supply 8760
 * prices and are harmonized to daily via arithmetic mean per calendar day (see `aggregateHourlyPricesToDailyMean`).
 */
export function resolveElectricityPriceSeries(
  electricity: ElectricityPriceInput,
): readonly ResolvedDailyElectricityPricePoint[] {
  switch (electricity.mode) {
    /** Single scalar repeated for each day. */
    case ELECTRICITY_MODE_CONSTANT: {
      const p = electricity.priceEurPerMwh;
      if (!Number.isFinite(p) || p < 0) {
        throw new RangeError("Constant electricity price must be finite and non-negative");
      }
      return mapDailyPrices(Array.from({ length: SCENARIO_PERIOD_DAYS }, () => p));
    }
    /** Input: `dailyPricesEurPerMwh` length 365. */
    case ELECTRICITY_MODE_DAILY_SERIES: {
      const series = electricity.dailyPricesEurPerMwh;
      assertDailySeriesLength("dailyPricesEurPerMwh", series, SCENARIO_PERIOD_DAYS);
      assertFiniteSeries("dailyPricesEurPerMwh", series);
      return mapDailyPrices(series);
    }
    /**
     * Input: `hourlyPricesEurPerMwh` length 8760. Harmonization: arithmetic mean of each day’s 24 hourly prices
     * → one daily EUR/MWh (MVP policy; see also domain constants).
     */
    case ELECTRICITY_MODE_HOURLY_SERIES: {
      const hourly = electricity.hourlyPricesEurPerMwh;
      assertDailySeriesLength("hourlyPricesEurPerMwh", hourly, SCENARIO_HOURLY_SLOTS);
      assertFiniteSeries("hourlyPricesEurPerMwh", hourly);
      return mapDailyPrices(aggregateHourlyPricesToDailyMean(hourly));
    }
    /**
     * Imported market series: `resolution` selects whether `pricesEurPerMwh` is length 365 (daily) or 8760 (hourly).
     * Hourly branch uses the same daily arithmetic-mean harmonization as `hourly_series`. Upstream data cleaning
     * (gaps, timezone alignment) is out of scope here; this layer only validates and maps.
     */
    case ELECTRICITY_MODE_HISTORICAL_IMPORTED: {
      if (electricity.resolution === "daily") {
        const series = electricity.pricesEurPerMwh;
        assertDailySeriesLength("historical prices (daily)", series, SCENARIO_PERIOD_DAYS);
        assertFiniteSeries("historical prices (daily)", series);
        return mapDailyPrices(series);
      }
      const hourly = electricity.pricesEurPerMwh;
      assertDailySeriesLength("historical prices (hourly)", hourly, SCENARIO_HOURLY_SLOTS);
      assertFiniteSeries("historical prices (hourly)", hourly);
      return mapDailyPrices(aggregateHourlyPricesToDailyMean(hourly));
    }
    default: {
      const _exhaustive: never = electricity;
      return _exhaustive;
    }
  }
}
