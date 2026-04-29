import type { ProcessAssumptionsInput } from "@/core/domain/assumptions";
import {
  USER_FACING_EXPORT_PROCESS_ASSUMPTION_KEYS,
  type UserFacingExportProcessAssumptionKey,
} from "@/core/domain/user-facing-process-assumptions";
import type { CalculationResult, DailyResult, MonthlySummary, ScenarioSummary } from "@/core/domain/result";
import type { ScenarioInput } from "@/core/domain/scenario";
import { translate, type Locale } from "@/i18n/messages";
import { buildEconomicVerdict, type EconomicVerdictCategory } from "@/core/reporting/build-economic-verdict";
import { usedAssumptionsToPrintable, type UsedAssumptionPrintRow } from "@/core/reporting/build-used-assumptions-model";
import {
  CO2_MODE_FLAT_ANNUAL,
  CO2_MODE_SEASONAL_DAILY,
  CO2_MODE_TIME_SERIES_DAILY,
  CO2_MODE_TIME_SERIES_HOURLY,
  ELECTRICITY_MODE_CONSTANT,
  ELECTRICITY_MODE_DAILY_SERIES,
  ELECTRICITY_MODE_HISTORICAL_IMPORTED,
  ELECTRICITY_MODE_HOURLY_SERIES,
} from "@/core/domain/scenario";

/*
 * Tabular / snapshot view models for Excel (and aligned PDF sections). Inputs are a fresh `CalculationResult`
 * from `calculateScenario` on the server (or the same in the browser for preview). This module only maps, labels,
 * and stringifies: it does not re-harmonize time series, re-aggregate KPIs, or trust any client-supplied totals.
 */

/**
 * User-facing process assumption rows in Excel/PDF (WP23). Inactive `plantAvailabilityPct` and
 * `processEfficiencyPct` stay on the canonical input but are omitted here.
 */
export const PROCESS_ASSUMPTION_EXPORT_ORDER: readonly UserFacingExportProcessAssumptionKey[] =
  USER_FACING_EXPORT_PROCESS_ASSUMPTION_KEYS;

export const PROCESS_ASSUMPTION_EXPORT_LABELS: Record<keyof ProcessAssumptionsInput, string> = {
  stoichiometricHydrogenDemandFactorKgH2PerKgCo2: "Stoichiometric H₂ demand",
  stoichiometricMethaneYieldFactorKgCh4PerKgCo2: "Stoichiometric CH₄ yield",
  electrolyzerSpecificEnergyConsumptionKwhPerKgH2: "Electrolyzer SEC (kWh)",
  electrolyzerSpecificEnergyConsumptionMwhPerKgH2: "Electrolyzer SEC (MWh)",
  plantAvailabilityPct: "Plant availability",
  processEfficiencyPct: "Process efficiency",
};

export const PROCESS_ASSUMPTION_EXPORT_UNITS: Record<keyof ProcessAssumptionsInput, string> = {
  stoichiometricHydrogenDemandFactorKgH2PerKgCo2: "kg H₂ / kg CO₂",
  stoichiometricMethaneYieldFactorKgCh4PerKgCo2: "kg CH₄ / kg CO₂",
  electrolyzerSpecificEnergyConsumptionKwhPerKgH2: "kWh / kg H₂",
  electrolyzerSpecificEnergyConsumptionMwhPerKgH2: "MWh / kg H₂",
  plantAvailabilityPct: "%",
  processEfficiencyPct: "%",
};

export type InputSnapshotRow =
  | { readonly kind: "section"; readonly title: string }
  | { readonly kind: "kv"; readonly key: string; readonly value: string };

export type ProcessAssumptionExportRow = {
  readonly fieldKey: keyof ProcessAssumptionsInput;
  readonly fieldLabel: string;
  readonly value: number;
  readonly unit: string;
  readonly assumptionSource: string;
  readonly assumptionStatus: string;
  readonly assumptionNote: string;
};

export type AnnualMetricExportRow = {
  readonly metricKey: string;
  readonly label: string;
  readonly value: number | null;
  readonly unit: string;
};

