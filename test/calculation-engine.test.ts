import { describe, expect, it } from "vitest";

import { allocateCapex } from "@/core/calculation/allocate-capex";
import { calculateDailyResults, usableCo2KgPerDay } from "@/core/calculation/calculate-daily-results";
import { calculateScenario } from "@/core/calculation/calculate-scenario";
import { resolveCo2Series } from "@/core/calculation/resolve-co2-series";
import { resolveElectricityPriceSeries } from "@/core/calculation/resolve-electricity-price-series";
import { resolveElectrolyzerSecMwhPerKgH2 } from "@/core/calculation/validate-sec-consistency";
import { mergeProcessAssumptionsInput, type ScenarioInput } from "@/core/domain/scenario";
import { annualCo2KtPerYearToKgPerYear } from "@/core/domain/units";
import { parseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

const ones365 = Array.from({ length: 365 }, () => 1);
const equalSeasonalWeights = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as const;

function baseScenario(overrides?: Partial<ScenarioInput>): ScenarioInput {
  const raw = {
    scenarioName: "Engine test",
    periodDays: 365 as const,
    co2: {
      annualAmountKtPerYear: 1,
      utilizationRatePct: 100,
      availability: { mode: "flat_annual" as const },
    },
    electricity: {
      mode: "constant" as const,
      priceEurPerMwh: 100,
    },
    economics: {
      methanePriceEurPerTch4: 200,
      hydrogenPriceEurPerKg: 5,
      otherOpexEurPerYear: 3650,
      includeCapex: false,
    },
    assumptionsMeta: {
      assumptionsVersion: "test",
    },
    process: {},
    ...overrides,
  };
  return parseScenarioInput(raw);
}

describe("resolveCo2Series", () => {
  it("flat_annual produces 365 equal daily kg from kt/year", () => {
    const series = resolveCo2Series(
      baseScenario({
        co2: {
          annualAmountKtPerYear: 0.365,
          utilizationRatePct: 100,
          availability: { mode: "flat_annual" },
        },
      }).co2,
    );
    expect(series).toHaveLength(365);
    const annualKg = annualCo2KtPerYearToKgPerYear(0.365);
    const perDay = annualKg / 365;
    for (const p of series) {
      expect(p.availableCO2Kg).toBeCloseTo(perDay, 10);
    }
    const sum = series.reduce((a, p) => a + p.availableCO2Kg, 0);
    expect(sum).toBeCloseTo(annualKg, 5);
  });

  it("seasonal_daily consumes full annual mass (via seasonal builder)", () => {
    const annualKt = 2.5;
    const annualKg = annualCo2KtPerYearToKgPerYear(annualKt);
    const series = resolveCo2Series(
      baseScenario({
        co2: {
          annualAmountKtPerYear: annualKt,
          utilizationRatePct: 50,
          availability: {
            mode: "seasonal_daily",
            monthlyRelativeWeights: [3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4],
          },
        },
      }).co2,
    );
    const sum = series.reduce((a, p) => a + p.availableCO2Kg, 0);
    expect(sum).toBeCloseTo(annualKg, 6);
  });

  it("time_series_hourly aggregates CO2 by sum per day", () => {
    const hourly = Array.from({ length: 8760 }, (_, i) => (i % 24 === 0 ? 1 : 0));
    const series = resolveCo2Series(
      baseScenario({
        co2: {
          annualAmountKtPerYear: 999,
          utilizationRatePct: 100,
          availability: { mode: "time_series_hourly", hourlyAvailableCo2Kg: hourly },
        },
      }).co2,
    );
    for (const p of series) {
      expect(p.availableCO2Kg).toBe(1);
    }
  });
});

describe("resolveElectricityPriceSeries", () => {
  it("constant mode yields 365 identical prices", () => {
    const s = resolveElectricityPriceSeries({ mode: "constant", priceEurPerMwh: 77 });
    expect(s).toHaveLength(365);
    expect(s.every((p) => p.electricityPriceEurPerMWh === 77)).toBe(true);
  });

  it("hourly_series aggregates with arithmetic mean", () => {
    const hourly = Array.from({ length: 8760 }, (_, i) => (i < 12 ? 200 : 0));
    const s = resolveElectricityPriceSeries({ mode: "hourly_series", hourlyPricesEurPerMwh: hourly });
    expect(s[0]!.electricityPriceEurPerMWh).toBeCloseTo(100, 10);
  });

  it("historical_market_data_imported hourly matches hourly_series path", () => {
    const hourly = Array.from({ length: 8760 }, () => 48);
    const a = resolveElectricityPriceSeries({ mode: "hourly_series", hourlyPricesEurPerMwh: hourly });
    const b = resolveElectricityPriceSeries({
      mode: "historical_market_data_imported",
      resolution: "hourly",
      pricesEurPerMwh: hourly,
    });
    expect(a.map((p) => p.electricityPriceEurPerMWh)).toEqual(
      b.map((p) => p.electricityPriceEurPerMWh),
    );
  });
});

describe("allocateCapex", () => {
  it("excludes CAPEX when flag false", () => {
    const r = allocateCapex(
      baseScenario().economics,
    );
    expect(r.annualCapexCostEur).toBe(0);
    expect(r.dailyAllocatedCapexEur).toBe(0);
  });

  it("includes simple lifetime allocation", () => {
    const r = allocateCapex({
      ...baseScenario().economics,
      includeCapex: true,
      electrolyzerCapexEur: 1_000_000,
      methanationCapexEur: 500_000,
      capexLifetimeYears: 10,
    });
    expect(r.annualCapexCostEur).toBe(150_000);
    expect(r.dailyAllocatedCapexEur).toBeCloseTo(150_000 / 365, 10);
  });
});

describe("resolveElectrolyzerSecMwhPerKgH2 (SEC policy)", () => {
  it("returns no warning when kWh and MWh are consistent", () => {
    const p = mergeProcessAssumptionsInput({});
    const r = resolveElectrolyzerSecMwhPerKgH2(p);
    expect(r.warnings).toHaveLength(0);
    expect(r.electrolyzerSecMwhPerKgH2).toBe(0.054);
  });

  it("emits warning and keeps MWh authoritative when inconsistent", () => {
    const p = mergeProcessAssumptionsInput({
      electrolyzerSpecificEnergyConsumptionKwhPerKgH2: {
        value: 50,
        assumptionMeta: {
          assumptionSource: "customer_provided",
          assumptionStatus: "confirmed",
        },
      },
      electrolyzerSpecificEnergyConsumptionMwhPerKgH2: {
        value: 0.054,
        assumptionMeta: {
          assumptionSource: "customer_provided",
          assumptionStatus: "confirmed",
        },
      },
    });
    const r = resolveElectrolyzerSecMwhPerKgH2(p);
    expect(r.electrolyzerSecMwhPerKgH2).toBe(0.054);
    expect(r.warnings.length).toBe(1);
    expect(r.warnings[0]).toContain("authoritative");
  });
});

describe("calculateDailyResults formulas", () => {
  it("matches deterministic fixture", () => {
    const scenario = baseScenario({
      co2: {
        annualAmountKtPerYear: 0.365,
        utilizationRatePct: 100,
        availability: { mode: "flat_annual" },
      },
      electricity: { mode: "constant", priceEurPerMwh: 10 },
      economics: {
        methanePriceEurPerTch4: 1000,
        hydrogenPriceEurPerKg: 2,
        otherOpexEurPerYear: 0,
        includeCapex: false,
      },
    });
    const co2 = resolveCo2Series(scenario.co2);
    const el = resolveElectricityPriceSeries(scenario.electricity);
    const sec = resolveElectrolyzerSecMwhPerKgH2(scenario.process);
    const daily = calculateDailyResults({
      resolvedCo2: co2,
      resolvedElectricityPrice: el,
      economics: scenario.economics,
      process: scenario.process,
      electrolyzerSecMwhPerKgH2: sec.electrolyzerSecMwhPerKgH2,
      dailyAllocatedCapexEur: 0,
      utilizationRatePct: scenario.co2.utilizationRatePct,
    });
    const row = daily[0]!;
    const annualKg = annualCo2KtPerYearToKgPerYear(0.365);
    const avail = annualKg / 365;
    expect(row.availableCO2Kg).toBeCloseTo(avail, 8);
    expect(row.usableCO2Kg).toBeCloseTo(avail, 8);
    expect(row.hydrogenNeededKg).toBeCloseTo(avail * 0.1832, 8);
    expect(row.methaneProducedKg).toBeCloseTo(avail * 0.3645, 8);
    expect(row.electricityConsumedMwh).toBeCloseTo(row.hydrogenNeededKg * 0.054, 8);
    expect(row.electricityCostEur).toBeCloseTo(row.electricityConsumedMwh * 10, 8);
    expect(row.variableCostEur).toBeCloseTo(row.electricityCostEur, 8);
    expect(row.methaneRevenueEur).toBeCloseTo((row.methaneProducedKg / 1000) * 1000, 8);
    expect(row.hydrogenAlternativeRevenueEur).toBeCloseTo(row.hydrogenNeededKg * 2, 8);
  });
});

describe("aggregateAnnualFromDaily", () => {
  it("nulls methane price KPIs when no methane produced", () => {
    const scenario = baseScenario({
      co2: {
        annualAmountKtPerYear: 1,
        utilizationRatePct: 0,
        availability: { mode: "flat_annual" },
      },
    });
    const result = calculateScenario(scenario);
    expect(result.annualSummary.annualMethaneProducedTons).toBe(0);
    expect(result.annualSummary.breakEvenMethanePriceEurPerTon).toBeNull();
    expect(result.annualSummary.methanePriceAt10PctProfitabilityEurPerTon).toBeNull();
    expect(result.annualSummary.methanePriceAt30PctProfitabilityEurPerTon).toBeNull();
  });

  it("computes profitability prices from annual totals", () => {
    const scenario = baseScenario({
      co2: {
        annualAmountKtPerYear: 0.365,
        utilizationRatePct: 100,
        availability: { mode: "flat_annual" },
      },
      electricity: { mode: "constant", priceEurPerMwh: 0 },
      economics: {
        methanePriceEurPerTch4: 0,
        hydrogenPriceEurPerKg: 0,
        otherOpexEurPerYear: 0,
        includeCapex: false,
      },
    });
    const { annualSummary } = calculateScenario(scenario);
    const tons = annualSummary.annualMethaneProducedTons;
    expect(tons).toBeGreaterThan(0);
    const be = annualSummary.breakEvenMethanePriceEurPerTon!;
    expect(be).toBeCloseTo(annualSummary.annualTotalCostEur / tons, 6);
    expect(annualSummary.methanePriceAt10PctProfitabilityEurPerTon).toBeCloseTo(be * 1.1, 6);
    expect(annualSummary.methanePriceAt30PctProfitabilityEurPerTon).toBeCloseTo(be * 1.3, 6);
  });

  it("co2RecyclingRatePct null when no CO2 available", () => {
    const scenario = baseScenario({
      co2: {
        annualAmountKtPerYear: 0,
        utilizationRatePct: 50,
        availability: { mode: "time_series_daily", dailyAvailableCo2Kg: ones365.map(() => 0) },
      },
    });
    const { annualSummary } = calculateScenario(scenario);
    expect(annualSummary.co2RecyclingRatePct).toBeNull();
  });
});

describe("aggregateMonthlyFromDaily", () => {
  it("produces 12 months in order", () => {
    const scenario = baseScenario({
      co2: {
        annualAmountKtPerYear: 1,
        utilizationRatePct: 100,
        availability: { mode: "seasonal_daily", monthlyRelativeWeights: [...equalSeasonalWeights] },
      },
    });
    const r = calculateScenario(scenario);
    expect(r.monthlySummary).toHaveLength(12);
    expect(r.monthlySummary.map((m) => m.monthIndex)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    const sumMonths = r.monthlySummary.reduce((a, m) => a + m.sums.methaneProducedKg, 0);
    const sumDaily = r.dailyResults.reduce((a, d) => a + d.methaneProducedKg, 0);
    expect(sumMonths).toBeCloseTo(sumDaily, 6);
  });
});

describe("calculateScenario integration", () => {
  it("propagates SEC warnings on result", () => {
    const scenario = parseScenarioInput({
      scenarioName: "x",
      periodDays: 365,
      co2: {
        annualAmountKtPerYear: 1,
        utilizationRatePct: 100,
        availability: { mode: "flat_annual" },
      },
      electricity: { mode: "constant", priceEurPerMwh: 1 },
      economics: {
        methanePriceEurPerTch4: 1,
        hydrogenPriceEurPerKg: 1,
        otherOpexEurPerYear: 0,
        includeCapex: false,
      },
      process: {
        electrolyzerSpecificEnergyConsumptionKwhPerKgH2: {
          value: 40,
          assumptionMeta: {
            assumptionSource: "customer_provided",
            assumptionStatus: "confirmed",
          },
        },
        electrolyzerSpecificEnergyConsumptionMwhPerKgH2: {
          value: 0.054,
          assumptionMeta: {
            assumptionSource: "customer_provided",
            assumptionStatus: "confirmed",
          },
        },
      },
      assumptionsMeta: { assumptionsVersion: "v" },
    });
    const r = calculateScenario(scenario);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("preserves assumption metadata on input snapshot", () => {
    const scenario = baseScenario();
    const r = calculateScenario(scenario);
    expect(r.input.process.stoichiometricHydrogenDemandFactorKgH2PerKgCo2.assumptionMeta.assumptionSource).toBe(
      "literature_based",
    );
  });
});

describe("usableCo2KgPerDay", () => {
  it("scales by utilization percentage", () => {
    expect(usableCo2KgPerDay(200, 25)).toBe(50);
  });
});
