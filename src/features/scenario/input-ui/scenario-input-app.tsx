"use client";

/**
 * Scenario shell: form state → validation → canonical `calculateScenario` → results presentation.
 * Run pipeline: `buildScenarioPayload` (parses text/series for UX feedback) → `safeParseScenarioInput` (authoritative Zod)
 * → `mergeProcessAssumptionsInput` (literature defaults for omitted process fields) → `calculateScenario`.
 * Do not recompute KPIs or time series here; render from `CalculationResult` only.
 */
import * as React from "react";

import { ScenarioAppNavbar } from "./scenario-app-navbar";

import { Button } from "@/components/ui/button";
import { calculateScenario } from "@/core/calculation/calculate-scenario";
import { defaultProcessAssumptionsInput } from "@/core/domain/assumptions";
import type { AssumptionSource, AssumptionStatus } from "@/core/domain/assumptions";
import type { CalculationResult } from "@/core/domain/result";
import {
  electricityPriceEurPerMwhToInputDisplay,
  electricityPriceInputToEurPerMwh,
  type ElectricityPriceInputDisplayUnit,
} from "@/core/domain/input-display-unit-conversions";
import { mergeProcessAssumptionsInput, type ScenarioInput } from "@/core/domain/scenario";
import { SCENARIO_HOURLY_SLOTS, SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";
import {
  type BuildPayloadIssue,
  buildScenarioPayload,
} from "@/features/scenario/input-ui/build-scenario-payload";
import {
  FieldError,
  FieldHint,
  FieldLabel,
  Section,
  ShellSetupRegion,
  inputClassName,
  selectClassName,
  textAreaClassName,
} from "@/features/scenario/input-ui/form-primitives";
import { friendlyLabelForValidationPath } from "@/features/scenario/input-ui/validation-field-label";
import {
  FINLAND_2025_DAILY_EUR_PER_MWH,
  FINLAND_2025_HOURLY_EUR_PER_MWH,
  PROCESS_FIELD_ORDER,
  type Co2AvailabilityModeForm,
  type Co2FormBranch,
  type ElectricityModeForm,
  type ScenarioFormState,
  createInitialFormState,
  defaultCo2Branch,
  defaultElectricityBranch,
  isHydrogenPriceAtFactoryDefault,
  isMethanePriceAtFactoryDefault,
} from "@/features/scenario/input-ui/form-state";
import {
  isBundledFinland2025DefaultImportedSeries,
  summarizeImportedElectricitySeriesText,
} from "@/features/scenario/input-ui/imported-electricity-series";
import { parseFiniteNumber } from "@/features/scenario/input-ui/parse-number-series";
import { SeriesCsvImportControl } from "@/features/scenario/input-ui/series-csv-import-control";
import { translateZodIssueMessage } from "@/features/scenario/input-ui/translate-zod-issue-message";
import { zodIssuesToMap } from "@/features/scenario/input-ui/zod-issues-to-map";
import { formatResultNumber } from "@/features/scenario/results-ui/format-result-values";
import { ResultsPanel } from "@/features/scenario/results-ui/results-panel";
import { safeParseScenarioInput } from "@/features/scenario/schemas/scenario-schema";
import type { Locale } from "@/i18n/messages";
import { useLocale } from "@/i18n/locale-context";

const ASSUMPTION_SOURCES: AssumptionSource[] = [
  "customer_provided",
  "product_locked",
  "literature_based",
  "placeholder",
  "derived",
];

const ASSUMPTION_STATUSES: AssumptionStatus[] = [
  "confirmed",
  "estimated",
  "pending_customer_confirmation",
  "placeholder_only",
];

function formatBuildIssue(
  issue: BuildPayloadIssue,
  t: (id: string, vars?: Record<string, string>) => string,
): string {
  switch (issue.message) {
    case "series_parse":
      return t("validation.seriesNonNumeric");
    case "series_length":
      return t("validation.seriesWrongCount", {
        expected: String(issue.expectedCount ?? ""),
        actual: String(issue.actualCount ?? ""),
      });
    case "invalid":
      return t("validation.invalidNumber");
    case "required":
      return t("validation.fieldRequired");
    default: {
      const _x: never = issue.message;
      return _x;
    }
  }
}

function buildIssueMap(
  issues: BuildPayloadIssue[],
  t: (id: string, vars?: Record<string, string>) => string,
): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const issue of issues) {
    const msg = formatBuildIssue(issue, t);
    const arr = m.get(issue.path) ?? [];
    arr.push(msg);
    m.set(issue.path, arr);
  }
  return m;
}

function mergeMaps(a: Map<string, string[]>, b: Map<string, string[]>): Map<string, string[]> {
  const out = new Map(a);
  for (const [k, v] of b) {
    const cur = out.get(k) ?? [];
    out.set(k, [...cur, ...v]);
  }
  return out;
}

function getErrors(
  map: Map<string, string[]>,
  path: string,
  t: (id: string, vars?: Record<string, string>) => string,
): string | undefined {
  const arr = map.get(path);
  if (!arr?.length) return undefined;
  return arr.map((m) => translateZodIssueMessage(m, t)).join(" ");
}

