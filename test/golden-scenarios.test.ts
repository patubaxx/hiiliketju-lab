import { describe, expect, it } from "vitest";

import {
  WARNING_LITERATURE_ESTIMATED_PROCESS_DEFAULTS,
  calculateScenario,
} from "@/core/calculation/calculate-scenario";
import { annualCo2KtPerYearToKgPerYear } from "@/core/domain/units";
import { parseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

import {
  GS001_EXPECTED_ANNUAL,
  GS001_FLAT_ANNUAL_BASELINE_RAW,
  GS002_SEASONAL_CAPEX_RAW,
  GS003_SEC_WARNING_RAW,
} from "./fixtures/golden-scenarios";
import {
  assertCalculationResultShape,
  assertFirstDailyRowClose,
  assertPartialScenarioSummary,
  expectClose,
} from "./helpers/assert-golden-scenario";

describe("golden scenarios (MVP regression)", () => {
  it("GS-001 flat annual baseline matches locked stoichiometry, cost stack, and literature warning", () => {
    const input = parseScenarioInput(GS001_FLAT_ANNUAL_BASELINE_RAW);
    const r = calculateScenario(input);

    assertCalculationResultShape(r);
    expect(r.input.assumptionsMeta.assumptionsVersion).toBe("golden_gs001");
    expect(r.input.process.stoichiometricHydrogenDemandFactorKgH2PerKgCo2.assumptionMeta.assumptionSource).toBe(
      "literature_based",
    );

    const lit = r.warnings.filter((w) => w === WARNING_LITERATURE_ESTIMATED_PROCESS_DEFAULTS);
    expect(lit).toHaveLength(1);

    assertPartialScenarioSummary(
      r.annualSummary,
      {
        annualCO2AvailableKg: GS001_EXPECTED_ANNUAL.annualCO2AvailableKg,
        annualCO2UtilizedKg: GS001_EXPECTED_ANNUAL.annualCO2UtilizedKg,
        co2RecyclingRatePct: GS001_EXPECTED_ANNUAL.co2RecyclingRatePct,
        annualHydrogenNeededKg: GS001_EXPECTED_ANNUAL.annualHydrogenNeededKg,
        annualMethaneProducedTons: GS001_EXPECTED_ANNUAL.annualMethaneProducedTons,
        annualElectricityConsumedMwh: GS001_EXPECTED_ANNUAL.annualElectricityConsumedMwh,
        annualCapexCostEur: 0,
      },
      4,
    );

    const annualKg = annualCo2KtPerYearToKgPerYear(1);
    const perDayAvail = annualKg / 365;
    const annualElecCost = GS001_EXPECTED_ANNUAL.annualElectricityConsumedMwh * 50;
    assertPartialScenarioSummary(
      r.annualSummary,
      {
        annualVariableCostEur: annualElecCost,
        annualTotalCostEur: annualElecCost,
        annualMethaneRevenueEur: GS001_EXPECTED_ANNUAL.annualMethaneProducedTons * 120,
        hydrogenSalesAlternativeRevenueEur: GS001_EXPECTED_ANNUAL.annualHydrogenNeededKg * 6,
      },
      3,
    );

    const tons = r.annualSummary.annualMethaneProducedTons;
    expectClose(r.annualSummary.breakEvenMethanePriceEurPerTon!, r.annualSummary.annualTotalCostEur / tons, 5);
    expectClose(
      r.annualSummary.methanePriceAt10PctProfitabilityEurPerTon!,
      (r.annualSummary.annualTotalCostEur * 1.1) / tons,
      5,
    );
    expectClose(
      r.annualSummary.methanePriceAt30PctProfitabilityEurPerTon!,
      (r.annualSummary.annualTotalCostEur * 1.3) / tons,
      5,
    );

    const usable0 = perDayAvail;
    assertFirstDailyRowClose(
      r,
      {
        availableCO2Kg: perDayAvail,
        usableCO2Kg: usable0,
        hydrogenNeededKg: usable0 * 0.1832,
        methaneProducedKg: usable0 * 0.3645,
        electricityConsumedMwh: usable0 * 0.1832 * 0.054,
        electricityCostEur: usable0 * 0.1832 * 0.054 * 50,
        variableCostEur: usable0 * 0.1832 * 0.054 * 50,
        allocatedCapexCostEur: 0,
        totalCostEur: usable0 * 0.1832 * 0.054 * 50,
      },
      5,
    );
  });

  it("GS-002 seasonal + daily electricity + CAPEX preserves annual CO₂ mass and allocates CAPEX", () => {
    const input = parseScenarioInput(GS002_SEASONAL_CAPEX_RAW);
    const a = calculateScenario(input);
    const b = calculateScenario(input);

    assertCalculationResultShape(a);
    expect(a.annualSummary).toEqual(b.annualSummary);

    const sumCo2 = a.resolvedDailyCo2.reduce((s, p) => s + p.availableCO2Kg, 0);
    expect(sumCo2).toBeCloseTo(annualCo2KtPerYearToKgPerYear(1), 4);

    expectClose(a.annualSummary.annualCapexCostEur, 150_000, 4);
    expect(a.dailyResults.every((d) => d.allocatedCapexCostEur === a.dailyResults[0]!.allocatedCapexCostEur)).toBe(
      true,
    );
    expectClose(a.dailyResults[0]!.allocatedCapexCostEur, 150_000 / 365, 6);

    const fromDaily =
      a.dailyResults.reduce((s, d) => s + d.methaneRevenueEur, 0) -
      a.dailyResults.reduce((s, d) => s + d.hydrogenAlternativeRevenueEur, 0);
    expectClose(a.annualSummary.deltaVsHydrogenSaleEur, fromDaily, 4);

    const sumMonthlyCapex = a.monthlySummary.reduce((s, m) => s + m.sums.allocatedCapexCostEur, 0);
    expectClose(sumMonthlyCapex, a.annualSummary.annualCapexCostEur, 4);

    expect(a.warnings.filter((w) => w === WARNING_LITERATURE_ESTIMATED_PROCESS_DEFAULTS)).toHaveLength(1);
  });

  it("GS-003 SEC mismatch stacks with literature warning without duplicating either", () => {
    const r = calculateScenario(parseScenarioInput(GS003_SEC_WARNING_RAW));
    assertCalculationResultShape(r);

    const sec = r.warnings.filter((w) => w.includes("Electrolyzer SEC inconsistency"));
    const lit = r.warnings.filter((w) => w === WARNING_LITERATURE_ESTIMATED_PROCESS_DEFAULTS);
    expect(sec).toHaveLength(1);
    expect(lit).toHaveLength(1);
    expect(r.warnings).toHaveLength(2);
  });
});
