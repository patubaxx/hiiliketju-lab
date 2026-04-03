import type { ScenarioInput } from "./scenario";
import type { ResolvedDailyCo2Point, ResolvedDailyElectricityPricePoint } from "./temporal";

export type { ResolvedDailyCo2Point, ResolvedDailyElectricityPricePoint } from "./temporal";

/**
 * Per-day calculation row (canonical units in field names).
 * Formula population is Agent 2; shape is harmonization/calculation-ready.
 */
export type DailyResult = {
  readonly dayIndex: number;
  readonly dateLabel: string;
  readonly availableCO2Kg: number;
  readonly usableCO2Kg: number;
  readonly hydrogenNeededKg: number;
  readonly methaneProducedKg: number;
  readonly electricityConsumedMwh: number;
  readonly electricityCostEur: number;
  readonly variableCostEur: number;
  readonly allocatedCapexCostEur: number;
  readonly totalCostEur: number;
  readonly methaneRevenueEur: number;
  readonly hydrogenAlternativeRevenueEur: number;
};

/**
 * Aggregated totals for one calendar month within the fixed 365-day year.
 */
export type MonthlySummary = {
  readonly monthIndex: number;
  readonly firstDayIndex: number;
  readonly lastDayIndex: number;
  readonly sums: {
    readonly availableCO2Kg: number;
    readonly usableCO2Kg: number;
    readonly hydrogenNeededKg: number;
    readonly methaneProducedKg: number;
    readonly electricityConsumedMwh: number;
    readonly electricityCostEur: number;
    readonly variableCostEur: number;
    readonly allocatedCapexCostEur: number;
    readonly totalCostEur: number;
    readonly methaneRevenueEur: number;
    readonly hydrogenAlternativeRevenueEur: number;
  };
};

/** Annual KPI block (solution / calc specs). */
export type ScenarioSummary = {
  readonly annualCO2AvailableKg: number;
  readonly annualCO2UtilizedKg: number;
  /** `null` when annual CO₂ available is zero (ratio undefined). */
  readonly co2RecyclingRatePct: number | null;
  readonly annualMethaneProducedTons: number;
  readonly annualHydrogenNeededKg: number;
  readonly annualElectricityConsumedMwh: number;
  readonly annualVariableCostEur: number;
  readonly annualCapexCostEur: number;
  readonly annualTotalCostEur: number;
  readonly annualMethaneRevenueEur: number;
  readonly hydrogenSalesAlternativeRevenueEur: number;
  /** `null` when no methane is produced (avoid misleading infinite prices). */
  readonly breakEvenMethanePriceEurPerTon: number | null;
  readonly methanePriceAt10PctProfitabilityEurPerTon: number | null;
  readonly methanePriceAt30PctProfitabilityEurPerTon: number | null;
  readonly deltaVsHydrogenSaleEur: number;
};

/**
 * Canonical calculation output for UI, Excel, and PDF (Agent 2 fills series and summaries).
 * Resolved daily inputs are the harmonized series consumed by the daily engine.
 */
export type CalculationResult = {
  readonly input: ScenarioInput;
  readonly resolvedDailyCo2: readonly ResolvedDailyCo2Point[];
  readonly resolvedDailyElectricityPrice: readonly ResolvedDailyElectricityPricePoint[];
  readonly dailyResults: readonly DailyResult[];
  readonly monthlySummary: readonly MonthlySummary[];
  readonly annualSummary: ScenarioSummary;
  /** Non-fatal issues (e.g. SEC kWh/MWh mismatch); input assumptions remain on `input.process`. */
  readonly warnings: readonly string[];
};
