/**
 * WP-AUDIT-2: independent first-principles reference vs `calculateScenario` (no engine imports for formulas).
 * Literature defaults match merged process assumptions (kg_H2/kg_CO2, kg_CH4/kg_CO2, SEC MWh/kg_H2).
 */
import { describe, expect, it } from "vitest";

import { calculateScenario } from "@/core/calculation/calculate-scenario";
import { SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";
import { parseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

/** Locked MVP literature defaults (same order of magnitude as `defaultProcessAssumptionsInput`). */
const H2_FACTOR = 0.1832;
const CH4_FACTOR = 0.3645;
const SEC_MWH_PER_KG_H2 = 0.054;

const EPS = 1e-5;

type RefCaps = {
  readonly maxCo2KgPerDay: number;
  readonly h2DerivedCapCo2KgPerDay: number;
  readonly ch4DerivedCapCo2KgPerDay: number;
};

/** Mirrors intended WP28 cap derivation (independent of engine exports). */
function refEffectiveCaps(args: {
  readonly electrolyzerMaxH2KgPerDay: number | null | undefined;
  readonly methanationMaxCh4KgPerDay: number | null | undefined;
  readonly h2Factor: number;
  readonly ch4Factor: number;
}): RefCaps {
  let h2Co2 = Number.POSITIVE_INFINITY;
  let ch4Co2 = Number.POSITIVE_INFINITY;
  const { h2Factor, ch4Factor } = args;
  if (args.electrolyzerMaxH2KgPerDay != null && Number.isFinite(args.electrolyzerMaxH2KgPerDay)) {
    h2Co2 = h2Factor > 0 ? args.electrolyzerMaxH2KgPerDay / h2Factor : Number.POSITIVE_INFINITY;
  }
  if (args.methanationMaxCh4KgPerDay != null && Number.isFinite(args.methanationMaxCh4KgPerDay)) {
    ch4Co2 = ch4Factor > 0 ? args.methanationMaxCh4KgPerDay / ch4Factor : Number.POSITIVE_INFINITY;
  }
  return {
    maxCo2KgPerDay: Math.min(h2Co2, ch4Co2),
    h2DerivedCapCo2KgPerDay: h2Co2,
    ch4DerivedCapCo2KgPerDay: ch4Co2,
  };
}

/** Mirrors `splitCo2SourcesForDay` semantics from the audit spec. */
function refSplitCo2(args: {
  readonly availableCo2Kg: number;
  readonly utilizationRatePct: number;
  readonly caps: RefCaps;
  readonly marketPurchaseEnabled: boolean;
}): {
  readonly freeCo2UsedKg: number;
  readonly purchasedCo2Kg: number;
  readonly usableCO2Kg: number;
  readonly h2CapacityBinding: boolean;
  readonly ch4CapacityBinding: boolean;
} {
  const intendedFree = args.availableCo2Kg * (args.utilizationRatePct / 100);
  const cap = args.caps.maxCo2KgPerDay;
  const freeCo2UsedKg = Math.min(intendedFree, cap);
  let purchasedCo2Kg = 0;
  if (args.marketPurchaseEnabled && Number.isFinite(cap) && freeCo2UsedKg < cap) {
    purchasedCo2Kg = cap - freeCo2UsedKg;
  }
  const usableCO2Kg = freeCo2UsedKg + purchasedCo2Kg;
  const eps = 1e-6;
  const h2CapacityBinding =
    Number.isFinite(args.caps.h2DerivedCapCo2KgPerDay) &&
    usableCO2Kg >= args.caps.h2DerivedCapCo2KgPerDay - eps;
  const ch4CapacityBinding =
    Number.isFinite(args.caps.ch4DerivedCapCo2KgPerDay) &&
    usableCO2Kg >= args.caps.ch4DerivedCapCo2KgPerDay - eps;
  return { freeCo2UsedKg, purchasedCo2Kg, usableCO2Kg, h2CapacityBinding, ch4CapacityBinding };
}

function refDailyFinancials(args: {
  readonly usableCO2Kg: number;
  readonly purchasedCo2Kg: number;
  readonly priceEurPerMwh: number;
  readonly purchasePriceEurPerTco2: number;
  readonly marketPurchaseEnabled: boolean;
  readonly methanePriceEurPerTch4: number;
  readonly hydrogenPriceEurPerKg: number;
  readonly otherOpexEurPerYear: number;
  readonly dailyCapexEur: number;
}): {
  readonly hydrogenNeededKg: number;
  readonly methaneProducedKg: number;
  readonly electricityConsumedMwh: number;
  readonly electricityCostEur: number;
  readonly co2PurchaseCostEur: number;
  readonly variableCostEur: number;
  readonly totalCostEur: number;
  readonly methaneRevenueEur: number;
  readonly hydrogenAlternativeRevenueEur: number;
} {
  const h2 = args.usableCO2Kg * H2_FACTOR;
  const ch4 = args.usableCO2Kg * CH4_FACTOR;
  const elecMwh = h2 * SEC_MWH_PER_KG_H2;
  const elecCost = elecMwh * args.priceEurPerMwh;
  const otherOx = args.otherOpexEurPerYear / SCENARIO_PERIOD_DAYS;
  const co2PurchaseCostEur = args.marketPurchaseEnabled
    ? (args.purchasedCo2Kg / 1000) * args.purchasePriceEurPerTco2
    : 0;
  const variableCostEur = elecCost + otherOx + co2PurchaseCostEur;
  const totalCostEur = variableCostEur + args.dailyCapexEur;
  return {
    hydrogenNeededKg: h2,
    methaneProducedKg: ch4,
    electricityConsumedMwh: elecMwh,
    electricityCostEur: elecCost,
    co2PurchaseCostEur,
    variableCostEur,
    totalCostEur,
    methaneRevenueEur: (ch4 / 1000) * args.methanePriceEurPerTch4,
    hydrogenAlternativeRevenueEur: h2 * args.hydrogenPriceEurPerKg,
  };
}

function baseWire(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    scenarioName: "WP28 sanity",
    periodDays: 365,
    co2: {
      annualAmountKtPerYear: 3.65,
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
    assumptionsMeta: { assumptionsVersion: "wp28_sanity" },
    process: {},
    ...overrides,
  };
}

describe("WP28 calculation sanity vs independent reference", () => {
  it("Case A — legacy unbounded, no purchase: daily + annual match reference", () => {
    const input = parseScenarioInput(baseWire());
    const r = calculateScenario(input);
    const day0 = r.dailyResults[0]!;
    const avail = day0.availableCO2Kg;
    const caps = refEffectiveCaps({
      electrolyzerMaxH2KgPerDay: undefined,
      methanationMaxCh4KgPerDay: undefined,
      h2Factor: H2_FACTOR,
      ch4Factor: CH4_FACTOR,
    });
    const split = refSplitCo2({
      availableCo2Kg: avail,
      utilizationRatePct: 100,
      caps,
      marketPurchaseEnabled: false,
    });
    const fin = refDailyFinancials({
      usableCO2Kg: split.usableCO2Kg,
      purchasedCo2Kg: split.purchasedCo2Kg,
      priceEurPerMwh: 50,
      purchasePriceEurPerTco2: 0,
      marketPurchaseEnabled: false,
      methanePriceEurPerTch4: 1000,
      hydrogenPriceEurPerKg: 4,
      otherOpexEurPerYear: 0,
      dailyCapexEur: 0,
    });

    expect(day0.usableCO2Kg).toBeCloseTo(split.usableCO2Kg, 6);
    expect(day0.freeCo2UsedKg).toBeCloseTo(split.freeCo2UsedKg, 6);
    expect(day0.purchasedCo2Kg).toBeCloseTo(0, 6);
    expect(day0.hydrogenNeededKg).toBeCloseTo(fin.hydrogenNeededKg, 6);
    expect(day0.methaneProducedKg).toBeCloseTo(fin.methaneProducedKg, 6);
    expect(day0.electricityConsumedMwh).toBeCloseTo(fin.electricityConsumedMwh, 6);
    expect(day0.variableCostEur).toBeCloseTo(fin.variableCostEur, 4);

    expect(r.annualSummary.annualCO2UtilizedKg).toBeCloseTo(r.annualSummary.annualFreeCo2UsedKg, 4);
    expect(r.annualSummary.annualPurchasedCo2Kg).toBe(0);
    expect(r.annualSummary.co2RecyclingRatePct).toBeCloseTo(100, 4);
    expect(r.annualSummary.h2CapacityBindingDays).toBe(0);
    expect(r.annualSummary.ch4CapacityBindingDays).toBe(0);

    const breakEven = r.annualSummary.annualTotalCostEur / r.annualSummary.annualMethaneProducedTons;
    expect(r.annualSummary.breakEvenMethanePriceEurPerTon).toBeCloseTo(breakEven, 4);
  });

  it("Case B — H₂ cap binding, no purchase", () => {
    const wire = baseWire({
      plant: { electrolyzerMaxH2KgPerDay: 1000, methanationMaxCh4KgPerDay: null },
    });
    const r = calculateScenario(parseScenarioInput(wire));
    const day0 = r.dailyResults[0]!;
    const caps = refEffectiveCaps({
      electrolyzerMaxH2KgPerDay: 1000,
      methanationMaxCh4KgPerDay: null,
      h2Factor: H2_FACTOR,
      ch4Factor: CH4_FACTOR,
    });
    const split = refSplitCo2({
      availableCo2Kg: day0.availableCO2Kg,
      utilizationRatePct: 100,
      caps,
      marketPurchaseEnabled: false,
    });
    expect(split.usableCO2Kg).toBeCloseTo(1000 / H2_FACTOR, 6);
    expect(day0.usableCO2Kg).toBeCloseTo(split.usableCO2Kg, 6);
    expect(day0.hydrogenNeededKg).toBeCloseTo(1000, 6);
    expect(day0.h2CapacityBinding).toBe(true);
    expect(day0.ch4CapacityBinding).toBe(false);
    expect(r.annualSummary.h2CapacityBindingDays).toBe(365);
    expect(r.annualSummary.ch4CapacityBindingDays).toBe(0);
    const recycling =
      (r.annualSummary.annualFreeCo2UsedKg / r.annualSummary.annualCO2AvailableKg) * 100;
    expect(r.annualSummary.co2RecyclingRatePct).toBeCloseTo(recycling, 4);
    expect(recycling).toBeLessThan(100);
  });

  it("Case C — CH₄ cap + market purchase enabled", () => {
    const wire = baseWire({
      co2: {
        annualAmountKtPerYear: 0.365,
        utilizationRatePct: 100,
        availability: { mode: "flat_annual" as const },
        marketPurchase: { mode: "enabled" as const, purchasePriceEurPerTco2: 80 },
      },
      plant: { electrolyzerMaxH2KgPerDay: null, methanationMaxCh4KgPerDay: 1000 },
    });
    const r = calculateScenario(parseScenarioInput(wire));
    const day0 = r.dailyResults[0]!;
    const caps = refEffectiveCaps({
      electrolyzerMaxH2KgPerDay: null,
      methanationMaxCh4KgPerDay: 1000,
      h2Factor: H2_FACTOR,
      ch4Factor: CH4_FACTOR,
    });
    const split = refSplitCo2({
      availableCo2Kg: day0.availableCO2Kg,
      utilizationRatePct: 100,
      caps,
      marketPurchaseEnabled: true,
    });
    const capCo2 = 1000 / CH4_FACTOR;
    expect(split.usableCO2Kg).toBeCloseTo(capCo2, 6);
    expect(day0.freeCo2UsedKg).toBeCloseTo(1000, 6);
    expect(day0.purchasedCo2Kg).toBeCloseTo(capCo2 - 1000, 6);
    expect(day0.ch4CapacityBinding).toBe(true);
    expect(day0.co2PurchaseCostEur).toBeCloseTo(((capCo2 - 1000) / 1000) * 80, 5);
    expect(r.annualSummary.ch4CapacityBindingDays).toBe(365);
  });

  it("Case D — both caps; tighter H₂ cap wins", () => {
    const wire = baseWire({
      plant: {
        electrolyzerMaxH2KgPerDay: 800,
        methanationMaxCh4KgPerDay: 5000,
      },
    });
    const r = calculateScenario(parseScenarioInput(wire));
    const day0 = r.dailyResults[0]!;
    const caps = refEffectiveCaps({
      electrolyzerMaxH2KgPerDay: 800,
      methanationMaxCh4KgPerDay: 5000,
      h2Factor: H2_FACTOR,
      ch4Factor: CH4_FACTOR,
    });
    const tighter = Math.min(800 / H2_FACTOR, 5000 / CH4_FACTOR);
    expect(tighter).toBe(800 / H2_FACTOR);
    const split = refSplitCo2({
      availableCo2Kg: day0.availableCO2Kg,
      utilizationRatePct: 100,
      caps,
      marketPurchaseEnabled: false,
    });
    expect(day0.usableCO2Kg).toBeCloseTo(split.usableCO2Kg, 6);
    expect(day0.usableCO2Kg).toBeCloseTo(tighter, 6);
    expect(day0.h2CapacityBinding).toBe(true);
    expect(day0.ch4CapacityBinding).toBe(false);
  });

  it("Case E — purchase enabled but no finite plant caps", () => {
    const wire = baseWire({
      co2: {
        annualAmountKtPerYear: 3.65,
        utilizationRatePct: 100,
        availability: { mode: "flat_annual" as const },
        marketPurchase: { mode: "enabled" as const, purchasePriceEurPerTco2: 80 },
      },
    });
    const r = calculateScenario(parseScenarioInput(wire));
    expect(r.annualSummary.annualPurchasedCo2Kg).toBe(0);
    expect(r.annualSummary.annualCo2PurchaseCostEur).toBe(0);
    expect(r.dailyResults[0]!.purchasedCo2Kg).toBe(0);
  });

  it("Case F — utilization 50% with market top-up", () => {
    // 0.365 kt/year ≡ 1000 kg/day biogenic availability
    const wire = baseWire({
      co2: {
        annualAmountKtPerYear: 0.365,
        utilizationRatePct: 50,
        availability: { mode: "flat_annual" as const },
        marketPurchase: { mode: "enabled" as const, purchasePriceEurPerTco2: 80 },
      },
      plant: { electrolyzerMaxH2KgPerDay: null, methanationMaxCh4KgPerDay: 1000 },
    });
    const r = calculateScenario(parseScenarioInput(wire));
    const day0 = r.dailyResults[0]!;
    const caps = refEffectiveCaps({
      electrolyzerMaxH2KgPerDay: null,
      methanationMaxCh4KgPerDay: 1000,
      h2Factor: H2_FACTOR,
      ch4Factor: CH4_FACTOR,
    });
    const split = refSplitCo2({
      availableCo2Kg: day0.availableCO2Kg,
      utilizationRatePct: 50,
      caps,
      marketPurchaseEnabled: true,
    });
    expect(day0.freeCo2UsedKg).toBeCloseTo(split.freeCo2UsedKg, 6);
    expect(day0.purchasedCo2Kg).toBeCloseTo(split.purchasedCo2Kg, 6);
    expect(day0.usableCO2Kg).toBeCloseTo(split.usableCO2Kg, 6);
    const expectedRecycling =
      (r.annualSummary.annualFreeCo2UsedKg / r.annualSummary.annualCO2AvailableKg) * 100;
    expect(r.annualSummary.co2RecyclingRatePct).toBeCloseTo(expectedRecycling, 4);
    expect(expectedRecycling).toBeCloseTo(50, 4);
  });

  it("Case G — constant daily: monthly sums and annual reconciliation", () => {
    const r = calculateScenario(parseScenarioInput(baseWire()));
    const d0 = r.dailyResults[0]!;
    let sumPurchased = 0;
    let sumFree = 0;
    let sumPurchaseCost = 0;
    for (const m of r.monthlySummary) {
      expect(m.sums.purchasedCo2Kg).toBeCloseTo(d0.purchasedCo2Kg * (m.lastDayIndex - m.firstDayIndex + 1), EPS);
      expect(m.sums.freeCo2UsedKg).toBeCloseTo(d0.freeCo2UsedKg * (m.lastDayIndex - m.firstDayIndex + 1), EPS);
      expect(m.sums.co2PurchaseCostEur).toBeCloseTo(
        d0.co2PurchaseCostEur * (m.lastDayIndex - m.firstDayIndex + 1),
        EPS,
      );
      sumPurchased += m.sums.purchasedCo2Kg;
      sumFree += m.sums.freeCo2UsedKg;
      sumPurchaseCost += m.sums.co2PurchaseCostEur;
    }
    expect(sumPurchased).toBeCloseTo(r.annualSummary.annualPurchasedCo2Kg, EPS);
    expect(sumFree).toBeCloseTo(r.annualSummary.annualFreeCo2UsedKg, EPS);
    expect(sumPurchaseCost).toBeCloseTo(r.annualSummary.annualCo2PurchaseCostEur, EPS);
  });

  it("daily rows expose WP28 fields", () => {
    const r = calculateScenario(parseScenarioInput(baseWire()));
    const d = r.dailyResults[0]!;
    for (const k of [
      "freeCo2UsedKg",
      "purchasedCo2Kg",
      "co2PurchaseCostEur",
      "h2CapacityBinding",
      "ch4CapacityBinding",
    ] as const) {
      expect(d).toHaveProperty(k);
    }
    const m0 = r.monthlySummary[0]!;
    for (const k of ["freeCo2UsedKg", "purchasedCo2Kg", "co2PurchaseCostEur"] as const) {
      expect(m0.sums).toHaveProperty(k);
    }
  });
});
