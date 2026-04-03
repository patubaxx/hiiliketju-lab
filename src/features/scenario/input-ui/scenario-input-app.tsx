"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { calculateScenario } from "@/core/calculation/calculate-scenario";
import type { AssumptionSource, AssumptionStatus } from "@/core/domain/assumptions";
import type { CalculationResult } from "@/core/domain/result";
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
  inputClassName,
  selectClassName,
  textAreaClassName,
} from "@/features/scenario/input-ui/form-primitives";
import {
  PROCESS_FIELD_ORDER,
  type Co2AvailabilityModeForm,
  type Co2FormBranch,
  type ElectricityModeForm,
  type ScenarioFormState,
  createInitialFormState,
  defaultCo2Branch,
  defaultElectricityBranch,
} from "@/features/scenario/input-ui/form-state";
import { zodIssuesToMap } from "@/features/scenario/input-ui/zod-issues-to-map";
import { safeParseScenarioInput } from "@/features/scenario/schemas/scenario-schema";
import { useLocale } from "@/i18n/locale-context";
import { ResultsPanel } from "@/features/scenario/results-ui/results-panel";

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

function getErrors(map: Map<string, string[]>, path: string): string | undefined {
  return map.get(path)?.join(" ");
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
            <FieldError message={getErrors(errors, `co2.availability.monthlyRelativeWeights.${i}`)} />
          </div>
        ))}
      </div>
    </>
  );
}

