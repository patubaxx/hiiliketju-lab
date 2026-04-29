import { describe, expect, it } from "vitest";

import { calculateScenario } from "@/core/calculation/calculate-scenario";
import { mergeProcessAssumptionsInput } from "@/core/domain/scenario";
import { buildScenarioExcelExportModel } from "@/core/reporting/build-export-model";
import { buildScenarioPdfReportModel } from "@/core/reporting/build-pdf-report-model";
import { parseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

function minimalScenarioRaw() {
  return {
    scenarioName: "PDF export test",
    periodDays: 365,
    co2: {
      annualAmountKtPerYear: 0.365,
      utilizationRatePct: 100,
      availability: { mode: "flat_annual" as const },
    },
    electricity: { mode: "constant" as const, priceEurPerMwh: 10 },
    economics: {
      methanePriceEurPerTch4: 100,
      hydrogenPriceEurPerKg: 2,
      otherOpexEurPerYear: 0,
      includeCapex: false,
    },
    assumptionsMeta: { assumptionsVersion: "pdf_test", notes: "Note A" },
    process: {},
  };
}

function wp28ScenarioRaw() {
  return {
    ...minimalScenarioRaw(),
    scenarioName: "PDF WP28 export test",
    co2: {
      annualAmountKtPerYear: 0.365,
      utilizationRatePct: 100,
      availability: { mode: "flat_annual" as const },
      marketPurchase: { mode: "enabled" as const, purchasePriceEurPerTco2: 80 },
    },
    plant: {
      electrolyzerMaxH2KgPerDay: null,
      methanationMaxCh4KgPerDay: 1000,
    },
  };
}

describe("PDF report model (WP7)", () => {
  it("embeds the same excel export model mapping", () => {
    const result = calculateScenario(parseScenarioInput(minimalScenarioRaw()));
    const pdfModel = buildScenarioPdfReportModel(result, { chartMaxPoints: 50 });
    const excelDirect = buildScenarioExcelExportModel(result);
    expect(pdfModel.excelModel.annualMetrics).toEqual(excelDirect.annualMetrics);
    expect(pdfModel.excelModel.warnings).toEqual(excelDirect.warnings);
  });

  it("copies overview fields from embedded scenario input", () => {
    const result = calculateScenario(parseScenarioInput(minimalScenarioRaw()));
    const pdfModel = buildScenarioPdfReportModel(result);
    expect(pdfModel.overview.scenarioName).toBe(result.input.scenarioName);
    expect(pdfModel.overview.assumptionsVersion).toBe("pdf_test");
    expect(pdfModel.overview.scenarioNotes).toBe("Note A");
  });

  it("downsamples chart series without exceeding max points", () => {
    const result = calculateScenario(parseScenarioInput(minimalScenarioRaw()));
    const pdfModel = buildScenarioPdfReportModel(result, { chartMaxPoints: 40 });
    expect(pdfModel.charts.co2KgPerDay.length).toBeLessThanOrEqual(41);
    expect(pdfModel.charts.costRevenue.length).toBeLessThanOrEqual(41);
    expect(pdfModel.charts.co2KgPerDay.length).toBeGreaterThan(0);
  });

  it("preserves last day in downsampled CO₂ series for continuity", () => {
    const result = calculateScenario(parseScenarioInput(minimalScenarioRaw()));
    const pdfModel = buildScenarioPdfReportModel(result, { chartMaxPoints: 10 });
    const last = pdfModel.charts.co2KgPerDay[pdfModel.charts.co2KgPerDay.length - 1]!;
    expect(last.dayIndex).toBe(364);
  });

  it("keeps overridden and untouched process-assumption provenance distinct in the PDF export path", () => {
    const result = calculateScenario(
      parseScenarioInput({
        ...minimalScenarioRaw(),
        process: mergeProcessAssumptionsInput({
          stoichiometricHydrogenDemandFactorKgH2PerKgCo2: {
            value: 0.2,
            assumptionMeta: {
              assumptionSource: "customer_provided",
              assumptionStatus: "confirmed",
            },
          },
        }),
      }),
    );
    const pdfModel = buildScenarioPdfReportModel(result);
    const overridden = pdfModel.excelModel.processAssumptions.find(
      (row) => row.fieldKey === "stoichiometricHydrogenDemandFactorKgH2PerKgCo2",
    );
    const untouched = pdfModel.excelModel.processAssumptions.find(
      (row) => row.fieldKey === "stoichiometricMethaneYieldFactorKgCh4PerKgCo2",
    );

    expect(overridden?.assumptionSource).toBe("customer_provided");
    expect(untouched?.assumptionSource).toBe("literature_based");
  });

  it("includes WP28 summary and active input readout through the shared PDF model", () => {
    const result = calculateScenario(parseScenarioInput(wp28ScenarioRaw()));
    const pdfModel = buildScenarioPdfReportModel(result);
    const annualMap = new Map(pdfModel.excelModel.annualMetrics.map((row) => [row.metricKey, row]));
    const usedAssumptions = pdfModel.excelModel.usedAssumptionsPrint;

    expect(annualMap.get("annualCO2UtilizedKg")?.label).toBe("Total process CO₂ feed");
    expect(annualMap.get("annualPurchasedCo2Kg")?.value).toBeGreaterThan(0);
    expect(annualMap.get("annualCo2PurchaseCostEur")?.value).toBeGreaterThan(0);
    expect(annualMap.get("ch4CapacityBindingDays")?.value).toBeGreaterThan(0);
    expect(usedAssumptions.some((row) => row.label === "Methanation capacity limit")).toBe(true);
    expect(usedAssumptions.some((row) => row.label === "Market CO₂ purchase price")).toBe(true);
    expect(usedAssumptions.some((row) => row.label === "Electrolyzer capacity limit")).toBe(false);
  });
});
