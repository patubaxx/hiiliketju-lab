import type { ProcessAssumptionsInput } from "./assumptions";
import { defaultProcessAssumptionsInput } from "./assumptions";
import type { ScenarioPeriodDays } from "./temporal";

export { SCENARIO_PERIOD_DAYS, type ScenarioPeriodDays } from "./temporal";

export const CO2_MODE_FLAT_ANNUAL = "flat_annual" as const;
export const CO2_MODE_SEASONAL_DAILY = "seasonal_daily" as const;
export const CO2_MODE_TIME_SERIES_DAILY = "time_series_daily" as const;
export const CO2_MODE_TIME_SERIES_HOURLY = "time_series_hourly" as const;

export type Co2AvailabilityMode =
  | typeof CO2_MODE_FLAT_ANNUAL
  | typeof CO2_MODE_SEASONAL_DAILY
  | typeof CO2_MODE_TIME_SERIES_DAILY
  | typeof CO2_MODE_TIME_SERIES_HOURLY;

/**
 * Twelve monthly relative weights for `seasonal_daily` (zeros allowed; not all-zero).
 * Distributes annual CO₂ mass across days using month boundaries (non-leap year).
 */
export type MonthlyRelativeWeights12 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export type Co2AvailabilityInput =
  | { readonly mode: typeof CO2_MODE_FLAT_ANNUAL }
  | {
      readonly mode: typeof CO2_MODE_SEASONAL_DAILY;
      readonly monthlyRelativeWeights: MonthlyRelativeWeights12;
    }
  | {
      readonly mode: typeof CO2_MODE_TIME_SERIES_DAILY;
      /** One value per MVP day (365), kg/day available CO₂. */
      readonly dailyAvailableCo2Kg: readonly number[];
    }
  | {
      readonly mode: typeof CO2_MODE_TIME_SERIES_HOURLY;
      /** One value per hour in the MVP window (8760), kg CO₂ per hour; harmonized to daily via sum. */
      readonly hourlyAvailableCo2Kg: readonly number[];
    };

/** User-facing annual CO₂ + utilization + temporal availability contract. */
export type Co2Input = {
  /** kt/year (locked MVP UI default). */
  readonly annualAmountKtPerYear: number;
  readonly utilizationRatePct: number;
  readonly availability: Co2AvailabilityInput;
};

export const ELECTRICITY_MODE_CONSTANT = "constant" as const;
export const ELECTRICITY_MODE_DAILY_SERIES = "daily_series" as const;
export const ELECTRICITY_MODE_HOURLY_SERIES = "hourly_series" as const;
export const ELECTRICITY_MODE_HISTORICAL_IMPORTED = "historical_market_data_imported" as const;

export type ElectricityPriceMode =
  | typeof ELECTRICITY_MODE_CONSTANT
  | typeof ELECTRICITY_MODE_DAILY_SERIES
  | typeof ELECTRICITY_MODE_HOURLY_SERIES
  | typeof ELECTRICITY_MODE_HISTORICAL_IMPORTED;

export type ElectricityPriceInput =
  | {
      readonly mode: typeof ELECTRICITY_MODE_CONSTANT;
      readonly priceEurPerMwh: number;
    }
  | {
      readonly mode: typeof ELECTRICITY_MODE_DAILY_SERIES;
      /** One price per MVP day (365), EUR/MWh. */
      readonly dailyPricesEurPerMwh: readonly number[];
    }
  | {
      readonly mode: typeof ELECTRICITY_MODE_HOURLY_SERIES;
      /** One price per hour (8760), EUR/MWh; harmonized to daily via arithmetic mean. */
      readonly hourlyPricesEurPerMwh: readonly number[];
    }
  | {
      readonly mode: typeof ELECTRICITY_MODE_HISTORICAL_IMPORTED;
      readonly resolution: "daily" | "hourly";
      /**
       * Daily: length 365. Hourly: length 8760. Values are EUR/MWh in MVP window order; any gap-filling or
       * alignment of raw market data must happen before this wire shape is produced.
       */
      readonly pricesEurPerMwh: readonly number[];
    };

export type EconomicsInput = {
  /** EUR/t_CH4 */
  readonly methanePriceEurPerTch4: number;
  /** EUR/kg_H2 */
  readonly hydrogenPriceEurPerKg: number;
  readonly otherOpexEurPerYear: number;
  readonly includeCapex: boolean;
  /** Required when includeCapex is true (may be 0). */
  readonly electrolyzerCapexEur?: number;
  /** Required when includeCapex is true (may be 0). */
  readonly methanationCapexEur?: number;
  /** Required when includeCapex is true. */
  readonly capexLifetimeYears?: number;
};

export type AssumptionsMeta = {
  readonly assumptionsVersion: string;
  readonly notes?: string;
};

export type ScenarioInput = {
  readonly scenarioName: string;
  readonly periodDays: ScenarioPeriodDays;
  readonly co2: Co2Input;
  readonly electricity: ElectricityPriceInput;
  readonly economics: EconomicsInput;
  readonly process: ProcessAssumptionsInput;
  readonly assumptionsMeta: AssumptionsMeta;
};

/** Merge partial process overrides with literature-based MVP defaults. */
export function mergeProcessAssumptionsInput(
  partial?: Partial<ProcessAssumptionsInput>,
): ProcessAssumptionsInput {
  const base = defaultProcessAssumptionsInput();
  if (!partial) return base;
  return {
    stoichiometricHydrogenDemandFactorKgH2PerKgCo2:
      partial.stoichiometricHydrogenDemandFactorKgH2PerKgCo2 ??
      base.stoichiometricHydrogenDemandFactorKgH2PerKgCo2,
    stoichiometricMethaneYieldFactorKgCh4PerKgCo2:
      partial.stoichiometricMethaneYieldFactorKgCh4PerKgCo2 ??
      base.stoichiometricMethaneYieldFactorKgCh4PerKgCo2,
    electrolyzerSpecificEnergyConsumptionKwhPerKgH2:
      partial.electrolyzerSpecificEnergyConsumptionKwhPerKgH2 ??
      base.electrolyzerSpecificEnergyConsumptionKwhPerKgH2,
    electrolyzerSpecificEnergyConsumptionMwhPerKgH2:
      partial.electrolyzerSpecificEnergyConsumptionMwhPerKgH2 ??
      base.electrolyzerSpecificEnergyConsumptionMwhPerKgH2,
    plantAvailabilityPct: partial.plantAvailabilityPct ?? base.plantAvailabilityPct,
    processEfficiencyPct: partial.processEfficiencyPct ?? base.processEfficiencyPct,
  };
}

// Re-export for convenience
export type { ProcessAssumptionsInput };
