/**
 * WP28: plant capacity caps + market CO₂ purchase.
 *
 * Covers:
 *  - Daily H₂ cap binds and reduces methane production deterministically.
 *  - Daily CH₄ cap binds and reduces hydrogen demand deterministically.
 *  - Market CO₂ purchase tops up to the plant ceiling and adds purchase cost.
 *  - Recycling rate counts only biogenic free-stream CO₂ (purchased CO₂ excluded).
 *  - Pre-WP28 scenarios (no caps, no purchase) keep identical numerics
 *    (`usableCO2Kg` == `available × util%`, `freeCo2UsedKg` == `usableCO2Kg`,
 *    `purchasedCo2Kg` == 0).
 */
import { describe, expect, it } from "vitest";

import { calculateScenario } from "@/core/calculation/calculate-scenario";
import { parseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

const STOICH_H2 = 0.1832;
const STOICH_CH4 = 0.3645;

function baseWire(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    scenarioName: "WP28 cap test",
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
    assumptionsMeta: { assumptionsVersion: "wp28_test" },
    process: {},
    ...overrides,
  };
}

describe("WP28: backward compatibility (no caps, no purchase)", () => {
  it("collapses to legacy daily formulas when plant is unbounded and purchase is omitted", () => {
    const r = calculateScenario(parseScenarioInput(baseWire()));
    const day0 = r.dailyResults[0]!;
    // 10_000 kg CO₂/day × 100% utilization
    expect(day0.availableCO2Kg).toBeCloseTo(10_000, 6);
    expect(day0.usableCO2Kg).toBeCloseTo(10_000, 6);
    expect(day0.freeCo2UsedKg).toBeCloseTo(10_000, 6);
    expect(day0.purchasedCo2Kg).toBe(0);
    expect(day0.co2PurchaseCostEur).toBe(0);
    expect(day0.h2CapacityBinding).toBe(false);
    expect(day0.ch4CapacityBinding).toBe(false);
    // Annual invariant (legacy): utilized ≤ available when no purchase
    expect(r.annualSummary.annualCO2UtilizedKg).toBeLessThanOrEqual(
      r.annualSummary.annualCO2AvailableKg,
    );
    expect(r.annualSummary.annualPurchasedCo2Kg).toBe(0);
    expect(r.annualSummary.annualCo2PurchaseCostEur).toBe(0);
    expect(r.annualSummary.h2CapacityBindingDays).toBe(0);
    expect(r.annualSummary.ch4CapacityBindingDays).toBe(0);
  });
});

describe("WP28: H₂ capacity cap binds and reduces methane output", () => {
  it("clips daily CO₂ throughput via H₂ cap; methane scales by stoichiometry", () => {
    // Available 10_000 kg CO₂/day demands 1832 kg H₂. Cap H₂ at 1000 kg/day → throughput
    // ceiling = 1000 / 0.1832 ≈ 5460.7 kg CO₂/day.
    const wire = baseWire({
      plant: {
        electrolyzerMaxH2KgPerDay: 1000,
        methanationMaxCh4KgPerDay: null,
      },
    });
    const r = calculateScenario(parseScenarioInput(wire));
    const day0 = r.dailyResults[0]!;
    const expectedCo2 = 1000 / STOICH_H2;
    expect(day0.usableCO2Kg).toBeCloseTo(expectedCo2, 6);
    expect(day0.hydrogenNeededKg).toBeCloseTo(1000, 6);
    expect(day0.methaneProducedKg).toBeCloseTo(expectedCo2 * STOICH_CH4, 6);
    expect(day0.h2CapacityBinding).toBe(true);
    expect(day0.ch4CapacityBinding).toBe(false);
    expect(day0.purchasedCo2Kg).toBe(0);
    expect(r.annualSummary.h2CapacityBindingDays).toBe(365);
  });

  it("same clipping when methanation cap is omitted (implicit unbounded) instead of explicit null", () => {
    const wire = baseWire({
      plant: {
        electrolyzerMaxH2KgPerDay: 1000,
      },
    });
    const r = calculateScenario(parseScenarioInput(wire));
    const day0 = r.dailyResults[0]!;
    const expectedCo2 = 1000 / STOICH_H2;
    expect(day0.usableCO2Kg).toBeCloseTo(expectedCo2, 6);
    expect(day0.h2CapacityBinding).toBe(true);
    expect(day0.ch4CapacityBinding).toBe(false);
  });
});

