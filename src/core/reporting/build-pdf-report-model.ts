import type { CalculationResult } from "@/core/domain/result";

import { buildScenarioExcelExportModel, type ScenarioExcelExportModel } from "./build-export-model";

export type PdfChartPoint = {
  readonly dayIndex: number;
  readonly value: number;
};

export type PdfCostRevenuePoint = {
  readonly dayIndex: number;
  readonly totalCostEur: number;
  readonly methaneRevenueEur: number;
};

export type PdfReportOverview = {
  readonly scenarioName: string;
  readonly periodDays: number;
  readonly assumptionsVersion: string;
  readonly scenarioNotes: string;
};

export type PdfReportModel = {
  readonly generatedAtIso: string;
  readonly overview: PdfReportOverview;
  /** Shared tabular snapshot (same mapping as Excel export). */
  readonly excelModel: ScenarioExcelExportModel;
  /** Downsampled series for PDF charts only; values are subsets of canonical daily data. */
  readonly charts: {
    readonly co2KgPerDay: readonly PdfChartPoint[];
    readonly priceEurPerMwh: readonly PdfChartPoint[];
    readonly methaneKgPerDay: readonly PdfChartPoint[];
    readonly costRevenue: readonly PdfCostRevenuePoint[];
  };
};

const DEFAULT_CHART_MAX_POINTS = 96;

function downsampleByStride<T>(items: readonly T[], maxPoints: number): T[] {
  if (items.length <= maxPoints) {
    return [...items];
  }
  const step = Math.max(1, Math.ceil(items.length / maxPoints));
  const out: T[] = [];
  for (let i = 0; i < items.length; i += step) {
    out.push(items[i]!);
  }
  const last = items[items.length - 1]!;
  if (out[out.length - 1] !== last) {
    out.push(last);
  }
  return out;
}

/**
 * Narrative-oriented report model: reuses `ScenarioExcelExportModel` for tables/assumptions
 * and adds downsampled chart inputs from the same canonical result.
 */
export function buildScenarioPdfReportModel(
  result: CalculationResult,
  options?: { readonly generatedAt?: Date; readonly chartMaxPoints?: number },
): PdfReportModel {
  const excelModel = buildScenarioExcelExportModel(result);
  const maxPoints = options?.chartMaxPoints ?? DEFAULT_CHART_MAX_POINTS;
  const at = options?.generatedAt ?? new Date();

  const co2KgPerDay = downsampleByStride(
    result.resolvedDailyCo2.map((p) => ({ dayIndex: p.dayIndex, value: p.availableCO2Kg })),
    maxPoints,
  );
  const priceEurPerMwh = downsampleByStride(
    result.resolvedDailyElectricityPrice.map((p) => ({
      dayIndex: p.dayIndex,
      value: p.electricityPriceEurPerMWh,
    })),
    maxPoints,
  );
  const methaneKgPerDay = downsampleByStride(
    result.dailyResults.map((d) => ({ dayIndex: d.dayIndex, value: d.methaneProducedKg })),
    maxPoints,
  );
  const costRevenue = downsampleByStride(
    result.dailyResults.map((d) => ({
      dayIndex: d.dayIndex,
      totalCostEur: d.totalCostEur,
      methaneRevenueEur: d.methaneRevenueEur,
    })),
    maxPoints,
  );

  return {
    generatedAtIso: at.toISOString(),
    overview: {
      scenarioName: result.input.scenarioName,
      periodDays: result.input.periodDays,
      assumptionsVersion: result.input.assumptionsMeta.assumptionsVersion,
      scenarioNotes: result.input.assumptionsMeta.notes ?? "",
    },
    excelModel,
    charts: {
      co2KgPerDay,
      priceEurPerMwh,
      methaneKgPerDay,
      costRevenue,
    },
  };
}
