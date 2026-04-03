import type { AssumptionMeta } from "@/core/domain/assumptions";
import { SCENARIO_HOURLY_SLOTS, SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";

import { type ProcessSchemaKey, type ScenarioFormState } from "@/features/scenario/input-ui/form-state";
import { parseFiniteNumber, parseNumberSeries } from "@/features/scenario/input-ui/parse-number-series";

export type BuildPayloadIssue = {
  readonly path: string;
  readonly message: "series_parse" | "series_length" | "invalid" | "required";
  readonly expectedCount?: number;
  readonly actualCount?: number;
};

/**
 * Assembles the wire shape expected by `scenarioInputSchema`.
 * Returns client-side parse issues for series text (non-authoritative UX);
 * Zod remains authoritative on submit.
 */
export function buildScenarioPayload(
  state: ScenarioFormState,
): { ok: true; payload: unknown } | { ok: false; issues: BuildPayloadIssue[] } {
  const issues: BuildPayloadIssue[] = [];

  const annualAmountKtPerYear = parseFiniteNumber(state.annualAmountKtPerYear);
  const utilizationRatePct = parseFiniteNumber(state.utilizationRatePct);

  const availabilityResult = buildAvailability(state, issues);
  if (!availabilityResult) {
    return { ok: false, issues };
  }

  const electricityResult = buildElectricity(state, issues);
  if (!electricityResult) {
    return { ok: false, issues };
  }

  const economicsResult = buildEconomics(state, issues);
  if (!economicsResult) {
    return { ok: false, issues };
  }

  const processPartial = buildProcessPartial(state, issues);
  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const payload = {
    scenarioName: state.scenarioName.trim(),
    periodDays: SCENARIO_PERIOD_DAYS,
    co2: {
      annualAmountKtPerYear: annualAmountKtPerYear ?? Number.NaN,
      utilizationRatePct: utilizationRatePct ?? Number.NaN,
      availability: availabilityResult,
    },
    electricity: electricityResult,
    economics: economicsResult,
    process: processPartial!,
    assumptionsMeta: {
      assumptionsVersion: state.assumptionsVersion.trim(),
      ...(state.assumptionsNotes.trim() ? { notes: state.assumptionsNotes.trim() } : {}),
    },
  };

  return { ok: true, payload };
}

function buildAvailability(
  state: ScenarioFormState,
  issues: BuildPayloadIssue[],
): unknown | undefined {
  const b = state.co2;
  switch (b.mode) {
    case "flat_annual":
      return { mode: "flat_annual" as const };
    case "seasonal_daily": {
      const weights: number[] = [];
      for (let i = 0; i < 12; i++) {
        const n = parseFiniteNumber(b.monthlyWeights[i] ?? "");
        if (n === undefined) {
          issues.push({
            path: `co2.availability.monthlyRelativeWeights.${i}`,
            message: "invalid",
          });
          return undefined;
        }
        weights.push(n);
      }
      return {
        mode: "seasonal_daily" as const,
        monthlyRelativeWeights: weights as unknown as readonly [
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
          number,
        ],
      };
    }
    case "time_series_daily": {
      const parsed = parseNumberSeries(b.seriesText);
      if (!parsed.ok) {
        issues.push({ path: "co2.availability.dailyAvailableCo2Kg", message: "series_parse" });
        return undefined;
      }
      if (parsed.values.length !== SCENARIO_PERIOD_DAYS) {
        issues.push({
          path: "co2.availability.dailyAvailableCo2Kg",
          message: "series_length",
          expectedCount: SCENARIO_PERIOD_DAYS,
          actualCount: parsed.values.length,
        });
        return undefined;
      }
      return { mode: "time_series_daily" as const, dailyAvailableCo2Kg: parsed.values };
    }
    case "time_series_hourly": {
      const parsed = parseNumberSeries(b.seriesText);
      if (!parsed.ok) {
        issues.push({ path: "co2.availability.hourlyAvailableCo2Kg", message: "series_parse" });
        return undefined;
      }
      if (parsed.values.length !== SCENARIO_HOURLY_SLOTS) {
        issues.push({
          path: "co2.availability.hourlyAvailableCo2Kg",
          message: "series_length",
          expectedCount: SCENARIO_HOURLY_SLOTS,
          actualCount: parsed.values.length,
        });
        return undefined;
      }
      return { mode: "time_series_hourly" as const, hourlyAvailableCo2Kg: parsed.values };
    }
    default: {
      const _e: never = b;
      return _e;
    }
  }
}

function buildElectricity(
  state: ScenarioFormState,
  issues: BuildPayloadIssue[],
): unknown | undefined {
  const b = state.electricity;
  switch (b.mode) {
    case "constant": {
      const p = parseFiniteNumber(b.priceEurPerMwh);
      return {
        mode: "constant" as const,
        priceEurPerMwh: p ?? Number.NaN,
      };
    }
    case "daily_series": {
      const parsed = parseNumberSeries(b.seriesText);
      if (!parsed.ok) {
        issues.push({ path: "electricity.dailyPricesEurPerMwh", message: "series_parse" });
        return undefined;
      }
      if (parsed.values.length !== SCENARIO_PERIOD_DAYS) {
        issues.push({
          path: "electricity.dailyPricesEurPerMwh",
          message: "series_length",
          expectedCount: SCENARIO_PERIOD_DAYS,
          actualCount: parsed.values.length,
        });
        return undefined;
      }
      return { mode: "daily_series" as const, dailyPricesEurPerMwh: parsed.values };
    }
    case "hourly_series": {
      const parsed = parseNumberSeries(b.seriesText);
      if (!parsed.ok) {
        issues.push({ path: "electricity.hourlyPricesEurPerMwh", message: "series_parse" });
        return undefined;
      }
      if (parsed.values.length !== SCENARIO_HOURLY_SLOTS) {
        issues.push({
          path: "electricity.hourlyPricesEurPerMwh",
          message: "series_length",
          expectedCount: SCENARIO_HOURLY_SLOTS,
          actualCount: parsed.values.length,
        });
        return undefined;
      }
      return { mode: "hourly_series" as const, hourlyPricesEurPerMwh: parsed.values };
    }
    case "historical_market_data_imported": {
      const parsed = parseNumberSeries(b.seriesText);
      if (!parsed.ok) {
        issues.push({ path: "electricity.pricesEurPerMwh", message: "series_parse" });
        return undefined;
      }
      const expected = b.resolution === "daily" ? SCENARIO_PERIOD_DAYS : SCENARIO_HOURLY_SLOTS;
      if (parsed.values.length !== expected) {
        issues.push({
          path: "electricity.pricesEurPerMwh",
          message: "series_length",
          expectedCount: expected,
          actualCount: parsed.values.length,
        });
        return undefined;
      }
      return {
        mode: "historical_market_data_imported" as const,
        resolution: b.resolution,
        pricesEurPerMwh: parsed.values,
      };
    }
    default: {
      const _e: never = b;
      return _e;
    }
  }
}

function buildEconomics(
  state: ScenarioFormState,
  issues: BuildPayloadIssue[],
): Record<string, unknown> | undefined {
  const e = state.economics;
  const methane = parseFiniteNumber(e.methanePriceEurPerTch4);
  const hydrogen = parseFiniteNumber(e.hydrogenPriceEurPerKg);
  const opex = parseFiniteNumber(e.otherOpexEurPerYear);

  const base: Record<string, unknown> = {
    methanePriceEurPerTch4: methane ?? Number.NaN,
    hydrogenPriceEurPerKg: hydrogen ?? Number.NaN,
    otherOpexEurPerYear: opex ?? 0,
    includeCapex: e.includeCapex,
  };

  if (e.includeCapex) {
    const ez = parseFiniteNumber(e.electrolyzerCapexEur);
    const me = parseFiniteNumber(e.methanationCapexEur);
    const life = parseFiniteNumber(e.capexLifetimeYears);
    if (ez === undefined) {
      issues.push({ path: "economics.electrolyzerCapexEur", message: "required" });
    }
    if (me === undefined) {
      issues.push({ path: "economics.methanationCapexEur", message: "required" });
    }
    if (life === undefined) {
      issues.push({ path: "economics.capexLifetimeYears", message: "required" });
    }
    if (issues.some((i) => i.path.startsWith("economics."))) {
      return undefined;
    }
    base.electrolyzerCapexEur = ez;
    base.methanationCapexEur = me;
    base.capexLifetimeYears = life;
  }

  return base;
}

function buildProcessPartial(
  state: ScenarioFormState,
  issues: BuildPayloadIssue[],
): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  let bad = false;

  const addAssumption = (key: ProcessSchemaKey, meta: AssumptionMeta, value: number) => {
    out[key] = { value, assumptionMeta: meta };
  };

  for (const key of [
    "stoichiometricHydrogenDemandFactorKgH2PerKgCo2",
    "stoichiometricMethaneYieldFactorKgCh4PerKgCo2",
    "electrolyzerSpecificEnergyConsumptionKwhPerKgH2",
    "electrolyzerSpecificEnergyConsumptionMwhPerKgH2",
    "plantAvailabilityPct",
    "processEfficiencyPct",
  ] as const) {
    const row = state.process[key];
    if (!row.override) continue;
    const v = parseFiniteNumber(row.value);
    if (v === undefined) {
      issues.push({ path: `process.${key}.value`, message: "invalid" });
      bad = true;
      continue;
    }
    const meta: AssumptionMeta = {
      assumptionSource: row.assumptionSource,
      assumptionStatus: row.assumptionStatus,
      ...(row.assumptionNote.trim() ? { assumptionNote: row.assumptionNote.trim() } : {}),
    };
    addAssumption(key, meta, v);
  }

  if (bad) return undefined;
  return out;
}
