import { USER_FACING_EXPORT_PROCESS_ASSUMPTION_KEYS } from "@/core/domain/user-facing-process-assumptions";
import type { ProcessAssumptionsInput } from "@/core/domain/assumptions";
import type { CalculationResult } from "@/core/domain/result";
import { DEFAULT_SEASONAL_CO2_RELATIVE_WEIGHTS } from "@/core/domain/seasonal-co2-default-weights";
import type { ScenarioInput } from "@/core/domain/scenario";
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
import { computeNumericSeriesStats } from "@/features/scenario/input-ui/imported-electricity-series";
import { FINLAND_2025_DAILY_EUR_PER_MWH, FINLAND_2025_HOURLY_EUR_PER_MWH } from "@/data/electricity-defaults-2025-fi";
import { translate, type Locale } from "@/i18n/messages";
import {
  DISPLAY_VALUE_NA,
  formatDisplayNumber,
  formatScaledCurrencyEur,
} from "@/core/presentation/format-scaled-number";

/**
 * Grouped, canonical snapshot of inputs that fed `calculateScenario` (plus a few display-only
 * context fields from the result). For UI and export; no business recomputation.
 */
export type UsedAssumptionGroupId =
  | "scenario"
  | "co2"
  | "electricity"
  | "economics"
  | "capex"
  | "process";

export type UsedAssumptionKind = "user_input" | "default" | "derived" | "imported_data";

export type UsedAssumptionRow = {
  readonly id: string;
  readonly groupId: UsedAssumptionGroupId;
  /** i18n key for the row label (dot path under `MessageTree`). */
  readonly labelKey: string;
  /** When set, value is a pointer into messages (e.g. mode code). */
  readonly valueKey?: string;
  /** Raw value for display formatting in UI (numbers, or short strings for stats). */
  readonly value: string | number | null;
  /** Optional i18n key for unit label */
  readonly unitKey?: string;
  readonly sourceKey?: string;
  readonly statusKey?: string;
  /** Free-text from process meta (already human-readable) */
  readonly note?: string;
  readonly kind?: UsedAssumptionKind;
};

const PROCESS_LABEL_KEYS: Record<(typeof USER_FACING_EXPORT_PROCESS_ASSUMPTION_KEYS)[number], string> = {
  stoichiometricHydrogenDemandFactorKgH2PerKgCo2: "advanced.field_stoichH2",
  stoichiometricMethaneYieldFactorKgCh4PerKgCo2: "advanced.field_stoichCh4",
  electrolyzerSpecificEnergyConsumptionKwhPerKgH2: "advanced.field_secKwh",
  electrolyzerSpecificEnergyConsumptionMwhPerKgH2: "advanced.field_secMwh",
};

const PROCESS_UNIT_KEYS: Record<(typeof USER_FACING_EXPORT_PROCESS_ASSUMPTION_KEYS)[number], string> = {
  stoichiometricHydrogenDemandFactorKgH2PerKgCo2: "advanced.unit_stoichH2",
  stoichiometricMethaneYieldFactorKgCh4PerKgCo2: "advanced.unit_stoichCh4",
  electrolyzerSpecificEnergyConsumptionKwhPerKgH2: "advanced.unit_secKwh",
  electrolyzerSpecificEnergyConsumptionMwhPerKgH2: "advanced.unit_secMwh",
};

