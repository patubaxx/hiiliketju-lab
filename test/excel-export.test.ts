import { describe, expect, it } from "vitest";

import { calculateScenario } from "@/core/calculation/calculate-scenario";
import { buildScenarioExcelExportModel } from "@/core/reporting/build-export-model";
import { buildScenarioExcelWorkbook } from "@/core/reporting/build-excel-workbook";
import { parseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

function minimalScenarioRaw() {
  return {
    scenarioName: "Excel export test",
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
    assumptionsMeta: { assumptionsVersion: "excel_export_test" },
    process: {},
  };
}

describe("Excel export model (WP7)", () => {
  it("maps canonical annualSummary values through without recomputation", () => {
    const result = calculateScenario(parseScenarioInput(minimalScenarioRaw()));
    const model = buildScenarioExcelExportModel(result);
    const annualMap = new Map(model.annualMetrics.map((r) => [r.metricKey, r.value]));
    expect(annualMap.get("annualTotalCostEur")).toBe(result.annualSummary.annualTotalCostEur);
    expect(annualMap.get("deltaVsHydrogenSaleEur")).toBe(result.annualSummary.deltaVsHydrogenSaleEur);
    expect(annualMap.get("co2RecyclingRatePct")).toBe(result.annualSummary.co2RecyclingRatePct);
  });

  it("passes through warnings as opaque strings", () => {
    const result = calculateScenario(parseScenarioInput(minimalScenarioRaw()));
    const model = buildScenarioExcelExportModel(result);
    expect(model.warnings).toEqual([...result.warnings]);
  });

  it("aligns daily row count with canonical dailyResults", () => {
    const result = calculateScenario(parseScenarioInput(minimalScenarioRaw()));
    const model = buildScenarioExcelExportModel(result);
    expect(model.dailyResults.rows.length).toBe(result.dailyResults.length);
    expect(model.co2Profile.rows.length).toBe(result.resolvedDailyCo2.length);
    expect(model.electricityPrice.rows.length).toBe(result.resolvedDailyElectricityPrice.length);
  });

  it("builds a workbook with expected sheet names", () => {
    const result = calculateScenario(parseScenarioInput(minimalScenarioRaw()));
    const model = buildScenarioExcelExportModel(result);
    const wb = buildScenarioExcelWorkbook(model);
    const names = wb.worksheets.map((s) => s.name);
    expect(names).toEqual([
      "Inputs",
      "Assumptions",
      "CO2 Profile",
      "Electricity Price",
      "Daily Results",
      "Annual Summary",
      "Comparison",
      "Warnings",
    ]);
  });

  it("copies process assumption metadata from canonical input without inventing fields", () => {
    const result = calculateScenario(parseScenarioInput(minimalScenarioRaw()));
    const model = buildScenarioExcelExportModel(result);
    const h2 = model.processAssumptions.find((r) => r.fieldKey === "stoichiometricHydrogenDemandFactorKgH2PerKgCo2");
    expect(h2).toBeDefined();
    expect(h2!.value).toBe(result.input.process.stoichiometricHydrogenDemandFactorKgH2PerKgCo2.value);
    expect(h2!.assumptionSource).toBe(
      result.input.process.stoichiometricHydrogenDemandFactorKgH2PerKgCo2.assumptionMeta.assumptionSource,
    );
    expect(h2!.assumptionStatus).toBe(
      result.input.process.stoichiometricHydrogenDemandFactorKgH2PerKgCo2.assumptionMeta.assumptionStatus,
    );
  });
});