function ImportedElectricityMarketDataPanel({
  resolution,
  seriesText,
  locale,
  t,
}: {
  resolution: "daily" | "hourly";
  seriesText: string;
  locale: Locale;
  t: (id: string, vars?: Record<string, string>) => string;
}) {
  const bundled = isBundledFinland2025DefaultImportedSeries(resolution, seriesText);
  const summary = summarizeImportedElectricitySeriesText(seriesText);
  const resolutionLabel =
    resolution === "daily"
      ? t("electricity.importedStatsResolutionDaily")
      : t("electricity.importedStatsResolutionHourly");
  const sourceLabel = bundled
    ? t("electricity.importedStatsSourceBundled")
    : t("electricity.importedStatsSourceUser");

  return (
    <div className="space-y-3">
      <div
        className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground"
        data-testid="electricity-imported-vat-notice"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">
          {t("electricity.importedVatNoticeTitle")}
        </p>
        <p className="mt-2 leading-snug">{t("electricity.importedVatNoticeBody")}</p>
      </div>
      <div
        className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3 text-sm"
        data-testid="electricity-imported-stats"
      >
        <p className="text-xs leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">{resolutionLabel}</span>
          <span className="text-muted-foreground"> — </span>
          <span>{sourceLabel}</span>
        </p>
        {summary.ok ? (
          <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
            {t("electricity.importedStatsValues", {
              mean: formatResultNumber(summary.stats.mean, locale, { maximumFractionDigits: 2 }),
              min: formatResultNumber(summary.stats.min, locale, { maximumFractionDigits: 2 }),
              max: formatResultNumber(summary.stats.max, locale, { maximumFractionDigits: 2 }),
              unit: t("units.electricityEurPerMwh"),
            })}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-muted-foreground">{t("electricity.importedStatsInvalid")}</p>
        )}
      </div>
    </div>
  );
}

function SeasonalDailyCo2Fields({
  branch,
  errors,
  setForm,
  t,
}: {
  branch: Extract<Co2FormBranch, { mode: "seasonal_daily" }>;
  errors: Map<string, string[]>;
  setForm: React.Dispatch<React.SetStateAction<ScenarioFormState>>;
  t: (id: string, vars?: Record<string, string>) => string;
}) {
  return (
    <>
      <FieldHint>{t("co2.seasonalHelp")}</FieldHint>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {branch.monthlyWeights.map((w, i) => (
          <div key={i}>
            <FieldLabel htmlFor={`mw-${i}`}>
              {t("co2.month")} {i + 1}
            </FieldLabel>
            <input
              id={`mw-${i}`}
              className={inputClassName}
              inputMode="decimal"
              value={w}
              onChange={(e) => {
                const next = [...branch.monthlyWeights];
                next[i] = e.target.value;
                setForm((s) =>
                  s.co2.mode === "seasonal_daily"
                    ? { ...s, co2: { ...s.co2, monthlyWeights: next } }
                    : s,
                );
              }}
            />
            <FieldError message={getErrors(errors, `co2.availability.monthlyRelativeWeights.${i}`, t)} />
          </div>
        ))}
      </div>
    </>
  );
}

type ElectricityT = (id: string, vars?: Record<string, string>) => string;

/**
 * Shared electricity form: visible modes are constant + historical_market_data_imported.
 * `daily_series` / `hourly_series` are internal: in basic setup show only a hint; full series editor lives in advanced setup.
 */
