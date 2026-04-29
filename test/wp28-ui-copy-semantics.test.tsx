/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { calculateScenario } from "@/core/calculation/calculate-scenario";
import type { ScenarioSummary } from "@/core/domain/result";
import { ResultsCharts } from "@/features/scenario/results-ui/results-charts";
import { ResultsKpiSecondary } from "@/features/scenario/results-ui/results-kpi-grid";
import { parseScenarioInput } from "@/features/scenario/schemas/scenario-schema";
import { locales, translate, type Locale } from "@/i18n/messages";

const tEn = (id: string, vars?: Record<string, string>) => translate("en", id, vars);

function summaryWithWp28(): ScenarioSummary {
  return {
    annualCO2AvailableKg: 365_000,
    annualCO2UtilizedKg: 1_001_371.742112483,
    annualFreeCo2UsedKg: 365_000,
    annualPurchasedCo2Kg: 636_371.742112483,
    annualCo2PurchaseCostEur: 50_909.73936899864,
    co2RecyclingRatePct: 100,
    annualMethaneProducedTons: 365,
    annualHydrogenNeededKg: 183_451.70235660687,
    annualElectricityConsumedMwh: 9_906.391927256771,
    annualVariableCostEur: 546_229.3357318372,
    annualCapexCostEur: 0,
    annualTotalCostEur: 546_229.3357318372,
    annualMethaneRevenueEur: 365_000,
    hydrogenSalesAlternativeRevenueEur: 733_806.8094264275,
    breakEvenMethanePriceEurPerTon: 1496.5187280324307,
    methanePriceAt10PctProfitabilityEurPerTon: 1646.1706008356738,
    methanePriceAt30PctProfitabilityEurPerTon: 1945.4743464424333,
    deltaVsHydrogenSaleEur: -368_806.80942642747,
    h2CapacityBindingDays: 0,
    ch4CapacityBindingDays: 365,
  };
}

function wp28PurchaseResult() {
  return calculateScenario(
    parseScenarioInput({
      scenarioName: "WP28 UI copy",
      periodDays: 365,
      co2: {
        annualAmountKtPerYear: 0.365,
        utilizationRatePct: 100,
        availability: { mode: "flat_annual" as const },
        marketPurchase: { mode: "enabled" as const, purchasePriceEurPerTco2: 80 },
      },
      electricity: { mode: "constant" as const, priceEurPerMwh: 50 },
      economics: {
        methanePriceEurPerTch4: 1000,
        hydrogenPriceEurPerKg: 4,
        otherOpexEurPerYear: 0,
        includeCapex: false,
      },
      assumptionsMeta: { assumptionsVersion: "wp28_ui_copy" },
      process: {},
      plant: { electrolyzerMaxH2KgPerDay: null, methanationMaxCh4KgPerDay: 1000 },
    }),
  );
}

afterEach(() => cleanup());

describe("WP28 UI copy semantics", () => {
  it("renders KPI labels and help text that distinguish total process feed from side-stream recycling", () => {
    render(<ResultsKpiSecondary summary={summaryWithWp28()} locale="en" t={tEn} />);

    expect(screen.getByText("Total process CO₂ feed")).toBeTruthy();
    expect(screen.getByText("Side-stream recycling rate")).toBeTruthy();
    expect(screen.getByText("Side-stream CO₂ used")).toBeTruthy();
    expect(screen.getByText("Purchased CO₂")).toBeTruthy();
    expect(screen.getByText("Methanation bottleneck days")).toBeTruthy();
    expect(
      screen.getByText("Total CO₂ fed to the process: side-stream CO₂ plus any purchased CO₂."),
    ).toBeTruthy();
    expect(
      screen.getByText("Side-stream CO₂ used divided by side-stream CO₂ available; purchased CO₂ is excluded."),
    ).toBeTruthy();
  });

  it("renders the CO₂ source chart with monthly-total labels when purchased CO₂ is present", () => {
    render(<ResultsCharts result={wp28PurchaseResult()} locale="en" t={tEn} />);

    expect(screen.getByText("Monthly process CO₂ sources")).toBeTruthy();
    expect(screen.getByText("Side-stream CO₂ (free)")).toBeTruthy();
    expect(screen.getByText("Purchased CO₂ (market)")).toBeTruthy();
    expect(screen.getByText((content) => content === "CO₂ (t)" || content === "CO₂ (kg)" || content === "CO₂ (kt)")).toBeTruthy();
  });

  it("has aligned WP28 semantic keys in every supported locale", () => {
    const keys = [
      "results.kpi.annualCo2Utilized",
      "results.kpi.annualCo2FreeUsed",
      "results.kpi.annualCo2Purchased",
      "results.kpi.co2RecyclingRate",
      "results.kpi.h2BindingDays",
      "results.kpi.ch4BindingDays",
      "results.kpiHelp.annualCo2Utilized",
      "results.kpiHelp.co2RecyclingRate",
      "results.pathComparison.help",
      "results.chart.co2SourceMix",
      "results.chart.axis.yKg",
      "results.chart.axis.yT",
      "results.chart.axis.yKt",
      "results.usedAssumptions.group.plant",
      "results.usedAssumptions.electrolyzerCapacityLimit",
      "results.usedAssumptions.methanationCapacityLimit",
      "results.usedAssumptions.marketCo2PurchasePrice",
      "results.usedAssumptions.unit.eurPerTco2",
      "results.usedAssumptions.unit.kgH2PerDay",
      "results.usedAssumptions.unit.kgCh4PerDay",
    ];

    for (const locale of locales) {
      for (const key of keys) {
        expect(translate(locale as Locale, key)).not.toBe(key);
      }
    }
  });
});