function isSameNumberArray(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function isBundledFinland2025ImportedPrices(
  resolution: "daily" | "hourly",
  prices: readonly number[],
): boolean {
  const ref = resolution === "daily" ? FINLAND_2025_DAILY_EUR_PER_MWH : FINLAND_2025_HOURLY_EUR_PER_MWH;
  return isSameNumberArray(prices, ref);
}

function isDefaultSeasonalWeights(weights: readonly number[]): boolean {
  if (weights.length !== 12) return false;
  return weights.every((w, i) => Math.abs(w - DEFAULT_SEASONAL_CO2_RELATIVE_WEIGHTS[i]!) < 1e-9);
}

function co2ModeValueKey(
  mode: string,
):
  | "co2.mode_flat_annual"
  | "co2.mode_seasonal_daily"
  | "co2.mode_time_series_daily"
  | "co2.mode_time_series_hourly" {
  if (mode === CO2_MODE_FLAT_ANNUAL) return "co2.mode_flat_annual";
  if (mode === CO2_MODE_SEASONAL_DAILY) return "co2.mode_seasonal_daily";
  if (mode === CO2_MODE_TIME_SERIES_DAILY) return "co2.mode_time_series_daily";
  return "co2.mode_time_series_hourly";
}

function elModeValueKey(
  mode: string,
):
  | "electricity.mode_constant"
  | "electricity.mode_daily_series"
  | "electricity.mode_hourly_series"
  | "electricity.mode_historical_imported" {
  if (mode === ELECTRICITY_MODE_CONSTANT) return "electricity.mode_constant";
  if (mode === ELECTRICITY_MODE_DAILY_SERIES) return "electricity.mode_daily_series";
  if (mode === ELECTRICITY_MODE_HOURLY_SERIES) return "electricity.mode_hourly_series";
  return "electricity.mode_historical_imported";
}

function pushProcessRows(input: ProcessAssumptionsInput, out: UsedAssumptionRow[]) {
  for (const key of USER_FACING_EXPORT_PROCESS_ASSUMPTION_KEYS) {
    const field = input[key];
    const meta = field.assumptionMeta;
    const derived = key === "electrolyzerSpecificEnergyConsumptionMwhPerKgH2";
    out.push({
      id: `process.${key}`,
      groupId: "process",
      labelKey: PROCESS_LABEL_KEYS[key],
      value: field.value,
      unitKey: PROCESS_UNIT_KEYS[key],
      sourceKey: `assumptionSource.${meta.assumptionSource}`,
      statusKey: `assumptionStatus.${meta.assumptionStatus}`,
      note: meta.assumptionNote || undefined,
      kind: derived
        ? "derived"
        : meta.assumptionSource === "literature_based"
          ? "default"
          : "user_input",
    });
  }
}

/**
 * All assumption rows for “Assumptions used in this calculation”, from canonical `CalculationResult`.
 * Omits plant availability and process efficiency (WP23).
 */
export function buildUsedAssumptionsModel(result: CalculationResult): readonly UsedAssumptionRow[] {
  const input: ScenarioInput = result.input;
  const s = result.annualSummary;
  const rows: UsedAssumptionRow[] = [];

  rows.push(
    {
      id: "scenario.name",
      groupId: "scenario",
      labelKey: "results.usedAssumptions.scenarioName",
      value: input.scenarioName,
    },
    {
      id: "scenario.period",
      groupId: "scenario",
      labelKey: "results.usedAssumptions.analysisPeriod",
      value: input.periodDays,
      unitKey: "results.usedAssumptions.unit.days",
    },
    {
      id: "scenario.assumptionsVersion",
      groupId: "scenario",
      labelKey: "results.usedAssumptions.assumptionsVersion",
      value: input.assumptionsMeta.assumptionsVersion,
    },
  );
  if (input.assumptionsMeta.notes) {
    rows.push({
      id: "scenario.notes",
      groupId: "scenario",
      labelKey: "results.summary.scenarioNotes",
      value: input.assumptionsMeta.notes,
    });
  }

  rows.push(
    {
      id: "co2.annualKt",
      groupId: "co2",
      labelKey: "co2.annualKt",
      value: input.co2.annualAmountKtPerYear,
      unitKey: "units.co2KtPerYear",
    },
    {
      id: "co2.annualAvailableKg",
      groupId: "co2",
      labelKey: "results.usedAssumptions.annualCo2AvailableFromResult",
      value: s.annualCO2AvailableKg,
      unitKey: "results.usedAssumptions.unit.kg",
    },
    {
      id: "co2.utilization",
      groupId: "co2",
      labelKey: "co2.utilization",
      value: input.co2.utilizationRatePct,
      unitKey: "results.usedAssumptions.unit.percent",
    },
  );

  const av = input.co2.availability;
  rows.push({
    id: "co2.mode",
    groupId: "co2",
    labelKey: "co2.mode",
    valueKey: co2ModeValueKey(av.mode),
    value: av.mode,
  });

  if (av.mode === CO2_MODE_SEASONAL_DAILY) {
    const def = isDefaultSeasonalWeights(av.monthlyRelativeWeights);
    rows.push({
      id: "co2.seasonalProfile",
      groupId: "co2",
      labelKey: "results.usedAssumptions.seasonalMonthlyWeights",
      value: av.monthlyRelativeWeights.map((n) => String(n)).join(", "),
    });
    if (def) {
      rows.push({
        id: "co2.seasonalDefault",
        groupId: "co2",
        labelKey: "results.usedAssumptions.seasonalDefaultFlag",
        valueKey: "co2.seasonalDefaultProfileNote",
        value: null,
        kind: "default",
      });
    }
  } else if (av.mode === CO2_MODE_TIME_SERIES_DAILY) {
    const st = computeNumericSeriesStats(av.dailyAvailableCo2Kg);
    rows.push({
      id: "co2.seriesDaily",
      groupId: "co2",
      labelKey: "co2.seriesDailyLabel",
      value: st
        ? `${st.count} · min ${st.min.toFixed(2)} · max ${st.max.toFixed(2)}`
        : "—",
    });
  } else if (av.mode === CO2_MODE_TIME_SERIES_HOURLY) {
    const st = computeNumericSeriesStats(av.hourlyAvailableCo2Kg);
    rows.push({
      id: "co2.seriesHourly",
      groupId: "co2",
      labelKey: "co2.seriesHourlyLabel",
      value: st
        ? `${st.count} · min ${st.min.toFixed(4)} · max ${st.max.toFixed(4)}`
        : "—",
    });
  }

  const el = input.electricity;
  rows.push({
    id: "electricity.mode",
    groupId: "electricity",
    labelKey: "electricity.mode",
    valueKey: elModeValueKey(el.mode),
    value: el.mode,
  });

  if (el.mode === ELECTRICITY_MODE_CONSTANT) {
    rows.push({
      id: "electricity.constantPrice",
      groupId: "electricity",
      labelKey: "electricity.constantPrice",
      value: el.priceEurPerMwh,
      unitKey: "results.usedAssumptions.unit.eurPerMwh",
    });
  } else if (el.mode === ELECTRICITY_MODE_DAILY_SERIES) {
    const st = computeNumericSeriesStats(el.dailyPricesEurPerMwh);
    rows.push({
      id: "electricity.dailySeries",
      groupId: "electricity",
      labelKey: "electricity.seriesDailyLabel",
      value: st
        ? `${st.count} · min ${st.min.toFixed(2)} · max ${st.max.toFixed(2)}`
        : "—",
      unitKey: "results.usedAssumptions.unit.eurPerMwh",
    });
  } else if (el.mode === ELECTRICITY_MODE_HOURLY_SERIES) {
    const st = computeNumericSeriesStats(el.hourlyPricesEurPerMwh);
    rows.push({
      id: "electricity.hourlySeries",
      groupId: "electricity",
      labelKey: "electricity.seriesHourlyLabel",
      value: st
        ? `${st.count} · min ${st.min.toFixed(2)} · max ${st.max.toFixed(2)}`
        : "—",
      unitKey: "results.usedAssumptions.unit.eurPerMwh",
    });
  } else if (el.mode === ELECTRICITY_MODE_HISTORICAL_IMPORTED) {
    const st = computeNumericSeriesStats(el.pricesEurPerMwh);
    const bundled = isBundledFinland2025ImportedPrices(el.resolution, el.pricesEurPerMwh);
    rows.push(
      {
        id: "electricity.importedResolution",
        groupId: "electricity",
        labelKey: "electricity.historicalResolution",
        valueKey:
          el.resolution === "daily"
            ? "electricity.importedStatsResolutionDaily"
            : "electricity.importedStatsResolutionHourly",
        value: el.resolution,
        kind: bundled ? "imported_data" : "user_input",
      },
      {
        id: "electricity.importedStats",
        groupId: "electricity",
        labelKey: "results.usedAssumptions.importedSeriesStats",
        value: st
          ? `${st.count} · mean ${st.mean.toFixed(2)} · min ${st.min.toFixed(2)} · max ${st.max.toFixed(2)}`
          : "—",
        unitKey: "results.usedAssumptions.unit.eurPerMwh",
      },
    );
    rows.push({
      id: "electricity.importedSource",
      groupId: "electricity",
      labelKey: "results.usedAssumptions.importedDataSource",
      valueKey: bundled
        ? "electricity.importedStatsSourceBundled"
        : "electricity.importedStatsSourceUser",
      value: bundled ? "bundled" : "user",
    });
    rows.push({
      id: "electricity.importedVatCaveat",
      groupId: "electricity",
      labelKey: "electricity.importedVatNoticeTitle",
      valueKey: "electricity.importedVatNoticeBody",
      value: 1,
    });
  }

  rows.push(
    {
      id: "economics.methane",
      groupId: "economics",
      labelKey: "economics.methanePrice",
      value: input.economics.methanePriceEurPerTch4,
      unitKey: "results.usedAssumptions.unit.eurPerTch4",
    },
    {
      id: "economics.hydrogen",
      groupId: "economics",
      labelKey: "economics.hydrogenPrice",
      value: input.economics.hydrogenPriceEurPerKg,
      unitKey: "results.usedAssumptions.unit.eurPerKgH2",
    },
    {
      id: "economics.otherOpex",
      groupId: "economics",
      labelKey: "economics.otherOpex",
      value: input.economics.otherOpexEurPerYear,
      unitKey: "results.usedAssumptions.unit.eurPerYear",
    },
  );

  rows.push({
    id: "capex.include",
    groupId: "capex",
    labelKey: "economics.includeCapex",
    valueKey: input.economics.includeCapex
      ? "results.usedAssumptions.capexYes"
      : "results.usedAssumptions.capexNo",
    value: input.economics.includeCapex ? 1 : 0,
  });
  if (input.economics.includeCapex) {
    rows.push(
      {
        id: "capex.electrolyzer",
        groupId: "capex",
        labelKey: "economics.electrolyzerCapex",
        value: input.economics.electrolyzerCapexEur ?? null,
        unitKey: "results.usedAssumptions.unit.eur",
      },
      {
        id: "capex.methanation",
        groupId: "capex",
        labelKey: "economics.methanationCapex",
        value: input.economics.methanationCapexEur ?? null,
        unitKey: "results.usedAssumptions.unit.eur",
      },
      {
        id: "capex.lifetime",
        groupId: "capex",
        labelKey: "economics.capexLifetime",
        value: input.economics.capexLifetimeYears ?? null,
        unitKey: "results.usedAssumptions.unit.years",
      },
    );
  } else {
    rows.push({
      id: "capex.annualCapexResult",
      groupId: "capex",
      labelKey: "results.usedAssumptions.annualCapexInResult",
      value: s.annualCapexCostEur,
      unitKey: "results.usedAssumptions.unit.eur",
    });
  }

  pushProcessRows(input.process, rows);

  return rows;
}

export type UsedAssumptionPrintRow = {
  readonly groupId: UsedAssumptionGroupId;
  readonly groupLabel: string;
  readonly label: string;
  readonly value: string;
  readonly source?: string;
  readonly status?: string;
  readonly note?: string;
  readonly kind?: UsedAssumptionKind;
};

const EUR_AS_TOTAL_EUR_UNIT_KEYS = new Set<string>([
  "results.usedAssumptions.unit.eur",
  "results.usedAssumptions.unit.eurPerYear",
]);

function formatValueCell(
  row: UsedAssumptionRow,
  locale: Locale,
  opts: { numberLocale: string },
): string {
  if (row.valueKey) {
    return translate(locale, row.valueKey);
  }
  if (row.value === null || row.value === undefined) {
    return translate(locale, "results.value.na");
  }
  if (typeof row.value === "string") {
    return row.value;
  }
  const n = row.value;
  if (row.unitKey && EUR_AS_TOTAL_EUR_UNIT_KEYS.has(row.unitKey)) {
    const s = formatScaledCurrencyEur(n, { maxDecimals: 2 });
    if (s.formatted === DISPLAY_VALUE_NA) {
      return translate(locale, "results.value.na");
    }
    if (s.unit === "EUR") {
      return new Intl.NumberFormat(opts.numberLocale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
      }).format(n);
    }
    return `${s.formatted} ${translate(locale, `results.displayUnit.${s.unit}`)}`;
  }
  if (row.unitKey) {
    const u = translate(locale, row.unitKey);
    const num = formatDisplayNumber(n, { maxDecimals: 2, locale: opts.numberLocale });
    return u ? `${num} ${u}` : num;
  }
  return formatDisplayNumber(n, { maxDecimals: 2, locale: opts.numberLocale });
}

/**
 * Resolves the used-assumptions model to printable strings (Excel, PDF, server export).
 * Uses the same `CalculationResult` as the shared builder; `locale` controls label language.
 */
export function usedAssumptionsToPrintable(
  result: CalculationResult,
  locale: Locale,
): readonly UsedAssumptionPrintRow[] {
  const numberLocale = locale === "en" ? "en-GB" : locale === "sv" ? "sv-SE" : "fi-FI";
  return buildUsedAssumptionsModel(result).map((row) => ({
    groupId: row.groupId,
    groupLabel: translate(locale, `results.usedAssumptions.group.${row.groupId}`),
    label: translate(locale, row.labelKey),
    value: formatValueCell(row, locale, { numberLocale }),
    source: row.sourceKey ? translate(locale, row.sourceKey) : undefined,
    status: row.statusKey ? translate(locale, row.statusKey) : undefined,
    note: row.note,
    kind: row.kind,
  }));
}
