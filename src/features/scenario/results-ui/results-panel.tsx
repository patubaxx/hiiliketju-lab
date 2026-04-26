"use client";

/**
 * Read-only presentation of `CalculationResult`: KPIs, tables, charts, assumptions, warnings.
 * Exports are triggered from the sticky scenario navbar; this panel only presents `CalculationResult`.
 */
import type { CalculationResult } from "@/core/domain/result";
import type { Locale } from "@/i18n/messages";

import { calloutClassName } from "@/features/scenario/input-ui/form-primitives";
import { cn } from "@/lib/utils";

import { formatResultEurCompact } from "./format-result-values";
import { ResultsEconomicVerdictCard } from "./results-economic-verdict-card";
import { ResultsUsedAssumptions } from "./results-used-assumptions";
import { ResultsCharts } from "./results-charts";
import { ResultsKpiHeadline, ResultsKpiSecondary } from "./results-kpi-grid";
import { ResultsTables } from "./results-tables";
import { ResultsWarnings } from "./results-warnings";

type TFn = (id: string, vars?: Record<string, string>) => string;

export function ResultsPanel({
  result,
  locale,
  t,
}: {
  readonly result: CalculationResult;
  readonly locale: Locale;
  readonly t: TFn;
}) {
  const s = result.annualSummary;

  return (
    <div className="w-full space-y-10 rounded-xl border border-border/60 bg-surface-inset/75 px-5 py-7 shadow-[var(--shadow-panel)] sm:space-y-12 sm:px-7 sm:py-9 dark:border-border/50 dark:bg-surface-inset/40 dark:shadow-[var(--shadow-panel)]">
      {/* 1. Outcome + scenario context */}
      <header className="space-y-3 border-b border-border/55 pb-6">
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">{t("results.title")}</h3>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("results.summary.lead")}</p>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">{t("results.summary.scenarioName")}</dt>
            <dd className="mt-1 font-medium text-foreground">{result.input.scenarioName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">{t("results.summary.assumptionsVersion")}</dt>
            <dd className="mt-1 font-mono text-xs text-foreground">{result.input.assumptionsMeta.assumptionsVersion}</dd>
          </div>
          {result.input.assumptionsMeta.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground">{t("results.summary.scenarioNotes")}</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {result.input.assumptionsMeta.notes}
              </dd>
            </div>
          ) : null}
        </dl>
      </header>

      <p className={cn(calloutClassName("success"), "text-sm font-medium text-foreground/95")} role="status">
        {t("results.success")}
      </p>

      <ResultsEconomicVerdictCard result={result} t={t} />
      <ResultsUsedAssumptions result={result} locale={locale} t={t} />

      <p className="text-xs leading-relaxed text-muted-foreground">{t("results.narrative.outcomeIntro")}</p>

      {/* 2. Headline KPIs */}
      <ResultsKpiHeadline summary={s} locale={locale} t={t} />

      {/* 3. Path comparison (revenues only — delta in headline) */}
      <section
        className="rounded-lg border border-border/60 bg-card/55 p-4 shadow-[var(--shadow-tile)] sm:p-5 dark:bg-card/35"
        aria-labelledby="results-path-heading"
      >
        <h3 id="results-path-heading" className="text-base font-semibold tracking-tight text-foreground">
          {t("results.pathComparison.title")}
        </h3>
        <p className="mt-2 border-b border-border/35 pb-4 text-sm leading-relaxed text-muted-foreground">
          {t("results.pathComparison.help")}
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-border/55 bg-surface-inset/60 px-4 py-3.5 shadow-[var(--shadow-tile)] dark:bg-surface-inset/30">
            <p className="text-xs font-medium text-muted-foreground">{t("results.pathComparison.methaneRevenue")}</p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
              {formatResultEurCompact(s.annualMethaneRevenueEur, locale, t)}
            </p>
          </div>
          <div className="rounded-md border border-border/55 bg-surface-inset/60 px-4 py-3.5 shadow-[var(--shadow-tile)] dark:bg-surface-inset/30">
            <p className="text-xs font-medium text-muted-foreground">{t("results.pathComparison.hydrogenAltRevenue")}</p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
              {formatResultEurCompact(s.hydrogenSalesAlternativeRevenueEur, locale, t)}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Supporting KPIs */}
      <ResultsKpiSecondary summary={s} locale={locale} t={t} />

      {/* 5. Warnings (trust signal before visual series) */}
      <ResultsWarnings result={result} t={t} />

      {/* 6. Charts */}
      <ResultsCharts result={result} locale={locale} t={t} />

      {/* 7. Tables (progressive detail) */}
      <ResultsTables result={result} locale={locale} t={t} />
    </div>
  );
}