export type MonthlyExportRow = {
  readonly monthIndex: number;
  readonly firstDayIndex: number;
  readonly lastDayIndex: number;
  readonly usableCO2Kg: number;
  readonly freeCo2UsedKg: number;
  readonly purchasedCo2Kg: number;
  readonly co2PurchaseCostEur: number;
  readonly h2CapacityBindingDays: number;
  readonly ch4CapacityBindingDays: number;
  readonly methaneProducedKg: number;
  readonly electricityConsumedMwh: number;
  readonly totalCostEur: number;
  readonly methaneRevenueEur: number;
  readonly hydrogenAlternativeRevenueEur: number;
};

export type ComparisonExportRow = {
  readonly label: string;
  readonly valueEur: number;
};

/** Localized (export locale) block from `buildEconomicVerdict` for Excel/PDF. */
export type EconomicVerdictExportBlock = {
  readonly category: EconomicVerdictCategory;
  readonly title: string;
  readonly body: string;
  readonly details: readonly string[];
};

const EXPORT_TEXT_LOCALE: Locale = "en";

export type ScenarioExcelExportModel = {
  readonly inputs: readonly InputSnapshotRow[];
  /** WP25: same verdict helper as Results UI; strings in `EXPORT_TEXT_LOCALE` for current PDF/Excel copy. */
  readonly economicVerdict: EconomicVerdictExportBlock;
  /** WP25: shared used-assumptions model as printable rows (en). */
  readonly usedAssumptionsPrint: readonly UsedAssumptionPrintRow[];
  readonly processAssumptions: readonly ProcessAssumptionExportRow[];
  readonly co2Profile: {
    readonly headers: readonly string[];
    readonly rows: readonly { dayIndex: number; dateLabel: string; availableCO2Kg: number; unit: string }[];
  };
  readonly electricityPrice: {
    readonly headers: readonly string[];
    readonly rows: readonly { dayIndex: number; dateLabel: string; priceEurPerMwh: number; unit: string }[];
  };
  readonly dailyResults: {
    readonly headers: readonly string[];
    readonly rows: readonly Record<string, string | number>[];
  };
  readonly annualMetrics: readonly AnnualMetricExportRow[];
  readonly monthlyRows: readonly MonthlyExportRow[];
  readonly comparison: readonly ComparisonExportRow[];
  readonly warnings: readonly string[];
};

function pushSection(rows: InputSnapshotRow[], title: string) {
  rows.push({ kind: "section", title });
}

function pushKv(rows: InputSnapshotRow[], key: string, value: string) {
  rows.push({ kind: "kv", key, value });
}