describe("WP28: CH₄ capacity cap binds and reduces hydrogen demand", () => {
  it("clips daily CO₂ throughput via CH₄ cap; hydrogen scales by stoichiometry", () => {
    // Cap CH₄ at 1000 kg/day → throughput ceiling = 1000 / 0.3645 ≈ 2743.5 kg CO₂/day.
    const wire = baseWire({
      plant: {
        electrolyzerMaxH2KgPerDay: null,
        methanationMaxCh4KgPerDay: 1000,
      },
    });
    const r = calculateScenario(parseScenarioInput(wire));
    const day0 = r.dailyResults[0]!;
    const expectedCo2 = 1000 / STOICH_CH4;
    expect(day0.usableCO2Kg).toBeCloseTo(expectedCo2, 6);
    expect(day0.methaneProducedKg).toBeCloseTo(1000, 6);
    expect(day0.hydrogenNeededKg).toBeCloseTo(expectedCo2 * STOICH_H2, 6);
    expect(day0.ch4CapacityBinding).toBe(true);
    expect(day0.h2CapacityBinding).toBe(false);
    expect(r.annualSummary.ch4CapacityBindingDays).toBe(365);
  });

  it("same clipping when electrolyzer cap is omitted (implicit unbounded) instead of explicit null", () => {
    const wire = baseWire({
      plant: {
        methanationMaxCh4KgPerDay: 1000,
      },
    });
    const r = calculateScenario(parseScenarioInput(wire));
    const day0 = r.dailyResults[0]!;
    const expectedCo2 = 1000 / STOICH_CH4;
    expect(day0.usableCO2Kg).toBeCloseTo(expectedCo2, 6);
    expect(day0.ch4CapacityBinding).toBe(true);
    expect(day0.h2CapacityBinding).toBe(false);
    expect(r.annualSummary.ch4CapacityBindingDays).toBe(365);
  });

  it("the tighter of two caps wins (CH₄ tighter here)", () => {
    // H₂ cap at 5000 kg/day → cap = 27_293 kg CO₂/day (loose for 10k feed).
    // CH₄ cap at 800 kg/day → cap = 2194.8 kg CO₂/day (tight). Tighter wins.
    const wire = baseWire({
      plant: {
        electrolyzerMaxH2KgPerDay: 5000,
        methanationMaxCh4KgPerDay: 800,
      },
    });
    const r = calculateScenario(parseScenarioInput(wire));
    const day0 = r.dailyResults[0]!;
    const expectedCo2 = 800 / STOICH_CH4;
    expect(day0.usableCO2Kg).toBeCloseTo(expectedCo2, 6);
    expect(day0.ch4CapacityBinding).toBe(true);
    expect(day0.h2CapacityBinding).toBe(false);
  });
});