function ElectricityPurchaseBlock({
  form,
  setForm,
  errors,
  locale,
  t,
  getErrors: ge,
  setElectricityMode,
  block,
}: {
  form: ScenarioFormState;
  setForm: React.Dispatch<React.SetStateAction<ScenarioFormState>>;
  errors: Map<string, string[]>;
  locale: Locale;
  t: ElectricityT;
  getErrors: (map: Map<string, string[]>, path: string, tfn: ElectricityT) => string | undefined;
  setElectricityMode: (mode: ElectricityModeForm) => void;
  block: "basic" | "advancedDailyHourly";
}) {
  if (block === "advancedDailyHourly") {
    if (form.electricity.mode !== "daily_series" && form.electricity.mode !== "hourly_series") {
      return null;
    }
  }

  if (block === "basic" && (form.electricity.mode === "daily_series" || form.electricity.mode === "hourly_series")) {
    return (
      <div data-testid="electricity-daily-hourly-hint" className="space-y-3">
        <div>
          <FieldLabel htmlFor="elmode">{t("electricity.mode")}</FieldLabel>
          <select
            id="elmode"
            className={selectClassName}
            data-testid="elmode"
            value={form.electricity.mode}
            onChange={(e) => setElectricityMode(e.target.value as ElectricityModeForm)}
          >
            <option value="constant">{t("electricity.mode_constant")}</option>
            <option value="historical_market_data_imported">
              {t("electricity.mode_historical_imported")}
            </option>
          </select>
        </div>
        <FieldHint>{t("app.setup.electricitySeriesRequiresAdvanced")}</FieldHint>
      </div>
    );
  }

  if (block === "advancedDailyHourly") {
    const el = form.electricity;
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const text = Array.from({ length: SCENARIO_PERIOD_DAYS }, () => "50").join("\n");
              setForm((s) => {
                if (s.electricity.mode === "daily_series")
                  return { ...s, electricity: { mode: "daily_series", seriesText: text } };
                return s;
              });
            }}
            disabled={el.mode === "hourly_series"}
          >
            {t("electricity.fillOnes365")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const text = Array.from({ length: SCENARIO_HOURLY_SLOTS }, () => "50").join("\n");
              setForm((s) => {
                if (s.electricity.mode === "hourly_series")
                  return { ...s, electricity: { mode: "hourly_series", seriesText: text } };
                return s;
              });
            }}
            disabled={el.mode === "daily_series"}
          >
            {t("electricity.fillOnes8760")}
          </Button>
          <SeriesCsvImportControl
            inputId="electricity-series-csv-advanced"
            resolution={el.mode === "hourly_series" ? "hourly" : "daily"}
            expectedCount={el.mode === "hourly_series" ? SCENARIO_HOURLY_SLOTS : SCENARIO_PERIOD_DAYS}
            t={t}
            onImported={(seriesText) =>
              setForm((s) => {
                if (s.electricity.mode === "daily_series")
                  return { ...s, electricity: { mode: "daily_series", seriesText } };
                if (s.electricity.mode === "hourly_series")
                  return { ...s, electricity: { mode: "hourly_series", seriesText } };
                return s;
              })
            }
          />
        </div>
        <FieldHint>{t("csvImport.hint")}</FieldHint>
        <div>
          <FieldLabel htmlFor="elseries-adv">
            {el.mode === "daily_series" ? t("electricity.seriesDailyLabel") : t("electricity.seriesHourlyLabel")}
          </FieldLabel>
          <FieldHint>{t("electricity.seriesHelp")}</FieldHint>
          <textarea
            id="elseries-adv"
            className={textAreaClassName + " mt-1 min-h-[180px]"}
            value={el.seriesText}
            onChange={(e) =>
              setForm((s) =>
                s.electricity.mode === "daily_series" || s.electricity.mode === "hourly_series"
                  ? { ...s, electricity: { ...s.electricity, seriesText: e.target.value } }
                  : s,
              )
            }
          />
          <FieldError
            message={ge(
              errors,
              el.mode === "daily_series" ? "electricity.dailyPricesEurPerMwh" : "electricity.hourlyPricesEurPerMwh",
              t,
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel htmlFor="elmode">{t("electricity.mode")}</FieldLabel>
        <select
          id="elmode"
          className={selectClassName}
          data-testid="elmode"
          value={form.electricity.mode}
          onChange={(e) => setElectricityMode(e.target.value as ElectricityModeForm)}
        >
          <option value="constant">{t("electricity.mode_constant")}</option>
          <option value="historical_market_data_imported">
            {t("electricity.mode_historical_imported")}
          </option>
        </select>
      </div>

      {form.electricity.mode === "constant" ? (
        <div>
          <FieldLabel htmlFor="elprice">{t("electricity.constantPrice")}</FieldLabel>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="elprice"
              className={inputClassName + " min-w-0 flex-1 sm:max-w-[14rem]"}
              inputMode="decimal"
              value={form.electricity.priceEurPerMwh}
              onChange={(e) =>
                setForm((s) =>
                  s.electricity.mode === "constant"
                    ? {
                        ...s,
                        electricity: {
                          mode: "constant",
                          priceEurPerMwh: e.target.value,
                          priceDisplayUnit: s.electricity.priceDisplayUnit,
                        },
                      }
                    : s,
                )
              }
            />
            <select
              className={selectClassName + " w-auto min-w-[7.5rem] shrink-0"}
              value={form.electricity.priceDisplayUnit}
              aria-label={t("electricity.constantPriceUnitAria")}
              onChange={(e) => {
                const next = e.target.value as ElectricityPriceInputDisplayUnit;
                setForm((s) => {
                  if (s.electricity.mode !== "constant") return s;
                  const v = parseFiniteNumber(s.electricity.priceEurPerMwh);
                  if (v === undefined) {
                    return {
                      ...s,
                      electricity: { ...s.electricity, priceDisplayUnit: next },
                    };
                  }
                  const eurMwh = electricityPriceInputToEurPerMwh(v, s.electricity.priceDisplayUnit);
                  const newDisplay = electricityPriceEurPerMwhToInputDisplay(eurMwh, next);
                  return {
                    ...s,
                    electricity: {
                      mode: "constant",
                      priceDisplayUnit: next,
                      priceEurPerMwh: String(newDisplay),
                    },
                  };
                });
              }}
            >
              <option value="eur_per_mwh">{t("units.electricityEurPerMwh")}</option>
              <option value="c_per_kwh">{t("units.electricityCPerKwh")}</option>
            </select>
          </div>
          <FieldHint>{t("electricity.constantPriceHint")}</FieldHint>
          <FieldError message={ge(errors, "electricity.priceEurPerMwh", t)} />
        </div>
      ) : null}

      {form.electricity.mode === "historical_market_data_imported" ? (
        <>
          <div>
            <FieldLabel htmlFor="elres">{t("electricity.historicalResolution")}</FieldLabel>
            <select
              id="elres"
              className={selectClassName}
              value={form.electricity.resolution}
              onChange={(e) => {
                const resolution = e.target.value as "daily" | "hourly";
                const seriesText =
                  resolution === "daily"
                    ? FINLAND_2025_DAILY_EUR_PER_MWH.join("\n")
                    : FINLAND_2025_HOURLY_EUR_PER_MWH.join("\n");
                setForm((s) =>
                  s.electricity.mode === "historical_market_data_imported"
                    ? {
                        ...s,
                        electricity: {
                          mode: "historical_market_data_imported",
                          resolution,
                          seriesText,
                        },
                      }
                    : s,
                );
              }}
            >
              <option value="daily">{t("electricity.resolution_daily")}</option>
              <option value="hourly">{t("electricity.resolution_hourly")}</option>
            </select>
            <FieldHint>{t("electricity.historicalHelp")}</FieldHint>
            <ImportedElectricityMarketDataPanel
              resolution={form.electricity.resolution}
              seriesText={form.electricity.seriesText}
              locale={locale}
              t={t}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const text = Array.from({ length: SCENARIO_PERIOD_DAYS }, () => "50").join("\n");
                setForm((s) => {
                  if (s.electricity.mode === "historical_market_data_imported")
                    return {
                      ...s,
                      electricity: {
                        mode: "historical_market_data_imported",
                        resolution: "daily",
                        seriesText: text,
                      },
                    };
                  return s;
                });
              }}
              disabled={form.electricity.resolution !== "daily"}
            >
              {t("electricity.fillOnes365")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const text = Array.from({ length: SCENARIO_HOURLY_SLOTS }, () => "50").join("\n");
                setForm((s) => {
                  if (s.electricity.mode === "historical_market_data_imported")
                    return {
                      ...s,
                      electricity: {
                        mode: "historical_market_data_imported",
                        resolution: "hourly",
                        seriesText: text,
                      },
                    };
                  return s;
                });
              }}
              disabled={form.electricity.resolution !== "hourly"}
            >
              {t("electricity.fillOnes8760")}
            </Button>
            <SeriesCsvImportControl
              inputId="electricity-series-csv"
              resolution={form.electricity.resolution === "hourly" ? "hourly" : "daily"}
              expectedCount={
                form.electricity.resolution === "hourly" ? SCENARIO_HOURLY_SLOTS : SCENARIO_PERIOD_DAYS
              }
              t={t}
              onImported={(seriesText) =>
                setForm((s) => {
                  if (s.electricity.mode === "historical_market_data_imported") {
                    return {
                      ...s,
                      electricity: {
                        mode: "historical_market_data_imported",
                        resolution: s.electricity.resolution,
                        seriesText,
                      },
                    };
                  }
                  return s;
                })
              }
            />
          </div>
          <FieldHint>{t("csvImport.hint")}</FieldHint>
          <div>
            <FieldLabel htmlFor="elseries">
              {form.electricity.resolution === "daily"
                ? t("electricity.seriesDailyLabel")
                : t("electricity.seriesHourlyLabel")}
            </FieldLabel>
            <FieldHint>{t("electricity.seriesHelp")}</FieldHint>
            <textarea
              id="elseries"
              className={textAreaClassName + " min-h-[180px] mt-1"}
              value={form.electricity.seriesText}
              onChange={(e) =>
                setForm((s) =>
                  s.electricity.mode === "historical_market_data_imported"
                    ? { ...s, electricity: { ...s.electricity, seriesText: e.target.value } }
                    : s,
                )
              }
            />
            <FieldError message={ge(errors, "electricity.pricesEurPerMwh", t)} />
          </div>
        </>
      ) : null}
    </div>
  );
}

