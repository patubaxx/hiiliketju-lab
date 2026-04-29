import type { AssumptionSource, AssumptionStatus } from "@/core/domain/assumptions";
import { defaultProcessAssumptionsInput } from "@/core/domain/assumptions";
import { isUserFacingActiveProcessAssumptionKey } from "@/core/domain/user-facing-process-assumptions";
import type {
  AnnualCo2InputDisplayUnit,
  ElectricityPriceInputDisplayUnit,
} from "@/core/domain/input-display-unit-conversions";
import { defaultSeasonalMonthlyWeightFormStrings } from "@/core/domain/seasonal-co2-default-weights";
import { SCENARIO_HOURLY_SLOTS, SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";
import {
  FINLAND_2025_DAILY_EUR_PER_MWH,
  FINLAND_2025_HOURLY_EUR_PER_MWH,
} from "@/data/electricity-defaults-2025-fi";
import { parseFiniteNumber } from "@/features/scenario/input-ui/parse-number-series";

export type { AnnualCo2InputDisplayUnit, ElectricityPriceInputDisplayUnit };
export { FINLAND_2025_DAILY_EUR_PER_MWH, FINLAND_2025_HOURLY_EUR_PER_MWH };

export type Co2AvailabilityModeForm =
  | "flat_annual"
  | "seasonal_daily"
  | "time_series_daily"
  | "time_series_hourly";

export type ElectricityModeForm =
  | "constant"
  | "daily_series"
  | "hourly_series"
  | "historical_market_data_imported";

export type Co2FormBranch =
  | { mode: "flat_annual" }
  | { mode: "seasonal_daily"; monthlyWeights: string[] }
  | { mode: "time_series_daily"; seriesText: string }
  | { mode: "time_series_hourly"; seriesText: string };

export type ElectricityFormBranch =
  | { mode: "constant"; priceEurPerMwh: string; priceDisplayUnit: ElectricityPriceInputDisplayUnit }
  | { mode: "daily_series"; seriesText: string }
  | { mode: "hourly_series"; seriesText: string }
  | { mode: "historical_market_data_imported"; resolution: "daily" | "hourly"; seriesText: string };

export type ProcessSchemaKey =
  | "stoichiometricHydrogenDemandFactorKgH2PerKgCo2"
  | "stoichiometricMethaneYieldFactorKgCh4PerKgCo2"
  | "electrolyzerSpecificEnergyConsumptionKwhPerKgH2"
  | "electrolyzerSpecificEnergyConsumptionMwhPerKgH2"
  | "plantAvailabilityPct"
  | "processEfficiencyPct";

export type ProcessFieldFormState = {
  override: boolean;
  value: string;
  assumptionSource: AssumptionSource;
  assumptionStatus: AssumptionStatus;
  assumptionNote: string;
};

/**
 * WP28: optional plant capacity caps (electrolyzer kg H₂/day, methanation kg CH₄/day).
 * Empty strings mean "unbounded" (legacy behavior, payload omits the field).
 */
export type PlantCapacityFormState = {
  enabled: boolean;
  electrolyzerMaxH2KgPerDay: string;
  methanationMaxCh4KgPerDay: string;
};

/** WP28: optional market CO₂ top-up. When `enabled === true`, `purchasePriceEurPerTco2` is required. */
export type Co2MarketPurchaseFormState = {
  enabled: boolean;
  purchasePriceEurPerTco2: string;
};

export type ScenarioFormState = {
  scenarioName: string;
  /** Annual CO₂ numeric string in `annualCo2DisplayUnit` (wire remains kt/year after payload build). */
  annualAmountKtPerYear: string;
  annualCo2DisplayUnit: AnnualCo2InputDisplayUnit;
  utilizationRatePct: string;
  assumptionsVersion: string;
  assumptionsNotes: string;
  co2: Co2FormBranch;
  /** WP28: optional market CO₂ purchase (top-up to plant capacity). */
  co2MarketPurchase: Co2MarketPurchaseFormState;
  electricity: ElectricityFormBranch;
  economics: {
    methanePriceEurPerTch4: string;
    hydrogenPriceEurPerKg: string;
    otherOpexEurPerYear: string;
    includeCapex: boolean;
    electrolyzerCapexEur: string;
    methanationCapexEur: string;
    capexLifetimeYears: string;
  };
  /** WP28: optional plant capacity caps. */
  plant: PlantCapacityFormState;
  process: Record<ProcessSchemaKey, ProcessFieldFormState>;
};

/** Factory default assumed sales prices (EUR per unit); setup form initializes to these until edited. */
export const FACTORY_DEFAULT_METHANE_SALES_PRICE_EUR_PER_T_CH4 = 1200;
export const FACTORY_DEFAULT_HYDROGEN_SALES_PRICE_EUR_PER_KG_H2 = 4;

/** True when the field still parses to the factory default (same rule as `buildScenarioPayload` number parse). */
export function isMethanePriceAtFactoryDefault(raw: string): boolean {
  const n = parseFiniteNumber(raw);
  return n === FACTORY_DEFAULT_METHANE_SALES_PRICE_EUR_PER_T_CH4;
}

/** True when the field still parses to the factory default (same rule as `buildScenarioPayload` number parse). */
export function isHydrogenPriceAtFactoryDefault(raw: string): boolean {
  const n = parseFiniteNumber(raw);
  return n === FACTORY_DEFAULT_HYDROGEN_SALES_PRICE_EUR_PER_KG_H2;
}

const DEFAULT_PROCESS_ASSUMPTIONS = defaultProcessAssumptionsInput();

const PROCESS_FIELD_DEFS: readonly {
  key: ProcessSchemaKey;
  labelId:
    | "advanced.field_stoichH2"
    | "advanced.field_stoichCh4"
    | "advanced.field_secKwh"
    | "advanced.field_secMwh"
    | "advanced.field_plantAvail"
    | "advanced.field_processEff";
  unitId:
    | "advanced.unit_stoichH2"
    | "advanced.unit_stoichCh4"
    | "advanced.unit_secKwh"
    | "advanced.unit_secMwh"
    | "advanced.unit_pct";
}[] = [
  {
    key: "stoichiometricHydrogenDemandFactorKgH2PerKgCo2",
    labelId: "advanced.field_stoichH2",
    unitId: "advanced.unit_stoichH2",
  },
  {
    key: "stoichiometricMethaneYieldFactorKgCh4PerKgCo2",
    labelId: "advanced.field_stoichCh4",
    unitId: "advanced.unit_stoichCh4",
  },
  {
    key: "electrolyzerSpecificEnergyConsumptionKwhPerKgH2",
    labelId: "advanced.field_secKwh",
    unitId: "advanced.unit_secKwh",
  },
  {
    key: "electrolyzerSpecificEnergyConsumptionMwhPerKgH2",
    labelId: "advanced.field_secMwh",
    unitId: "advanced.unit_secMwh",
  },
  { key: "plantAvailabilityPct", labelId: "advanced.field_plantAvail", unitId: "advanced.unit_pct" },
  { key: "processEfficiencyPct", labelId: "advanced.field_processEff", unitId: "advanced.unit_pct" },
];

/**
 * All process fields (form + wire), with `showInAdvancedUi` from WP23 active-assumption policy.
 * plant/process efficiency: retained in `process` state but not shown. Derived SEC (MWh): not an input row.
 */
export const PROCESS_FIELD_ORDER: ReadonlyArray<
  (typeof PROCESS_FIELD_DEFS)[number] & { showInAdvancedUi: boolean }
> = PROCESS_FIELD_DEFS.map((row) => ({
  ...row,
  showInAdvancedUi: isUserFacingActiveProcessAssumptionKey(row.key),
}));

const defaultProcessField = (key: ProcessSchemaKey): ProcessFieldFormState => {
  const canonical = DEFAULT_PROCESS_ASSUMPTIONS[key];
  return {
    override: false,
    value: String(canonical.value),
    assumptionSource: canonical.assumptionMeta.assumptionSource,
    assumptionStatus: canonical.assumptionMeta.assumptionStatus,
    assumptionNote: canonical.assumptionMeta.assumptionNote ?? "",
  };
};

export function createInitialFormState(): ScenarioFormState {
  const process = {} as Record<ProcessSchemaKey, ProcessFieldFormState>;
  for (const { key } of PROCESS_FIELD_ORDER) {
    process[key] = defaultProcessField(key);
  }
  return {
    scenarioName: "New scenario",
    annualAmountKtPerYear: "1",
    annualCo2DisplayUnit: "kt_per_year",
    utilizationRatePct: "100",
    assumptionsVersion: "HIILIKETJU_ASSUMPTIONS_v2_2026-04",
    assumptionsNotes: "",
    co2: { mode: "seasonal_daily", monthlyWeights: defaultSeasonalMonthlyWeightFormStrings() },
    electricity: { mode: "constant", priceEurPerMwh: "80", priceDisplayUnit: "eur_per_mwh" },
    economics: {
      methanePriceEurPerTch4: String(FACTORY_DEFAULT_METHANE_SALES_PRICE_EUR_PER_T_CH4),
      hydrogenPriceEurPerKg: String(FACTORY_DEFAULT_HYDROGEN_SALES_PRICE_EUR_PER_KG_H2),
      otherOpexEurPerYear: "0",
      includeCapex: false,
      electrolyzerCapexEur: "",
      methanationCapexEur: "",
      capexLifetimeYears: "20",
    },
    plant: {
      enabled: false,
      electrolyzerMaxH2KgPerDay: "",
      methanationMaxCh4KgPerDay: "",
    },
    co2MarketPurchase: {
      enabled: false,
      purchasePriceEurPerTco2: "80",
    },
    process,
  };
}

export function defaultCo2Branch(mode: Co2AvailabilityModeForm): Co2FormBranch {
  switch (mode) {
    case "flat_annual":
      return { mode: "flat_annual" };
    case "seasonal_daily":
      return { mode: "seasonal_daily", monthlyWeights: defaultSeasonalMonthlyWeightFormStrings() };
    case "time_series_daily":
      return {
        mode: "time_series_daily",
        seriesText: Array.from({ length: SCENARIO_PERIOD_DAYS }, () => "1").join("\n"),
      };
    case "time_series_hourly":
      return {
        mode: "time_series_hourly",
        seriesText: Array.from({ length: SCENARIO_HOURLY_SLOTS }, () => "1").join("\n"),
      };
    default: {
      const _e: never = mode;
      return _e;
    }
  }
}

export function defaultElectricityBranch(mode: ElectricityModeForm): ElectricityFormBranch {
  switch (mode) {
    case "constant":
      return { mode: "constant", priceEurPerMwh: "80", priceDisplayUnit: "eur_per_mwh" };
    case "daily_series":
      return {
        mode: "daily_series",
        seriesText: Array.from({ length: SCENARIO_PERIOD_DAYS }, () => "50").join("\n"),
      };
    case "hourly_series":
      return {
        mode: "hourly_series",
        seriesText: Array.from({ length: SCENARIO_HOURLY_SLOTS }, () => "50").join("\n"),
      };
    case "historical_market_data_imported":
      return {
        mode: "historical_market_data_imported",
        resolution: "daily",
        seriesText: FINLAND_2025_DAILY_EUR_PER_MWH.join("\n"),
      };
    default: {
      const _e: never = mode;
      return _e;
    }
  }
}
