/**
 * Sanity check: run three scenarios through the backend `calculateScenario`,
 * compare the annual summary numbers against an independent Python reference
 * (`test/fixtures/manual_results.json`). Used as a one-shot tool, not a long-lived regression.
 */
import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

import { calculateScenario } from "@/core/calculation/calculate-scenario";
import { parseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

const PRECISION = 4; // decimal places for toBeCloseTo (1e-4)

const MANUAL = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "fixtures", "manual_results.json"), "utf-8"),
);

function baseWire(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    scenarioName: "Sanity",
    periodDays: 365,
    co2: {
      annualAmountKtPerYear: 3.65, // 10_000 kg/day flat
      utilizationRatePct: 100,
      availability: { mode: "flat_annual" as const },
    },
    electricity: { mode: "constant" as const, priceEurPerMwh: 50 },
    economics: {
      methanePriceEurPerTch4: 1000,
      hydrogenPriceEurPerKg: 4,
      otherOpexEurPerYear: 0,
      includeCapex: false,
    },
    assumptionsMeta: { assumptionsVersion: "sanity_check" },
    process: {},
    ...overrides,
  };
}

const COMPARED_KEYS = [
  "annualCO2AvailableKg",
  "annualCO2UtilizedKg",
  "annualFreeCo2UsedKg",
  "annualPurchasedCo2Kg",
  "annualCo2PurchaseCostEur",
  "annualHydrogenNeededKg",
  "annualMethaneProducedTons",
  "annualElectricityConsumedMwh",
  "annualVariableCostEur",
  "annualCapexCostEur",
  "annualTotalCostEur",
  "annualMethaneRevenueEur",
  "hydrogenSalesAlternativeRevenueEur",
  "deltaVsHydrogenSaleEur",
  "co2RecyclingRatePct",
  "breakEvenMethanePriceEurPerTon",
  "methanePriceAt10PctProfitabilityEurPerTon",
  "methanePriceAt30PctProfitabilityEurPerTon",
  "h2CapacityBindingDays",
  "ch4CapacityBindingDays",
] as const;

function assertCloseToManual(name: string, got: Record<string, unknown>) {
  const ref = MANUAL[name] as Record<string, unknown>;
  for (const key of COMPARED_KEYS) {
    const expected = ref[key];
    const actual = got[key];
    if (expected === null) {
      expect(actual, `${name}.${key} should be null`).toBeNull();
      continue;
    }
    if (typeof expected === "number" && typeof actual === "number") {
      // Use relative tolerance for large numbers, absolute for small.
      if (Math.abs(expected) > 1) {
        const relDiff = Math.abs((actual - expected) / expected);
        expect(relDiff, `${name}.${key}: expected ${expected}, got ${actual}`).toBeLessThan(1e-9);
      } else {
        expect(actual, `${name}.${key}`).toBeCloseTo(expected as number, PRECISION);
      }
      continue;
    }
    expect(actual, `${name}.${key}`).toEqual(expected);
  }
}

describe("Sanity check: backend vs Python manual reference", () => {
  it("A: legacy unbounded — pre-WP28 numerics preserved", () => {
    const r = calculateScenario(parseScenarioInput(baseWire()));
    assertCloseToManual("A_legacy_unbounded", r.annualSummary);
  });

  it("B: H2 cap binds, no purchase — electrolyzer bottleneck honored", () => {
    const r = calculateScenario(
      parseScenarioInput(
        baseWire({
          plant: { electrolyzerMaxH2KgPerDay: 1000, methanationMaxCh4KgPerDay: null },
        }),
      ),
    );
    assertCloseToManual("B_h2_cap_binds_no_purchase", r.annualSummary);
  });

  it("C: low side stream + CH4 cap + market CO2 purchase — full WP28 path", () => {
    const r = calculateScenario(
      parseScenarioInput(
        baseWire({
          co2: {
            annualAmountKtPerYear: 0.365, // 1000 kg/day flat
            utilizationRatePct: 100,
            availability: { mode: "flat_annual" as const },
            marketPurchase: { mode: "enabled" as const, purchasePriceEurPerTco2: 80 },
          },
          plant: { electrolyzerMaxH2KgPerDay: null, methanationMaxCh4KgPerDay: 1000 },
        }),
      ),
    );
    assertCloseToManual("C_low_sidestream_with_ch4_cap_and_purchase", r.annualSummary);
  });
});
