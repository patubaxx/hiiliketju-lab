import { expect } from "vitest";

import type { CalculationResult } from "@/core/domain/result";
import type { ScenarioSummary } from "@/core/domain/result";
import { SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";

/** Canonical `CalculationResult` keys from `result.ts` (regression guard). */
export const CALCULATION_RESULT_TOP_LEVEL_KEYS = [
  "input",
  "resolvedDailyCo2",
  "resolvedDailyElectricityPrice",
  "dailyResults",
  "monthlySummary",
  "annualSummary",
  "warnings",
] as const satisfies readonly (keyof CalculationResult)[];

/** Required `ScenarioSummary` keys for structural smoke checks. */
export const SCENARIO_SUMMARY_KEYS: (keyof ScenarioSummary)[] = [
  "annualCO2AvailableKg",
  "annualCO2UtilizedKg",
  "annualFreeCo2UsedKg",
  "annualPurchasedCo2Kg",
  "annualCo2PurchaseCostEur",
  "co2RecyclingRatePct",
  "annualMethaneProducedTons",
  "annualHydrogenNeededKg",
  "annualElectricityConsumedMwh",
  "annualVariableCostEur",
  "annualCapexCostEur",
  "annualTotalCostEur",
  "annualMethaneRevenueEur",
  "hydrogenSalesAlternativeRevenueEur",
  "breakEvenMethanePriceEurPerTon",
  "methanePriceAt10PctProfitabilityEurPerTon",
  "methanePriceAt30PctProfitabilityEurPerTon",
  "deltaVsHydrogenSaleEur",
  "h2CapacityBindingDays",
  "ch4CapacityBindingDays",
];

export function assertCalculationResultShape(result: CalculationResult): void {
  for (const key of CALCULATION_RESULT_TOP_LEVEL_KEYS) {
    expect(result).toHaveProperty(key);
  }
  expect(result.dailyResults).toHaveLength(SCENARIO_PERIOD_DAYS);
  expect(result.resolvedDailyCo2).toHaveLength(SCENARIO_PERIOD_DAYS);
  expect(result.resolvedDailyElectricityPrice).toHaveLength(SCENARIO_PERIOD_DAYS);
  expect(result.monthlySummary).toHaveLength(12);
  expect(Array.isArray(result.warnings)).toBe(true);
  for (const key of SCENARIO_SUMMARY_KEYS) {
    expect(result.annualSummary).toHaveProperty(key);
  }
}

export function expectClose(
  actual: number,
  expected: number,
  precision: number,
  message?: string,
): void {
  expect(actual, message).toBeCloseTo(expected, precision);
}

/**
 * Compare a subset of `ScenarioSummary` fields with numeric tolerance or exact null.
 */
export function assertPartialScenarioSummary(
  actual: ScenarioSummary,
  partial: Partial<Record<keyof ScenarioSummary, number | null>>,
  precision: number,
): void {
  for (const [rawKey, expected] of Object.entries(partial)) {
    const key = rawKey as keyof ScenarioSummary;
    const got = actual[key];
    if (expected === null) {
      expect(got, `ScenarioSummary.${key}`).toBeNull();
      continue;
    }
    if (typeof expected === "number" && typeof got === "number") {
      expect(got, `ScenarioSummary.${key}`).toBeCloseTo(expected, precision);
      continue;
    }
    expect(got, `ScenarioSummary.${key}`).toBe(expected);
  }
}

/**
 * First day slice of `dailyResults` for lightweight golden checks.
 */
export function assertFirstDailyRowClose(
  result: CalculationResult,
  partial: Partial<{
    availableCO2Kg: number;
    usableCO2Kg: number;
    hydrogenNeededKg: number;
    methaneProducedKg: number;
    electricityConsumedMwh: number;
    electricityCostEur: number;
    variableCostEur: number;
    allocatedCapexCostEur: number;
    totalCostEur: number;
  }>,
  precision: number,
): void {
  const row = result.dailyResults[0]!;
  for (const [k, expected] of Object.entries(partial)) {
    const key = k as keyof typeof partial;
    expect(row[key], `dailyResults[0].${key}`).toBeCloseTo(expected as number, precision);
  }
}
