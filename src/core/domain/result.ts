import type { ScenarioInput } from "./scenario";
import type { ResolvedDailyCo2Point, ResolvedDailyElectricityPricePoint } from "./temporal";

export type { ResolvedDailyCo2Point, ResolvedDailyElectricityPricePoint } from "./temporal";

/** Per-day calculation row produced by the daily engine (canonical units in field names). */
export type DailyResult = {
  readonly dayIndex: number;
  readonly dateLabel: string;
  readonly availableCO2Kg: number;
  /**
   * Total CO₂ fed to the methanation process this day (kg). Equals
   * `freeCo2UsedKg + purchasedCo2Kg`. Drives downstream H₂ demand and CH₄ output.
   * In pre-WP28 scenarios (no caps, no purchase) this collapses to
   * `availableCO2Kg × utilizationRatePct/100` for backward compatibility.
   */
  readonly usableCO2Kg: number;
  /**
   * Of `usableCO2Kg`, the portion that came from the biogenic free side stream (kg).
   * Capped by both `availableCO2Kg × utilization%` and the effective plant ceiling.
   */
  readonly freeCo2UsedKg: number;
  /**
   * Of `usableCO2Kg`, the portion purchased from the market this day (kg).
   * Always 0 when `marketPurchase.mode === "disabled"` or when no plant caps are set.
   */
  readonly purchasedCo2Kg: number;
  /** Cost of purchased CO₂ this day, EUR. Always 0 when no purchase happened. */
  readonly co2PurchaseCostEur: number;
  /** True if the electrolyzer cap is the *active* binding constraint this day. */
  readonly h2CapacityBinding: boolean;
  /** True if the methanation cap is the *active* binding constraint this day. */
  readonly ch4CapacityBinding: boolean;
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
    readonly freeCo2UsedKg: number;
    readonly purchasedCo2Kg: number;
    readonly co2PurchaseCostEur: number;
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
  /** Number of days within this month where the electrolyzer cap was the active binding constraint. */
  readonly h2CapacityBindingDays: number;
  /** Number of days within this month where the methanation cap was the active binding constraint. */
  readonly ch4CapacityBindingDays: number;
};

/** Annual KPI block (solution / calc specs). */
export type ScenarioSummary = {
  readonly annualCO2AvailableKg: number;
  /**
   * Total CO₂ fed to the process for the year (kg). Equals
   * `annualFreeCo2UsedKg + annualPurchasedCo2Kg`. In pre-WP28 scenarios (no caps,
   * no purchase) this still equals `available × utilization%`, preserving the
   * legacy invariant `annualCO2UtilizedKg ≤ annualCO2AvailableKg`. With market
   * purchase enabled, this can exceed `annualCO2AvailableKg`.
   */
  readonly annualCO2UtilizedKg: number;
  /** Of `annualCO2UtilizedKg`, the portion sourced from the biogenic free side stream (kg). */
  readonly annualFreeCo2UsedKg: number;
  /** Of `annualCO2UtilizedKg`, the portion purchased from the market (kg). */
  readonly annualPurchasedCo2Kg: number;
  /** Annual cost of CO₂ purchased from the market (EUR). 0 when not enabled. */
  readonly annualCo2PurchaseCostEur: number;
  /**
   * Recycling rate of biogenic CO₂ (free CO₂ used / available). Reflects only the
   * biogenic side-stream pathway; purchased CO₂ does not increase this rate.
   * `null` when annual CO₂ available is zero (ratio undefined).
   */
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
  /** Number of days in the year where the electrolyzer cap was the active binding constraint. */
  readonly h2CapacityBindingDays: number;
  /** Number of days in the year where the methanation cap was the active binding constraint. */
  readonly ch4CapacityBindingDays: number;
};

/**
 * Canonical calculation output: single source of truth for UI, Excel, and PDF. Populated only by `calculateScenario`
 * and its helpers. `resolvedDailyCo2` / `resolvedDailyElectricityPrice` are the harmonized inputs fed to the daily engine.
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