export function ScenarioInputApp() {
  const { locale, setLocale, t } = useLocale();
  const [form, setForm] = React.useState<ScenarioFormState>(() => createInitialFormState());
  const [errors, setErrors] = React.useState<Map<string, string[]>>(new Map());
  const [result, setResult] = React.useState<CalculationResult | null>(null);
  const [advancedSetupExpanded, setAdvancedSetupExpanded] = React.useState(false);
  const defaultProcess = React.useMemo(() => defaultProcessAssumptionsInput(), []);
  const outcomeSectionRef = React.useRef<HTMLDivElement>(null);
  const scrollToOutcomeAfterRunRef = React.useRef(false);

  React.useLayoutEffect(() => {
    if (!scrollToOutcomeAfterRunRef.current || !result) return;
    scrollToOutcomeAfterRunRef.current = false;
    const el = outcomeSectionRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.focus({ preventScroll: true });
  }, [result]);

  const setCo2Mode = (mode: Co2AvailabilityModeForm) => {
    setForm((s) => ({ ...s, co2: defaultCo2Branch(mode) }));
  };

  const setElectricityMode = (mode: ElectricityModeForm) => {
    setForm((s) => ({ ...s, electricity: defaultElectricityBranch(mode) }));
  };

  const onRun = () => {
    setErrors(new Map());
    setResult(null);

    const built = buildScenarioPayload(form);
    let map = new Map<string, string[]>();
    if (!built.ok) {
      map = buildIssueMap(built.issues, t);
      setErrors(map);
      return;
    }

    const parsed = safeParseScenarioInput(built.payload);
    if (!parsed.success) {
      const zMap = zodIssuesToMap(parsed.error);
      map = mergeMaps(map, zMap);
      setErrors(map);
      return;
    }

    const input: ScenarioInput = {
      ...parsed.data,
      process: mergeProcessAssumptionsInput(parsed.data.process),
    };
    scrollToOutcomeAfterRunRef.current = true;
    setResult(calculateScenario(input));
  };

  const onReset = () => {
    setForm(createInitialFormState());
    setErrors(new Map());
    setResult(null);
    setAdvancedSetupExpanded(false);
  };

  const hasErrors = errors.size > 0;

  return (
    <>
      <ScenarioAppNavbar
        locale={locale}
        setLocale={setLocale}
        onRun={onRun}
        onReset={onReset}
        result={result}
        t={t}
      />
      <div className="mx-auto w-full max-w-[min(94rem,100%)] space-y-10 px-4 py-8 sm:px-6 xl:space-y-12 xl:px-10">
      {/* --- Page hero (app `banner` landmark is the sticky navbar) --- */}
      <div className="mb-10 xl:mb-12">
        <div className="rounded-2xl border border-border/80 bg-surface-hero p-6 shadow-[0_6px_36px_-14px_rgba(15,23,42,0.14),0_2px_6px_-2px_rgba(15,23,42,0.06)] ring-2 ring-structural/42 ring-offset-0 sm:p-8">
          <p className="font-heading text-xl font-semibold tracking-tight text-foreground">{t("app.title")}</p>

          <div className="mt-6 border-t border-consultancy/15 pt-6">
            <div className="rounded-xl border border-consultancy/12 bg-consultancy-subtle/45 px-5 py-5 sm:max-w-[46rem] sm:px-6 sm:py-6">
              <div className="border-l-[3px] border-l-consultancy/50 pl-5 sm:pl-6">
                <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem] sm:leading-snug">
                  {t("app.hero.headline")}
                </h1>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t("app.hero.lead")}</p>
                <ul className="mt-5 grid gap-3 text-sm leading-snug text-muted-foreground sm:grid-cols-2 sm:gap-x-10 sm:gap-y-3">
                  <li className="flex gap-3">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-consultancy/70" aria-hidden />
                    <span>{t("app.hero.bullet1")}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-consultancy/70" aria-hidden />
                    <span>{t("app.hero.bullet2")}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-consultancy/70" aria-hidden />
                    <span>{t("app.hero.bullet3")}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-consultancy/70" aria-hidden />
                    <span>{t("app.hero.bullet4")}</span>
                  </li>
                </ul>
              </div>
            </div>
            {/* --- Before interpreting results: key caveats to check before reading results --- */}
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-4 sm:max-w-[46rem] sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">
                {t("app.hero.beforeYouRun.title")}
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-snug text-muted-foreground">
                <li className="flex gap-3">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" aria-hidden />
                  <span>{t("app.hero.beforeYouRun.item1")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" aria-hidden />
                  <span>{t("app.hero.beforeYouRun.item2")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" aria-hidden />
                  <span>{t("app.hero.beforeYouRun.item3")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" aria-hidden />
                  <span>{t("app.hero.beforeYouRun.item4")}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* --- Validation summary (payload parse + Zod) --- */}
      {hasErrors ? (
        <div
          className="rounded-xl border border-destructive/35 bg-destructive/[0.04] px-5 py-4 text-destructive"
          role="alert"
        >
          <p className="text-sm font-semibold text-destructive">{t("scenarioForm.generalValidation")}</p>
          <ul className="mt-4 space-y-4">
            {[...errors.entries()].map(([path, msgs]) => {
              const friendly = friendlyLabelForValidationPath(path, t);
              return (
                <li key={path} className="border-t border-destructive/15 pt-4 first:border-t-0 first:pt-0">
                  <p className="text-sm font-medium leading-snug text-destructive">
                    {msgs.map((m) => translateZodIssueMessage(m, t)).join(" · ")}
                  </p>
                  {friendly ? (
                    <p className="mt-1.5 text-xs leading-relaxed text-destructive/85">{friendly}</p>
                  ) : null}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                      {t("validation.technicalReference")}
                    </summary>
                    <p className="mt-1 break-all font-mono text-[0.65rem] leading-relaxed text-muted-foreground">
                      {path}
                    </p>
                  </details>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* --- Main layout: setup form --- */}
      <div className="min-w-0 space-y-8">
        <ShellSetupRegion title={t("app.shell.setupTitle")} lead={t("app.shell.setupLead")}>
      <Section
        data-testid="setup-simple-section"
        title={t("app.setup.simple.title")}
        description={t("app.setup.simple.lead")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="annualKt">{t("co2.annualAmount")}</FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="annualKt"
                className={inputClassName + " min-w-0 flex-1 sm:max-w-[14rem]"}
                inputMode="decimal"
                value={form.annualAmountKtPerYear}
                onChange={(e) => setForm((s) => ({ ...s, annualAmountKtPerYear: e.target.value }))}
              />
              <span className="shrink-0 text-sm text-muted-foreground">{t("units.co2KtPerYear")}</span>
            </div>
            <FieldHint>{t("co2.annualAmountHint")}</FieldHint>
            <FieldError message={getErrors(errors, "co2.annualAmountKtPerYear", t)} />
          </div>
          <div>
            <FieldLabel htmlFor="util">{t("co2.utilization")}</FieldLabel>
            <input
              id="util"
              className={inputClassName}
              inputMode="decimal"
              value={form.utilizationRatePct}
              onChange={(e) => setForm((s) => ({ ...s, utilizationRatePct: e.target.value }))}
            />
            <FieldError message={getErrors(errors, "co2.utilizationRatePct", t)} />
          </div>
        </div>
        <div className="mt-6 space-y-3 border-t border-border/60 pt-6">
          <h3 className="text-sm font-semibold text-foreground">{t("sections.electricity")}</h3>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {t("sections.electricityIntro")}
          </p>
          <ElectricityPurchaseBlock
            form={form}
            setForm={setForm}
            errors={errors}
            locale={locale}
            t={t}
            getErrors={getErrors}
            setElectricityMode={setElectricityMode}
            block="basic"
          />
        </div>
      </Section>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          type="button"
          data-testid="toggle-advanced-setup"
          variant="outline"
          aria-expanded={advancedSetupExpanded}
          onClick={() => setAdvancedSetupExpanded((o) => !o)}
        >
          {advancedSetupExpanded ? t("app.setup.hideAdvanced") : t("app.setup.showAdvanced")}
        </Button>
      </div>

      {advancedSetupExpanded ? (
        <div className="space-y-6" data-testid="setup-advanced-region">
      <Section title={t("app.setup.advanced.heading")} description={t("app.setup.advanced.lead")}>
        <FieldHint>{t("scenarioForm.periodNote")}</FieldHint>
        <div>
          <FieldLabel htmlFor="scenarioName">{t("scenarioForm.scenarioName")}</FieldLabel>
          <input
            id="scenarioName"
            className={inputClassName}
            data-testid="field-scenario-name"
            value={form.scenarioName}
            onChange={(e) => setForm((s) => ({ ...s, scenarioName: e.target.value }))}
          />
          <FieldError message={getErrors(errors, "scenarioName", t)} />
        </div>
        <div>
          <FieldLabel htmlFor="assumptionsVersion">{t("scenarioForm.assumptionsVersion")}</FieldLabel>
          <input
            id="assumptionsVersion"
            className={inputClassName}
            value={form.assumptionsVersion}
            onChange={(e) => setForm((s) => ({ ...s, assumptionsVersion: e.target.value }))}
          />
          <FieldError message={getErrors(errors, "assumptionsMeta.assumptionsVersion", t)} />
        </div>
        <div>
          <FieldLabel htmlFor="assumptionsNotes">{t("scenarioForm.assumptionsNotes")}</FieldLabel>
          <textarea
            id="assumptionsNotes"
            className={textAreaClassName + " min-h-[72px] font-sans"}
            value={form.assumptionsNotes}
            onChange={(e) => setForm((s) => ({ ...s, assumptionsNotes: e.target.value }))}
          />
        </div>
      </Section>

      {/* --- CO₂: mode + seasonal weights or time series --- */}
      <Section title={t("sections.co2")} description={t("sections.co2Intro")}>
        <div>
          <FieldLabel htmlFor="co2mode">{t("co2.mode")}</FieldLabel>
          <select
            id="co2mode"
            className={selectClassName}
            value={form.co2.mode}
            onChange={(e) => setCo2Mode(e.target.value as Co2AvailabilityModeForm)}
          >
            <option value="flat_annual">{t("co2.mode_flat_annual")}</option>
            <option value="seasonal_daily">{t("co2.mode_seasonal_daily")}</option>
            <option value="time_series_daily">{t("co2.mode_time_series_daily")}</option>
            <option value="time_series_hourly">{t("co2.mode_time_series_hourly")}</option>
          </select>
        </div>

        {form.co2.mode === "seasonal_daily" ? (
          <SeasonalDailyCo2Fields
            branch={form.co2}
            errors={errors}
            setForm={setForm}
            t={t}
          />
        ) : null}

        {form.co2.mode === "time_series_daily" || form.co2.mode === "time_series_hourly" ? (
          <>
            <FieldHint>{t("co2.timeSeriesAnnualHint")}</FieldHint>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((s) =>
                    s.co2.mode === "time_series_daily"
                      ? {
                          ...s,
                          co2: {
                            mode: "time_series_daily",
                            seriesText: Array.from({ length: SCENARIO_PERIOD_DAYS }, () => "1").join("\n"),
                          },
                        }
                      : s,
                  )
                }
                disabled={form.co2.mode !== "time_series_daily"}
              >
                {t("co2.fillOnes365")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((s) =>
                    s.co2.mode === "time_series_hourly"
                      ? {
                          ...s,
                          co2: {
                            mode: "time_series_hourly",
                            seriesText: Array.from({ length: SCENARIO_HOURLY_SLOTS }, () => "1").join("\n"),
                          },
                        }
                      : s,
                  )
                }
                disabled={form.co2.mode !== "time_series_hourly"}
              >
                {t("co2.fillOnes8760")}
              </Button>
              <SeriesCsvImportControl
                inputId="co2-series-csv"
                resolution={form.co2.mode === "time_series_daily" ? "daily" : "hourly"}
                expectedCount={
                  form.co2.mode === "time_series_daily" ? SCENARIO_PERIOD_DAYS : SCENARIO_HOURLY_SLOTS
                }
                t={t}
                onImported={(seriesText) =>
                  setForm((s) =>
                    s.co2.mode === "time_series_daily"
                      ? { ...s, co2: { mode: "time_series_daily", seriesText } }
                      : s.co2.mode === "time_series_hourly"
                        ? { ...s, co2: { mode: "time_series_hourly", seriesText } }
                        : s,
                  )
                }
              />
            </div>
            <FieldHint>{t("csvImport.hint")}</FieldHint>
            <div>
              <FieldLabel htmlFor="co2series">
                {form.co2.mode === "time_series_daily"
                  ? t("co2.seriesDailyLabel")
                  : t("co2.seriesHourlyLabel")}
              </FieldLabel>
              <FieldHint>
                {form.co2.mode === "time_series_daily" ? t("co2.seriesDailyHelp") : t("co2.seriesHourlyHelp")}
              </FieldHint>
              <textarea
                id="co2series"
                className={textAreaClassName + " mt-1 min-h-[180px]"}
                value={form.co2.seriesText}
                onChange={(e) =>
                  setForm((s) =>
                    s.co2.mode === "time_series_daily" || s.co2.mode === "time_series_hourly"
                      ? { ...s, co2: { ...s.co2, seriesText: e.target.value } }
                      : s,
                  )
                }
              />
              <FieldError
                message={getErrors(
                  errors,
                  form.co2.mode === "time_series_daily"
                    ? "co2.availability.dailyAvailableCo2Kg"
                    : "co2.availability.hourlyAvailableCo2Kg",
                  t,
                )}
              />
            </div>
          </>
        ) : null}
      </Section>

      {form.electricity.mode === "daily_series" || form.electricity.mode === "hourly_series" ? (
        <Section title={t("sections.electricity")} description={t("sections.electricityIntro")}>
          <ElectricityPurchaseBlock
            form={form}
            setForm={setForm}
            errors={errors}
            locale={locale}
            t={t}
            getErrors={getErrors}
            setElectricityMode={setElectricityMode}
            block="advancedDailyHourly"
          />
        </Section>
      ) : null}

      {/* --- Economics + optional CAPEX --- */}
      <Section title={t("sections.economics")} description={t("sections.economicsIntro")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="pch4">{t("economics.methanePrice")}</FieldLabel>
            <FieldHint>{t("economics.methanePriceHint")}</FieldHint>
            <input
              id="pch4"
              className={inputClassName}
              inputMode="decimal"
              value={form.economics.methanePriceEurPerTch4}
              onChange={(e) =>
                setForm((s) => ({ ...s, economics: { ...s.economics, methanePriceEurPerTch4: e.target.value } }))
              }
            />
            {isMethanePriceAtFactoryDefault(form.economics.methanePriceEurPerTch4) ? (
              <FieldHint>
                <span data-testid="economics-methane-default-verify-hint">{t("economics.methanePriceDefaultVerifyHint")}</span>
              </FieldHint>
            ) : null}
            <FieldError message={getErrors(errors, "economics.methanePriceEurPerTch4", t)} />
          </div>
          <div>
            <FieldLabel htmlFor="ph2">{t("economics.hydrogenPrice")}</FieldLabel>
            <FieldHint>{t("economics.hydrogenPriceHint")}</FieldHint>
            <input
              id="ph2"
              className={inputClassName}
              inputMode="decimal"
              value={form.economics.hydrogenPriceEurPerKg}
              onChange={(e) =>
                setForm((s) => ({ ...s, economics: { ...s.economics, hydrogenPriceEurPerKg: e.target.value } }))
              }
            />
            {isHydrogenPriceAtFactoryDefault(form.economics.hydrogenPriceEurPerKg) ? (
              <FieldHint>
                <span data-testid="economics-hydrogen-default-verify-hint">{t("economics.hydrogenPriceDefaultVerifyHint")}</span>
              </FieldHint>
            ) : null}
            <FieldError message={getErrors(errors, "economics.hydrogenPriceEurPerKg", t)} />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="opex">{t("economics.otherOpex")}</FieldLabel>
          <input
            id="opex"
            className={inputClassName}
            inputMode="decimal"
            value={form.economics.otherOpexEurPerYear}
            onChange={(e) =>
              setForm((s) => ({ ...s, economics: { ...s.economics, otherOpexEurPerYear: e.target.value } }))
            }
          />
          <FieldError message={getErrors(errors, "economics.otherOpexEurPerYear", t)} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <input
              id="capexInc"
              type="checkbox"
              className="size-4 rounded border-input"
              checked={form.economics.includeCapex}
              onChange={(e) =>
                setForm((s) => ({ ...s, economics: { ...s.economics, includeCapex: e.target.checked } }))
              }
            />
            <FieldLabel htmlFor="capexInc">{t("economics.includeCapex")}</FieldLabel>
          </div>
          <FieldHint>{t("economics.includeCapexHint")}</FieldHint>
        </div>
        {form.economics.includeCapex ? (
          <div className="grid gap-4 sm:grid-cols-2 border-t border-border pt-4">
            <div>
              <FieldLabel htmlFor="capexEz">{t("economics.electrolyzerCapex")}</FieldLabel>
              <input
                id="capexEz"
                className={inputClassName}
                inputMode="decimal"
                value={form.economics.electrolyzerCapexEur}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    economics: { ...s.economics, electrolyzerCapexEur: e.target.value },
                  }))
                }
              />
              <FieldError message={getErrors(errors, "economics.electrolyzerCapexEur", t)} />
            </div>
            <div>
              <FieldLabel htmlFor="capexMe">{t("economics.methanationCapex")}</FieldLabel>
              <input
                id="capexMe"
                className={inputClassName}
                inputMode="decimal"
                value={form.economics.methanationCapexEur}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    economics: { ...s.economics, methanationCapexEur: e.target.value },
                  }))
                }
              />
              <FieldError message={getErrors(errors, "economics.methanationCapexEur", t)} />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="capexLife">{t("economics.capexLifetime")}</FieldLabel>
              <input
                id="capexLife"
                className={inputClassName}
                inputMode="decimal"
                value={form.economics.capexLifetimeYears}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    economics: { ...s.economics, capexLifetimeYears: e.target.value },
                  }))
                }
              />
              <FieldError message={getErrors(errors, "economics.capexLifetimeYears", t)} />
            </div>
          </div>
        ) : null}
      </Section>

      {/* --- Advanced process assumptions (values + metadata; some not applied in daily engine — see calculation layer) --- */}
      <Section
        title={t("sections.advanced")}
        description={t("sections.advancedIntro")}
        className="border-dashed border-border/70 bg-muted/30 shadow-none ring-1 ring-border/50 dark:bg-muted/20"
      >
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-100">{t("advanced.inactiveFactorsTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{t("advanced.inactiveFactorsBody")}</p>
        </div>

        <div className="space-y-6">
          {PROCESS_FIELD_ORDER.filter(({ showInAdvancedUi }) => showInAdvancedUi).map(
            ({ key, labelId, unitId }) => {
            const row = form.process[key];
            const canonicalDefault = defaultProcess[key];
            const activeMeta = row.override
              ? {
                  assumptionSource: row.assumptionSource,
                  assumptionStatus: row.assumptionStatus,
                  assumptionNote: row.assumptionNote.trim(),
                }
              : {
                  assumptionSource: canonicalDefault.assumptionMeta.assumptionSource,
                  assumptionStatus: canonicalDefault.assumptionMeta.assumptionStatus,
                  assumptionNote: canonicalDefault.assumptionMeta.assumptionNote ?? "",
                };
            const activeValueText = row.override ? (row.value.trim() || "—") : String(canonicalDefault.value);
            const inactive =
              key === "plantAvailabilityPct" || key === "processEfficiencyPct" ? true : false;
            return (
              <div
                key={key}
                className={`rounded-xl border px-4 py-4 shadow-sm ${
                  !row.override && activeMeta.assumptionSource === "literature_based"
                    ? "border-amber-500/40 bg-amber-500/[0.06]"
                    : "border-border bg-muted/30"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="checkbox"
                    id={`ov-${key}`}
                    className="size-4 rounded border-input"
                    checked={row.override}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        process: {
                          ...s.process,
                          [key]: e.target.checked
                            ? {
                                ...s.process[key],
                                override: true,
                                value: s.process[key].value || String(defaultProcess[key].value),
                                assumptionSource: "customer_provided",
                                assumptionStatus: "confirmed",
                                assumptionNote: "",
                              }
                            : {
                                ...s.process[key],
                                override: false,
                              },
                        },
                      }))
                    }
                  />
                  <FieldLabel htmlFor={`ov-${key}`}>{t(labelId)}</FieldLabel>
                  {!row.override ? (
                    <span className="rounded-md border border-amber-600/35 bg-amber-500/12 px-2 py-0.5 text-xs font-medium text-amber-950 dark:text-amber-100">
                      {t("results.assumptions.literatureBadge")}
                    </span>
                  ) : (
                    <span className="rounded-md border border-border/60 bg-muted px-2 py-0.5 text-xs font-medium text-foreground/70">
                      {t("advanced.usingCustomValue")}
                    </span>
                  )}
                  {inactive ? (
                    <span className="text-[0.65rem] uppercase tracking-wide text-amber-700 dark:text-amber-300">
                      (MVP)
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
                  {activeValueText}{" "}
                  <span className="font-sans text-xs font-medium text-muted-foreground">{t(unitId)}</span>
                </p>
                <dl className="mt-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <dt className="shrink-0 font-medium text-foreground/85">{t("results.assumptions.source")}</dt>
                    <dd>{t(`assumptionSource.${activeMeta.assumptionSource}`)}</dd>
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <dt className="shrink-0 font-medium text-foreground/85">{t("results.assumptions.status")}</dt>
                    <dd>{t(`assumptionStatus.${activeMeta.assumptionStatus}`)}</dd>
                  </div>
                  {activeMeta.assumptionNote ? (
                    <div>
                      <dt className="font-medium text-foreground/85">{t("results.assumptions.note")}</dt>
                      <dd className="mt-0.5 text-[0.8125rem] leading-snug text-foreground/90">{activeMeta.assumptionNote}</dd>
                    </div>
                  ) : null}
                </dl>
                <details className="mt-3 border-t border-border/60 pt-3 text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    {t("advanced.internalKey")}
                  </summary>
                  <p className="mt-1.5 break-all font-mono text-[0.65rem] leading-relaxed text-muted-foreground">
                    {key}
                  </p>
                </details>
                {row.override ? (
                  <div className="mt-4 grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <FieldLabel htmlFor={`val-${key}`}>{t("advanced.value")}</FieldLabel>
                      <input
                        id={`val-${key}`}
                        className={inputClassName}
                        inputMode="decimal"
                        value={row.value}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            process: {
                              ...s.process,
                              [key]: { ...s.process[key], value: e.target.value },
                            },
                          }))
                        }
                      />
                      <FieldError message={getErrors(errors, `process.${key}.value`, t)} />
                    </div>
                    <div>
                      <FieldLabel htmlFor={`src-${key}`}>{t("advanced.assumptionSource")}</FieldLabel>
                      <select
                        id={`src-${key}`}
                        className={selectClassName}
                        value={row.assumptionSource}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            process: {
                              ...s.process,
                              [key]: {
                                ...s.process[key],
                                assumptionSource: e.target.value as AssumptionSource,
                              },
                            },
                          }))
                        }
                      >
                        {ASSUMPTION_SOURCES.map((src) => (
                          <option key={src} value={src}>
                            {t(`assumptionSource.${src}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel htmlFor={`st-${key}`}>{t("advanced.assumptionStatus")}</FieldLabel>
                      <select
                        id={`st-${key}`}
                        className={selectClassName}
                        value={row.assumptionStatus}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            process: {
                              ...s.process,
                              [key]: {
                                ...s.process[key],
                                assumptionStatus: e.target.value as AssumptionStatus,
                              },
                            },
                          }))
                        }
                      >
                        {ASSUMPTION_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {t(`assumptionStatus.${st}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel htmlFor={`note-${key}`}>{t("advanced.assumptionNote")}</FieldLabel>
                      <input
                        id={`note-${key}`}
                        className={inputClassName}
                        value={row.assumptionNote}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            process: {
                              ...s.process,
                              [key]: { ...s.process[key], assumptionNote: e.target.value },
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Section>
        </div>
      ) : null}
        </ShellSetupRegion>
      </div>

      {/* --- Outcome: `ResultsPanel` from canonical result only --- */}
      <div
        ref={outcomeSectionRef}
        tabIndex={-1}
        id="scenario-outcome"
        role="region"
        aria-label={t("app.shell.outcomeLabel")}
        className="scroll-mt-24 pt-10 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 xl:pt-14"
      >
        <div className="rounded-2xl border border-structural/38 bg-surface-results p-4 shadow-[0_8px_40px_-14px_rgba(15,23,42,0.16),0_2px_8px_-2px_rgba(15,23,42,0.06)] ring-2 ring-structural/32 ring-offset-0 sm:p-5 xl:p-6 dark:border-structural/45 dark:ring-structural/40">
          <p className="mb-5 flex items-center gap-3 text-xs font-medium tracking-wide text-muted-foreground">
            <span className="h-px w-10 shrink-0 bg-structural/60" aria-hidden />
            {t("app.shell.outcomeLabel")}
          </p>
          <Section
            title={t("sections.results")}
            headingAccent={false}
            className="border-border/85 bg-card shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08)] ring-1 ring-consultancy/10 dark:ring-consultancy/15"
          >
            {!result ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{t("results.empty")}</p>
            ) : (
              <ResultsPanel result={result} locale={locale} t={t} />
            )}
          </Section>
        </div>
      </div>
      </div>
    </>
  );
}
