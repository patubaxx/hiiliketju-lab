import type { AssumptionSource, AssumptionStatus } from "@/core/domain/assumptions";
import { SCENARIO_HOURLY_SLOTS, SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";

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
  | { mode: "constant"; priceEurPerMwh: string }
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

export type ScenarioFormState = {
  scenarioName: string;
  annualAmountKtPerYear: string;
  utilizationRatePct: string;
  assumptionsVersion: string;
  assumptionsNotes: string;
  co2: Co2FormBranch;
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
  process: Record<ProcessSchemaKey, ProcessFieldFormState>;
};

const defaultProcessField = (): ProcessFieldFormState => ({
  override: false,
  value: "",
  assumptionSource: "customer_provided",
  assumptionStatus: "confirmed",
  assumptionNote: "",
});

export const PROCESS_FIELD_ORDER: readonly {
  key: ProcessSchemaKey;
  labelId:
    | "advanced.field_stoichH2"
    | "advanced.field_stoichCh4"
    | "advanced.field_secKwh"
    | "advanced.field_secMwh"
    | "advanced.field_plantAvail"
    | "advanced.field_processEff";
}[] = [
  { key: "stoichiometricHydrogenDemandFactorKgH2PerKgCo2", labelId: "advanced.field_stoichH2" },
  { key: "stoichiometricMethaneYieldFactorKgCh4PerKgCo2", labelId: "advanced.field_stoichCh4" },
  { key: "electrolyzerSpecificEnergyConsumptionKwhPerKgH2", labelId: "advanced.field_secKwh" },
  { key: "electrolyzerSpecificEnergyConsumptionMwhPerKgH2", labelId: "advanced.field_secMwh" },
  { key: "plantAvailabilityPct", labelId: "advanced.field_plantAvail" },
  { key: "processEfficiencyPct", labelId: "advanced.field_processEff" },
];

export function createInitialFormState(): ScenarioFormState {
  const process = {} as Record<ProcessSchemaKey, ProcessFieldFormState>;
  for (const { key } of PROCESS_FIELD_ORDER) {
    process[key] = defaultProcessField();
  }
  return {
    scenarioName: "New scenario",
    annualAmountKtPerYear: "1",
    utilizationRatePct: "100",
    assumptionsVersion: "HIILIKETJU_ASSUMPTIONS_v2_2026-04",
    assumptionsNotes: "",
    co2: { mode: "flat_annual" },
    electricity: { mode: "constant", priceEurPerMwh: "80" },
    economics: {
      methanePriceEurPerTch4: "120",
      hydrogenPriceEurPerKg: "6",
      otherOpexEurPerYear: "0",
      includeCapex: false,
      electrolyzerCapexEur: "",
      methanationCapexEur: "",
      capexLifetimeYears: "20",
    },
    process,
  };
}

export function defaultCo2Branch(mode: Co2AvailabilityModeForm): Co2FormBranch {
  switch (mode) {
    case "flat_annual":
      return { mode: "flat_annual" };
    case "seasonal_daily":
      return { mode: "seasonal_daily", monthlyWeights: Array.from({ length: 12 }, () => "1") };
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
      return { mode: "constant", priceEurPerMwh: "80" };
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
        seriesText: Array.from({ length: SCENARIO_PERIOD_DAYS }, () => "50").join("\n"),
      };
    default: {
      const _e: never = mode;
      return _e;
    }
  }
}
