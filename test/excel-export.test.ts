import { describe, expect, it } from "vitest";

import { calculateScenario } from "@/core/calculation/calculate-scenario";
import { buildScenarioExcelExportModel } from "@/core/reporting/build-export-model";
import { assertExcelModelReady, ExcelExportModelInvariantError } from "@/core/reporting/build-excel-model";
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

function wp28ScenarioRaw() {
  return {
    ...minimalScenarioRaw(),
    scenarioName: "WP28 Excel export test",
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
      "Economic verdict",
      "Used assumptions",
      "Assumptions",
      "CO2 Profile",
      "Electricity purchase price",
      "Daily Results",
      "Annual Summary",
      "Comparison",
      "Warnings",
    ]);
  });

  it("rejects excel models with corrupted warnings shape", () => {
    const result = calculateScenario(parseScenarioInput(minimalScenarioRaw()));
    const model = buildScenarioExcelExportModel(result);
    const bad = { ...model, warnings: [1] as unknown as string[] };
    expect(() => assertExcelModelReady(bad)).toThrow(ExcelExportModelInvariantError);
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

  it("maps WP28 annual, daily, and monthly fields from canonical result", () => {
    const result = calculateScenario(parseScenarioInput(wp28ScenarioRaw()));
    const model = buildScenarioExcelExportModel(result);
    const annualMap = new Map(model.annualMetrics.map((r) => [r.metricKey, r]));

    expect(annualMap.get("annualCO2UtilizedKg")?.label).toBe("Total process CO₂ feed");
    expect(annualMap.get("annualFreeCo2UsedKg")?.value).toBe(result.annualSummary.annualFreeCo2UsedKg);
    expect(annualMap.get("annualPurchasedCo2Kg")?.value).toBe(result.annualSummary.annualPurchasedCo2Kg);
    expect(annualMap.get("annualCo2PurchaseCostEur")?.value).toBe(result.annualSummary.annualCo2PurchaseCostEur);
    expect(annualMap.get("co2RecyclingRatePct")?.label).toBe("Side-stream recycling rate");
    expect(annualMap.get("ch4CapacityBindingDays")?.value).toBe(result.annualSummary.ch4CapacityBindingDays);

    expect(model.dailyResults.headers).toEqual(
      expect.arrayContaining([
        "freeCo2UsedKg",
        "purchasedCo2Kg",
        "co2PurchaseCostEur",
        "h2CapacityBinding",
        "ch4CapacityBinding",
      ]),
    );
    expect(model.dailyResults.rows[0]!.purchasedCo2Kg).toBe(result.dailyResults[0]!.purchasedCo2Kg);
    expect(model.dailyResults.rows[0]!.co2PurchaseCostEur).toBe(result.dailyResults[0]!.co2PurchaseCostEur);

    expect(model.monthlyRows[0]!.freeCo2UsedKg).toBe(result.monthlySummary[0]!.sums.freeCo2UsedKg);
    expect(model.monthlyRows[0]!.purchasedCo2Kg).toBe(result.monthlySummary[0]!.sums.purchasedCo2Kg);
    expect(model.monthlyRows[0]!.co2PurchaseCostEur).toBe(result.monthlySummary[0]!.sums.co2PurchaseCostEur);
    expect(model.monthlyRows[0]!.ch4CapacityBindingDays).toBe(result.monthlySummary[0]!.ch4CapacityBindingDays);
  });

  it("includes WP28 input and used-assumption rows only for active capacity and market purchase", () => {
    const result = calculateScenario(parseScenarioInput(wp28ScenarioRaw()));
    const model = buildScenarioExcelExportModel(result);
    const inputRows = model.inputs.filter((r) => r.kind === "kv");
    const inputMap = new Map(inputRows.map((r) => [r.key, r.value]));

    expect(inputMap.get("marketPurchase.mode")).toBe("enabled");
    expect(inputMap.get("marketPurchase.purchasePriceEurPerTco2")).toBe("80");
    expect(inputMap.get("electrolyzerMaxH2KgPerDay")).toBe("unbounded");
    expect(inputMap.get("methanationMaxCh4KgPerDay")).toBe("1000");

    const labels = model.usedAssumptionsPrint.map((r) => r.label);
    expect(labels).toContain("Methanation capacity limit");
    expect(labels).toContain("Market CO₂ purchase price");
    expect(labels).not.toContain("Electrolyzer capacity limit");
  });

  it("writes WP28 daily/monthly headers into the workbook", () => {
    const result = calculateScenario(parseScenarioInput(wp28ScenarioRaw()));
    const model = buildScenarioExcelExportModel(result);
    const wb = buildScenarioExcelWorkbook(model);
    const daily = wb.getWorksheet("Daily Results");
    const annual = wb.getWorksheet("Annual Summary");

    expect(daily?.getRow(1).values).toEqual(
      expect.arrayContaining(["freeCo2UsedKg", "purchasedCo2Kg", "co2PurchaseCostEur"]),
    );
    const monthlyHeaderValues = annual?.getRow(annual.rowCount - 12).values;
    expect(monthlyHeaderValues).toEqual(
      expect.arrayContaining(["freeCo2UsedKg", "purchasedCo2Kg", "co2PurchaseCostEur"]),
    );
  });
});