function serializeScenarioInputSnapshot(input: ScenarioInput): readonly InputSnapshotRow[] {
  const rows: InputSnapshotRow[] = [];

  pushSection(rows, "Scenario");
  pushKv(rows, "scenarioName", input.scenarioName);
  pushKv(rows, "periodDays", String(input.periodDays));

  pushSection(rows, "Assumptions metadata");
  pushKv(rows, "assumptionsVersion", input.assumptionsMeta.assumptionsVersion);
  pushKv(rows, "notes", input.assumptionsMeta.notes ?? "");

  pushSection(rows, "CO₂ input");
  pushKv(rows, "annualAmountKtPerYear", String(input.co2.annualAmountKtPerYear));
  pushKv(rows, "utilizationRatePct", String(input.co2.utilizationRatePct));
  const av = input.co2.availability;
  pushKv(rows, "availability.mode", av.mode);
  if (av.mode === CO2_MODE_FLAT_ANNUAL) {
    // no extra fields
  } else if (av.mode === CO2_MODE_SEASONAL_DAILY) {
    pushKv(rows, "availability.monthlyRelativeWeights (12)", av.monthlyRelativeWeights.join(", "));
  } else if (av.mode === CO2_MODE_TIME_SERIES_DAILY) {
    pushKv(rows, "availability.dailyAvailableCo2Kg.length", String(av.dailyAvailableCo2Kg.length));
  } else if (av.mode === CO2_MODE_TIME_SERIES_HOURLY) {
    pushKv(rows, "availability.hourlyAvailableCo2Kg.length", String(av.hourlyAvailableCo2Kg.length));
  }
  pushKv(rows, "marketPurchase.mode", input.co2.marketPurchase?.mode ?? "disabled");
  if (input.co2.marketPurchase?.mode === "enabled") {
    pushKv(
      rows,
      "marketPurchase.purchasePriceEurPerTco2",
      String(input.co2.marketPurchase.purchasePriceEurPerTco2),
    );
  }

  pushSection(rows, "Plant capacity input");
  pushKv(
    rows,
    "electrolyzerMaxH2KgPerDay",
    input.plant?.electrolyzerMaxH2KgPerDay == null
      ? "unbounded"
      : String(input.plant.electrolyzerMaxH2KgPerDay),
  );
  pushKv(
    rows,
    "methanationMaxCh4KgPerDay",
    input.plant?.methanationMaxCh4KgPerDay == null
      ? "unbounded"
      : String(input.plant.methanationMaxCh4KgPerDay),
  );

  pushSection(rows, "Electricity purchase price input");
  const el = input.electricity;
  pushKv(rows, "electricity.mode", el.mode);
  if (el.mode === ELECTRICITY_MODE_CONSTANT) {
    pushKv(rows, "priceEurPerMwh", String(el.priceEurPerMwh));
  } else if (el.mode === ELECTRICITY_MODE_DAILY_SERIES) {
    pushKv(rows, "dailyPricesEurPerMwh.length", String(el.dailyPricesEurPerMwh.length));
  } else if (el.mode === ELECTRICITY_MODE_HOURLY_SERIES) {
    pushKv(rows, "hourlyPricesEurPerMwh.length", String(el.hourlyPricesEurPerMwh.length));
  } else if (el.mode === ELECTRICITY_MODE_HISTORICAL_IMPORTED) {
    pushKv(rows, "resolution", el.resolution);
    pushKv(rows, "pricesEurPerMwh.length", String(el.pricesEurPerMwh.length));
  }

  pushSection(rows, "Economics input (sales price assumptions and OPEX)");
  pushKv(rows, "methanePriceEurPerTch4", String(input.economics.methanePriceEurPerTch4));
  pushKv(rows, "hydrogenPriceEurPerKg", String(input.economics.hydrogenPriceEurPerKg));
  pushKv(rows, "otherOpexEurPerYear", String(input.economics.otherOpexEurPerYear));
  pushKv(rows, "includeCapex", String(input.economics.includeCapex));
  if (input.economics.includeCapex) {
    pushKv(rows, "electrolyzerCapexEur", String(input.economics.electrolyzerCapexEur ?? ""));
    pushKv(rows, "methanationCapexEur", String(input.economics.methanationCapexEur ?? ""));
    pushKv(rows, "capexLifetimeYears", String(input.economics.capexLifetimeYears ?? ""));
  }

  return rows;
}

function buildProcessAssumptionRows(process: ProcessAssumptionsInput): readonly ProcessAssumptionExportRow[] {
  return PROCESS_ASSUMPTION_EXPORT_ORDER.map((fieldKey) => {
    const field = process[fieldKey];
    const meta = field.assumptionMeta;
    return {
      fieldKey,
      fieldLabel: PROCESS_ASSUMPTION_EXPORT_LABELS[fieldKey],
      value: field.value,
      unit: PROCESS_ASSUMPTION_EXPORT_UNITS[fieldKey],
      assumptionSource: meta.assumptionSource,
      assumptionStatus: meta.assumptionStatus,
      assumptionNote: meta.assumptionNote ?? "",
    };
  });
}

