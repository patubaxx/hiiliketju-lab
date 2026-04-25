import { describe, expect, it } from "vitest";

import { buildEconomicVerdict } from "@/core/reporting/build-economic-verdict";
import type { ScenarioSummary } from "@/core/domain/result";

function s(p: Partial<ScenarioSummary>): ScenarioSummary {
  return {
    annualCO2AvailableKg: 0,
    annualCO2UtilizedKg: 0,
    co2RecyclingRatePct: null,
    annualMethaneProducedTons: 0,
    annualHydrogenNeededKg: 0,
    annualElectricityConsumedMwh: 0,
    annualVariableCostEur: 0,
    annualCapexCostEur: 0,
    annualTotalCostEur: 0,
    annualMethaneRevenueEur: 0,
    hydrogenSalesAlternativeRevenueEur: 0,
    breakEvenMethanePriceEurPerTon: null,
    methanePriceAt10PctProfitabilityEurPerTon: null,
    methanePriceAt30PctProfitabilityEurPerTon: null,
    deltaVsHydrogenSaleEur: 0,
    ...p,
  };
}

describe("buildEconomicVerdict (WP25)", () => {
  it("is not_computable when methane production is non-positive or break-even is null", () => {
    expect(buildEconomicVerdict(s({ annualMethaneProducedTons: 0, breakEvenMethanePriceEurPerTon: 1 })).category).toBe(
      "not_computable",
    );
    expect(
      buildEconomicVerdict(
        s({ annualMethaneProducedTons: 1, breakEvenMethanePriceEurPerTon: null, annualMethaneRevenueEur: 1 }),
      ).category,
    ).toBe("not_computable");
  });

  it("favorable when revenue covers cost and delta vs hydrogen is non-negative", () => {
    const v = buildEconomicVerdict(
      s({
        annualMethaneProducedTons: 1,
        breakEvenMethanePriceEurPerTon: 10,
        annualMethaneRevenueEur: 200,
        annualTotalCostEur: 100,
        hydrogenSalesAlternativeRevenueEur: 50,
        deltaVsHydrogenSaleEur: 10,
      }),
    );
    expect(v.category).toBe("favorable");
  });

  it("unfavorable when revenue is below cost and delta is negative", () => {
    const v = buildEconomicVerdict(
      s({
        annualMethaneProducedTons: 1,
        breakEvenMethanePriceEurPerTon: 10,
        annualMethaneRevenueEur: 10,
        annualTotalCostEur: 100,
        hydrogenSalesAlternativeRevenueEur: 200,
        deltaVsHydrogenSaleEur: -5,
      }),
    );
    expect(v.category).toBe("unfavorable");
  });

  it("mixed when revenue >= cost but delta negative", () => {
    const v = buildEconomicVerdict(
      s({
        annualMethaneProducedTons: 1,
        breakEvenMethanePriceEurPerTon: 10,
        annualMethaneRevenueEur: 200,
        annualTotalCostEur: 100,
        hydrogenSalesAlternativeRevenueEur: 300,
        deltaVsHydrogenSaleEur: -1,
      }),
    );
    expect(v.category).toBe("mixed");
  });

  it("mixed when revenue < cost but delta non-negative", () => {
    const v = buildEconomicVerdict(
      s({
        annualMethaneProducedTons: 1,
        breakEvenMethanePriceEurPerTon: 10,
        annualMethaneRevenueEur: 50,
        annualTotalCostEur: 100,
        hydrogenSalesAlternativeRevenueEur: 20,
        deltaVsHydrogenSaleEur: 0,
      }),
    );
    expect(v.category).toBe("mixed");
  });
});
