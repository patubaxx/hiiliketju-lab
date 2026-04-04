"use client";

/**
 * Read-only presentation of `CalculationResult`: KPIs, tables, charts, assumptions, warnings.
 * Exports are triggered from the sticky scenario navbar; this panel only presents `CalculationResult`.
 */
import type { CalculationResult } from "@/core/domain/result";
import type { Locale } from "@/i18n/messages";

import { formatResultEur } from "./format-result-values";
import { ResultsAssumptions } from "./results-assumptions";
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
    <div className="w-full space-y-12 rounded-xl border border-border/75 bg-surface-inset px-6 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-structural/22 sm:px-8 sm:py-10 dark:shadow-none dark:ring-structural/28">
      {/* 1. Outcome + scenario context */}
      <header className="space-y-3 border-b border-structural/26 pb-6">
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

      <p
        className="rounded-lg border border-consultancy/22 bg-consultancy-subtle/70 px-4 py-3 text-sm text-foreground dark:bg-consultancy-subtle/40"
        role="status"
      >
        {t("results.success")}
      </p>

      <p className="text-xs leading-relaxed text-muted-foreground">{t("results.narrative.outcomeIntro")}</p>

      {/* 2. Headline KPIs */}
      <ResultsKpiHeadline summary={s} locale={locale} t={t} />

      {/* 3. Path comparison (revenues only — delta in headline) */}
      <section
        className="rounded-xl border border-consultancy/14 bg-card p-5 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] ring-1 ring-consultancy/8 sm:p-6 dark:ring-consultancy/12"
        aria-labelledby="results-path-heading"
      >
        <h3 id="results-path-heading" className="text-base font-semibold tracking-tight text-foreground">
          {t("results.pathComparison.title")}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("results.pathComparison.help")}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-consultancy/12 bg-consultancy-subtle/40 px-5 py-4 dark:bg-consultancy-subtle/25">
            <p className="text-xs font-medium text-muted-foreground">{t("results.pathComparison.methaneRevenue")}</p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
              {formatResultEur(s.annualMethaneRevenueEur, locale)}
            </p>
          </div>
          <div className="rounded-lg border border-consultancy/12 bg-consultancy-subtle/40 px-5 py-4 dark:bg-consultancy-subtle/25">
            <p className="text-xs font-medium text-muted-foreground">{t("results.pathComparison.hydrogenAltRevenue")}</p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
              {formatResultEur(s.hydrogenSalesAlternativeRevenueEur, locale)}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Supporting KPIs */}
      <ResultsKpiSecondary summary={s} locale={locale} t={t} />

      {/* 5. Warnings (trust signal before visual series) */}
      <ResultsWarnings result={result} t={t} />

      {/* 6. Charts */}
      <ResultsCharts result={result} t={t} />

      {/* 7. Tables (progressive detail) */}
      <ResultsTables result={result} locale={locale} t={t} />

      {/* 8. Assumption transparency */}
      <ResultsAssumptions process={result.input.process} locale={locale} t={t} />
    </div>
  );
}