function buildAnnualMetricRows(summary: ScenarioSummary): readonly AnnualMetricExportRow[] {
  return [
    {
      metricKey: "annualCO2AvailableKg",
      label: "Annual CO₂ available",
      value: summary.annualCO2AvailableKg,
      unit: "kg",
    },
    {
      metricKey: "annualCO2UtilizedKg",
      label: "Total process CO₂ feed",
      value: summary.annualCO2UtilizedKg,
      unit: "kg",
    },
    {
      metricKey: "annualFreeCo2UsedKg",
      label: "Side-stream CO₂ used",
      value: summary.annualFreeCo2UsedKg,
      unit: "kg",
    },
    { metricKey: "annualPurchasedCo2Kg", label: "Purchased CO₂", value: summary.annualPurchasedCo2Kg, unit: "kg" },
    {
      metricKey: "annualCo2PurchaseCostEur",
      label: "Annual CO₂ purchase cost",
      value: summary.annualCo2PurchaseCostEur,
      unit: "EUR",
    },
    {
      metricKey: "co2RecyclingRatePct",
      label: "Side-stream recycling rate",
      value: summary.co2RecyclingRatePct,
      unit: "%",
    },
    {
      metricKey: "annualMethaneProducedTons",
      label: "Annual methane produced",
      value: summary.annualMethaneProducedTons,
      unit: "t CH₄",
    },
    {
      metricKey: "annualHydrogenNeededKg",
      label: "Annual hydrogen needed",
      value: summary.annualHydrogenNeededKg,
      unit: "kg H₂",
    },
    {
      metricKey: "annualElectricityConsumedMwh",
      label: "Annual electricity consumed",
      value: summary.annualElectricityConsumedMwh,
      unit: "MWh",
    },
    {
      metricKey: "annualVariableCostEur",
      label: "Annual variable cost",
      value: summary.annualVariableCostEur,
      unit: "EUR",
    },
    { metricKey: "annualCapexCostEur", label: "Annual CAPEX allocation", value: summary.annualCapexCostEur, unit: "EUR" },
    { metricKey: "annualTotalCostEur", label: "Annual total cost", value: summary.annualTotalCostEur, unit: "EUR" },
    { metricKey: "annualMethaneRevenueEur", label: "Annual methane revenue", value: summary.annualMethaneRevenueEur, unit: "EUR" },
    {
      metricKey: "hydrogenSalesAlternativeRevenueEur",
      label: "Hydrogen sales alternative revenue",
      value: summary.hydrogenSalesAlternativeRevenueEur,
      unit: "EUR",
    },
    {
      metricKey: "breakEvenMethanePriceEurPerTon",
      label: "Break-even methane sales price (derived)",
      value: summary.breakEvenMethanePriceEurPerTon,
      unit: "EUR/t CH₄",
    },
    {
      metricKey: "methanePriceAt10PctProfitabilityEurPerTon",
      label: "Derived methane sales price at 10% profitability",
      value: summary.methanePriceAt10PctProfitabilityEurPerTon,
      unit: "EUR/t CH₄",
    },
    {
      metricKey: "methanePriceAt30PctProfitabilityEurPerTon",
      label: "Derived methane sales price at 30% profitability",
      value: summary.methanePriceAt30PctProfitabilityEurPerTon,
      unit: "EUR/t CH₄",
    },
    {
      metricKey: "deltaVsHydrogenSaleEur",
      label: "Delta vs hydrogen sale",
      value: summary.deltaVsHydrogenSaleEur,
      unit: "EUR",
    },
    {
      metricKey: "h2CapacityBindingDays",
      label: "Electrolyzer bottleneck days",
      value: summary.h2CapacityBindingDays,
      unit: "days",
    },
    {
      metricKey: "ch4CapacityBindingDays",
      label: "Methanation bottleneck days",
      value: summary.ch4CapacityBindingDays,
      unit: "days",
    },
  ];
}

function buildMonthlyRows(monthly: readonly MonthlySummary[]): readonly MonthlyExportRow[] {
  return monthly.map((m) => ({
    monthIndex: m.monthIndex,
    firstDayIndex: m.firstDayIndex,
    lastDayIndex: m.lastDayIndex,
    usableCO2Kg: m.sums.usableCO2Kg,
    freeCo2UsedKg: m.sums.freeCo2UsedKg,
    purchasedCo2Kg: m.sums.purchasedCo2Kg,
    co2PurchaseCostEur: m.sums.co2PurchaseCostEur,
    h2CapacityBindingDays: m.h2CapacityBindingDays,
    ch4CapacityBindingDays: m.ch4CapacityBindingDays,
    methaneProducedKg: m.sums.methaneProducedKg,
    electricityConsumedMwh: m.sums.electricityConsumedMwh,
    totalCostEur: m.sums.totalCostEur,
    methaneRevenueEur: m.sums.methaneRevenueEur,
    hydrogenAlternativeRevenueEur: m.sums.hydrogenAlternativeRevenueEur,
  }));
}