describe("WP28: market CO₂ purchase tops up to plant capacity", () => {
  it("buys CO₂ to fill the plant when biogenic side stream is below capacity", () => {
    // Side-stream available = 1000 kg/day; plant ceiling (CH₄ cap = 1000 kg) = 2743.5 kg/day.
    // Purchased = 2743.5 − 1000 = 1743.5 kg/day at 80 EUR/t = 139.5 EUR/day.
    const lowCo2 = baseWire({
      co2: {
        annualAmountKtPerYear: 0.365, // 1000 kg/day flat
        utilizationRatePct: 100,
        availability: { mode: "flat_annual" as const },
        marketPurchase: { mode: "enabled" as const, purchasePriceEurPerTco2: 80 },
      },
      plant: {
        electrolyzerMaxH2KgPerDay: null,
        methanationMaxCh4KgPerDay: 1000,
      },
    });
    const r = calculateScenario(parseScenarioInput(lowCo2));
    const day0 = r.dailyResults[0]!;
    const cap = 1000 / STOICH_CH4;
    expect(day0.freeCo2UsedKg).toBeCloseTo(1000, 6);
    expect(day0.purchasedCo2Kg).toBeCloseTo(cap - 1000, 6);
    expect(day0.usableCO2Kg).toBeCloseTo(cap, 6);
    const expectedDailyCost = ((cap - 1000) / 1000) * 80;
    expect(day0.co2PurchaseCostEur).toBeCloseTo(expectedDailyCost, 6);
    // Variable cost includes the purchase line.
    expect(day0.variableCostEur).toBeGreaterThan(day0.electricityCostEur);

    // Recycling rate uses ONLY free-stream feed.
    expect(r.annualSummary.annualFreeCo2UsedKg).toBeCloseTo(1000 * 365, 6);
    expect(r.annualSummary.annualPurchasedCo2Kg).toBeCloseTo((cap - 1000) * 365, 6);
    expect(r.annualSummary.co2RecyclingRatePct).toBeCloseTo(100, 6); // all of side stream used
    expect(r.annualSummary.annualCo2PurchaseCostEur).toBeCloseTo(expectedDailyCost * 365, 5);
  });

  it("does not purchase when caps are unset (fill target undefined)", () => {
    const wire = baseWire({
      co2: {
        annualAmountKtPerYear: 0.365,
        utilizationRatePct: 100,
        availability: { mode: "flat_annual" as const },
        marketPurchase: { mode: "enabled" as const, purchasePriceEurPerTco2: 80 },
      },
      // No `plant` block ⇒ unbounded.
    });
    const r = calculateScenario(parseScenarioInput(wire));
    expect(r.annualSummary.annualPurchasedCo2Kg).toBe(0);
    expect(r.annualSummary.annualCo2PurchaseCostEur).toBe(0);
  });

  it("disabled purchase yields zero buys even when caps are set", () => {
    const wire = baseWire({
      co2: {
        annualAmountKtPerYear: 0.365,
        utilizationRatePct: 100,
        availability: { mode: "flat_annual" as const },
        marketPurchase: { mode: "disabled" as const },
      },
      plant: {
        electrolyzerMaxH2KgPerDay: null,
        methanationMaxCh4KgPerDay: 1000,
      },
    });
    const r = calculateScenario(parseScenarioInput(wire));
    expect(r.annualSummary.annualPurchasedCo2Kg).toBe(0);
    expect(r.annualSummary.annualCo2PurchaseCostEur).toBe(0);
  });
});

describe("WP28: schema validation", () => {
  it("rejects non-positive plant caps", () => {
    expect(() =>
      parseScenarioInput(
        baseWire({
          plant: { electrolyzerMaxH2KgPerDay: 0, methanationMaxCh4KgPerDay: null },
        }),
      ),
    ).toThrow();
  });

  it("rejects enabled purchase with negative price", () => {
    expect(() =>
      parseScenarioInput(
        baseWire({
          co2: {
            annualAmountKtPerYear: 0.365,
            utilizationRatePct: 100,
            availability: { mode: "flat_annual" as const },
            marketPurchase: { mode: "enabled" as const, purchasePriceEurPerTco2: -1 },
          },
        }),
      ),
    ).toThrow();
  });

  it("accepts an unbounded plant block (both null)", () => {
    const r = calculateScenario(
      parseScenarioInput(
        baseWire({
          plant: { electrolyzerMaxH2KgPerDay: null, methanationMaxCh4KgPerDay: null },
        }),
      ),
    );
    expect(r.annualSummary.annualPurchasedCo2Kg).toBe(0);
    expect(r.annualSummary.h2CapacityBindingDays).toBe(0);
  });
});