export function ScenarioInputApp() {
  const { locale, setLocale, t } = useLocale();
  const [form, setForm] = React.useState<ScenarioFormState>(() => createInitialFormState());
  const [errors, setErrors] = React.useState<Map<string, string[]>>(new Map());
  const [result, setResult] = React.useState<CalculationResult | null>(null);

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
    setResult(calculateScenario(input));
  };

  const onReset = () => {
    setForm(createInitialFormState());
    setErrors(new Map());
    setResult(null);
  };

  const hasErrors = errors.size > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 pb-20">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("app.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">{t("app.tagline")}</p>
          </div>
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor="locale-select">{t("locale.label")}</FieldLabel>
            <select
              id="locale-select"
              className={selectClassName + " w-44"}
              value={locale}
              onChange={(e) => setLocale(e.target.value as typeof locale)}
            >
              <option value="en">{t("locale.en")}</option>
              <option value="fi">{t("locale.fi")}</option>
              <option value="sv">{t("locale.sv")}</option>
            </select>
          </div>
        </div>
      </header>

      {hasErrors ? (
        <div
          className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <p className="font-medium">{t("scenarioForm.generalValidation")}</p>
          <ul className="mt-2 list-inside list-disc text-xs space-y-0.5 opacity-90">
            {[...errors.entries()].map(([path, msgs]) => (
              <li key={path}>
                <span className="font-mono text-[0.7rem]">{path}</span>: {msgs.join(" · ")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Section title={t("scenarioForm.title")} description={t("scenarioForm.description")}>
        <FieldHint>{t("scenarioForm.periodNote")}</FieldHint>
        <div>
          <FieldLabel htmlFor="scenarioName">{t("scenarioForm.scenarioName")}</FieldLabel>
          <input
            id="scenarioName"
            className={inputClassName}
            value={form.scenarioName}
            onChange={(e) => setForm((s) => ({ ...s, scenarioName: e.target.value }))}
          />
          <FieldError message={getErrors(errors, "scenarioName")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="annualKt">{t("co2.annualKt")}</FieldLabel>
            <input
              id="annualKt"
              className={inputClassName}
              inputMode="decimal"
              value={form.annualAmountKtPerYear}
              onChange={(e) => setForm((s) => ({ ...s, annualAmountKtPerYear: e.target.value }))}
            />
            <FieldError message={getErrors(errors, "co2.annualAmountKtPerYear")} />
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
            <FieldError message={getErrors(errors, "co2.utilizationRatePct")} />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="assumptionsVersion">{t("scenarioForm.assumptionsVersion")}</FieldLabel>
          <input
            id="assumptionsVersion"
            className={inputClassName}
            value={form.assumptionsVersion}
            onChange={(e) => setForm((s) => ({ ...s, assumptionsVersion: e.target.value }))}
          />
          <FieldError message={getErrors(errors, "assumptionsMeta.assumptionsVersion")} />
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
            </div>
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
                )}
              />
            </div>
          </>
        ) : null}
      </Section>

      <Section title={t("sections.electricity")} description={t("sections.electricityIntro")}>
        <div>
          <FieldLabel htmlFor="elmode">{t("electricity.mode")}</FieldLabel>
          <select
            id="elmode"
            className={selectClassName}
            value={form.electricity.mode}
            onChange={(e) => setElectricityMode(e.target.value as ElectricityModeForm)}
          >
            <option value="constant">{t("electricity.mode_constant")}</option>
            <option value="daily_series">{t("electricity.mode_daily_series")}</option>
            <option value="hourly_series">{t("electricity.mode_hourly_series")}</option>
            <option value="historical_market_data_imported">
              {t("electricity.mode_historical_imported")}
            </option>
          </select>
        </div>

        {form.electricity.mode === "constant" ? (
          <div>
            <FieldLabel htmlFor="elprice">{t("electricity.constantPrice")}</FieldLabel>
            <input
              id="elprice"
              className={inputClassName}
              inputMode="decimal"
              value={form.electricity.priceEurPerMwh}
              onChange={(e) =>
                setForm((s) =>
                  s.electricity.mode === "constant"
                    ? { ...s, electricity: { mode: "constant", priceEurPerMwh: e.target.value } }
                    : s,
                )
              }
            />
            <FieldError message={getErrors(errors, "electricity.priceEurPerMwh")} />
          </div>
        ) : null}

        {form.electricity.mode === "daily_series" ||
        form.electricity.mode === "hourly_series" ||
        form.electricity.mode === "historical_market_data_imported" ? (
          <>
            {form.electricity.mode === "historical_market_data_imported" ? (
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
                        ? Array.from({ length: SCENARIO_PERIOD_DAYS }, () => "50").join("\n")
                        : Array.from({ length: SCENARIO_HOURLY_SLOTS }, () => "50").join("\n");
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
              </div>
            ) : null}

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
                disabled={
                  form.electricity.mode === "hourly_series" ||
                  (form.electricity.mode === "historical_market_data_imported" &&
                    form.electricity.resolution !== "daily")
                }
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
                disabled={
                  form.electricity.mode === "daily_series" ||
                  (form.electricity.mode === "historical_market_data_imported" &&
                    form.electricity.resolution !== "hourly")
                }
              >
                {t("electricity.fillOnes8760")}
              </Button>
            </div>

            <div>
              <FieldLabel htmlFor="elseries">
                {form.electricity.mode === "daily_series"
                  ? t("electricity.seriesDailyLabel")
                  : form.electricity.mode === "hourly_series"
                    ? t("electricity.seriesHourlyLabel")
                    : form.electricity.resolution === "daily"
                      ? t("electricity.seriesDailyLabel")
                      : t("electricity.seriesHourlyLabel")}
              </FieldLabel>
              <FieldHint>{t("electricity.seriesHelp")}</FieldHint>
              <textarea
                id="elseries"
                className={textAreaClassName + " mt-1 min-h-[180px]"}
                value={
                  form.electricity.mode === "historical_market_data_imported" ||
                  form.electricity.mode === "daily_series" ||
                  form.electricity.mode === "hourly_series"
                    ? form.electricity.seriesText
                    : ""
                }
                onChange={(e) =>
                  setForm((s) =>
                    s.electricity.mode === "daily_series" ||
                    s.electricity.mode === "hourly_series" ||
                    s.electricity.mode === "historical_market_data_imported"
                      ? { ...s, electricity: { ...s.electricity, seriesText: e.target.value } }
                      : s,
                  )
                }
              />
              <FieldError
                message={getErrors(
                  errors,
                  form.electricity.mode === "daily_series"
                    ? "electricity.dailyPricesEurPerMwh"
                    : form.electricity.mode === "hourly_series"
                      ? "electricity.hourlyPricesEurPerMwh"
                      : "electricity.pricesEurPerMwh",
                )}
              />
            </div>
          </>
        ) : null}
      </Section>

      <Section title={t("sections.economics")} description={t("sections.economicsIntro")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="pch4">{t("economics.methanePrice")}</FieldLabel>
            <input
              id="pch4"
              className={inputClassName}
              inputMode="decimal"
              value={form.economics.methanePriceEurPerTch4}
              onChange={(e) =>
                setForm((s) => ({ ...s, economics: { ...s.economics, methanePriceEurPerTch4: e.target.value } }))
              }
            />
            <FieldError message={getErrors(errors, "economics.methanePriceEurPerTch4")} />
          </div>
          <div>
            <FieldLabel htmlFor="ph2">{t("economics.hydrogenPrice")}</FieldLabel>
            <input
              id="ph2"
              className={inputClassName}
              inputMode="decimal"
              value={form.economics.hydrogenPriceEurPerKg}
              onChange={(e) =>
                setForm((s) => ({ ...s, economics: { ...s.economics, hydrogenPriceEurPerKg: e.target.value } }))
              }
            />
            <FieldError message={getErrors(errors, "economics.hydrogenPriceEurPerKg")} />
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
          <FieldError message={getErrors(errors, "economics.otherOpexEurPerYear")} />
        </div>
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
              <FieldError message={getErrors(errors, "economics.electrolyzerCapexEur")} />
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
              <FieldError message={getErrors(errors, "economics.methanationCapexEur")} />
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
              <FieldError message={getErrors(errors, "economics.capexLifetimeYears")} />
            </div>
          </div>
        ) : null}
      </Section>

      <Section
        title={t("sections.advanced")}
        description={t("sections.advancedIntro")}
        className="border-dashed bg-muted/20"
      >
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-100">{t("advanced.inactiveFactorsTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{t("advanced.inactiveFactorsBody")}</p>
        </div>

        <div className="space-y-6">
          {PROCESS_FIELD_ORDER.map(({ key, labelId }) => {
            const row = form.process[key];
            const inactive =
              key === "plantAvailabilityPct" || key === "processEfficiencyPct" ? true : false;
            return (
              <div
                key={key}
                className="rounded-lg border border-border/80 bg-background/60 p-4 space-y-3"
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
                          [key]: { ...s.process[key], override: e.target.checked },
                        },
                      }))
                    }
                  />
                  <FieldLabel htmlFor={`ov-${key}`}>{t(labelId)}</FieldLabel>
                  {inactive ? (
                    <span className="text-[0.65rem] uppercase tracking-wide text-amber-700 dark:text-amber-300">
                      (MVP)
                    </span>
                  ) : null}
                </div>
                <p className="text-[0.7rem] font-mono text-muted-foreground break-all">{key}</p>
                {row.override ? (
                  <div className="grid gap-3 sm:grid-cols-2">
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
                      <FieldError message={getErrors(errors, `process.${key}.value`)} />
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

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={onRun}>
          {t("scenarioForm.runCalculation")}
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          {t("scenarioForm.reset")}
        </Button>
      </div>

      <Section title={t("sections.results")}>
        {!result ? (
          <p className="text-sm text-muted-foreground">{t("results.empty")}</p>
        ) : (
          <ResultsPanel result={result} locale={locale} t={t} />
        )}
      </Section>
    </div>
  );
}
