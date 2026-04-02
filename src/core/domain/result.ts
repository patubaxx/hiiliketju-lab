import type { ScenarioInput } from "./scenario";

/**
 * Per-day calculation row. Several magnitudes are still TODO at unit level in the calc spec.
 * TODO(formula): replace placeholder semantics when daily formulas are implemented.
 */
export type DailyResult = {
  readonly dayIndex: number;
  readonly dateLabel: string;
  /** TODO(unit-decision): align with engine internal mass vs energy choice. */
  readonly availableCO2: number;
  readonly usableCO2: number;
  readonly hydrogenNeeded: number;
  readonly methaneProduced: number;
  /** Calc spec: MWh (when formula exists). */
  readonly electricityConsumed: number;
  readonly variableCost: number;
  readonly allocatedCapexCost: number;
  readonly totalCost: number;
  readonly methaneRevenue: number;
  readonly hydrogenAlternativeRevenue: number;
};

/**
 * Aggregated totals for one calendar month within the fixed 365-day year.
 * `sums` mirror `DailyResult` so aggregation can be implemented mechanically later.
 */
export type MonthlySummary = {
  readonly monthIndex: number;
  readonly firstDayIndex: number;
  readonly lastDayIndex: number;
  readonly sums: {
    readonly availableCO2: number;
    readonly usableCO2: number;
    readonly hydrogenNeeded: number;
    readonly methaneProduced: number;
    readonly electricityConsumed: number;
    readonly variableCost: number;
    readonly allocatedCapexCost: number;
    readonly totalCost: number;
    readonly methaneRevenue: number;
    readonly hydrogenAlternativeRevenue: number;
  };
};

/** Annual KPI block (solution spec §9). */
export type ScenarioSummary = {
  readonly annualMethaneProduced: number;
  readonly annualHydrogenNeeded: number;
  readonly annualElectricityConsumed: number;
  readonly annualVariableCost: number;
  readonly annualCapexCost: number;
  readonly annualTotalCost: number;
  readonly methaneRevenue: number;
  readonly hydrogenSalesAlternativeRevenue: number;
  readonly unitCostMethane: number;
  readonly deltaVsHydrogenSale: number;
};

/**
 * Canonical calculation output for UI, Excel, and PDF.
 * `monthlySummary` is an array (one entry per month with data) — not `unknown[]`.
 */
export type CalculationResult = {
  readonly input: ScenarioInput;
  readonly dailyResults: readonly DailyResult[];
  readonly monthlySummary: readonly MonthlySummary[];
  readonly annualSummary: ScenarioSummary;
};