function dailyResultToRow(d: DailyResult): Record<string, string | number> {
  return {
    dayIndex: d.dayIndex,
    dateLabel: d.dateLabel,
    availableCO2Kg: d.availableCO2Kg,
    usableCO2Kg: d.usableCO2Kg,
    freeCo2UsedKg: d.freeCo2UsedKg,
    purchasedCo2Kg: d.purchasedCo2Kg,
    co2PurchaseCostEur: d.co2PurchaseCostEur,
    h2CapacityBinding: d.h2CapacityBinding ? 1 : 0,
    ch4CapacityBinding: d.ch4CapacityBinding ? 1 : 0,
    hydrogenNeededKg: d.hydrogenNeededKg,
    methaneProducedKg: d.methaneProducedKg,
    electricityConsumedMwh: d.electricityConsumedMwh,
    electricityCostEur: d.electricityCostEur,
    variableCostEur: d.variableCostEur,
    allocatedCapexCostEur: d.allocatedCapexCostEur,
    totalCostEur: d.totalCostEur,
    methaneRevenueEur: d.methaneRevenueEur,
    hydrogenAlternativeRevenueEur: d.hydrogenAlternativeRevenueEur,
  };
}

/**
 * Pure view-model of canonical `CalculationResult` for Excel (and future PDF) layout.
 * No business recomputation: copies and labels fields that already exist on the result contract.
 */
export function buildScenarioExcelExportModel(result: CalculationResult): ScenarioExcelExportModel {
  const input = result.input;
  const verdictDto = buildEconomicVerdict(result.annualSummary);

  const dailyHeaders = [
    "dayIndex",
    "dateLabel",
    "availableCO2Kg",
    "usableCO2Kg",
    "freeCo2UsedKg",
    "purchasedCo2Kg",
    "co2PurchaseCostEur",
    "h2CapacityBinding",
    "ch4CapacityBinding",
    "hydrogenNeededKg",
    "methaneProducedKg",
    "electricityConsumedMwh",
    "electricityCostEur",
    "variableCostEur",
    "allocatedCapexCostEur",
    "totalCostEur",
    "methaneRevenueEur",
    "hydrogenAlternativeRevenueEur",
  ] as const;

  return {
    inputs: serializeScenarioInputSnapshot(input),
    economicVerdict: {
      category: verdictDto.category,
      title: translate(EXPORT_TEXT_LOCALE, verdictDto.titleKey),
      body: translate(EXPORT_TEXT_LOCALE, verdictDto.bodyKey),
      details: verdictDto.detailKeys.map((k) => translate(EXPORT_TEXT_LOCALE, k)),
    },
    usedAssumptionsPrint: usedAssumptionsToPrintable(result, EXPORT_TEXT_LOCALE),
    processAssumptions: buildProcessAssumptionRows(input.process),
    co2Profile: {
      headers: ["dayIndex", "dateLabel", "availableCO2Kg", "unit"],
      rows: result.resolvedDailyCo2.map((p) => ({
        dayIndex: p.dayIndex,
        dateLabel: p.dateLabel,
        availableCO2Kg: p.availableCO2Kg,
        unit: "kg/day",
      })),
    },
    electricityPrice: {
      headers: ["dayIndex", "dateLabel", "electricityPriceEurPerMWh", "unit"],
      rows: result.resolvedDailyElectricityPrice.map((p) => ({
        dayIndex: p.dayIndex,
        dateLabel: p.dateLabel,
        priceEurPerMwh: p.electricityPriceEurPerMWh,
        unit: "EUR/MWh",
      })),
    },
    dailyResults: {
      headers: [...dailyHeaders],
      rows: result.dailyResults.map(dailyResultToRow),
    },
    annualMetrics: buildAnnualMetricRows(result.annualSummary),
    monthlyRows: buildMonthlyRows(result.monthlySummary),
    comparison: [
      { label: "Annual revenue — methane path", valueEur: result.annualSummary.annualMethaneRevenueEur },
      {
        label: "Annual revenue — hydrogen alternative (same H₂ as methane path)",
        valueEur: result.annualSummary.hydrogenSalesAlternativeRevenueEur,
      },
      { label: "Difference (methane minus hydrogen alternative)", valueEur: result.annualSummary.deltaVsHydrogenSaleEur },
    ],
    warnings: [...result.warnings],
  };
}
