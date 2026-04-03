"use client";

import type { CalculationResult } from "@/core/domain/result";
import type { Locale } from "@/i18n/messages";

import { formatResultEur } from "./format-result-values";
import { ResultsAssumptions } from "./results-assumptions";
import { ResultsCharts } from "./results-charts";
import { ResultsKpiGrid } from "./results-kpi-grid";
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
  return (
    <div className="space-y-10">
      <header className="space-y-1 border-b border-border pb-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{t("results.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("results.summary.lead")}</p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("results.summary.scenarioName")}
            </dt>
            <dd className="font-medium text-foreground">{result.input.scenarioName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("results.summary.assumptionsVersion")}
            </dt>
            <dd className="font-mono text-xs text-foreground">{result.input.assumptionsMeta.assumptionsVersion}</dd>
          </div>
          {result.input.assumptionsMeta.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("results.summary.scenarioNotes")}
              </dt>
              <dd className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">{result.input.assumptionsMeta.notes}</dd>
            </div>
          ) : null}
        </dl>
      </header>

      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{t("results.success")}</p>

      <ResultsKpiGrid summary={result.annualSummary} locale={locale} t={t} />

      <section
        className="rounded-xl border border-border bg-muted/20 p-4 shadow-sm"
        aria-labelledby="results-path-heading"
      >
        <h2 id="results-path-heading" className="text-sm font-semibold tracking-tight text-foreground">
          {t("results.section.pathComparison")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("results.pathComparison.help")}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-3">
            <dt className="text-xs text-muted-foreground">{t("results.pathComparison.methaneRevenue")}</dt>
            <dd className="mt-1 font-mono text-sm font-semibold tabular-nums">
              {formatResultEur(result.annualSummary.annualMethaneRevenueEur, locale)}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <dt className="text-xs text-muted-foreground">{t("results.pathComparison.hydrogenAltRevenue")}</dt>
            <dd className="mt-1 font-mono text-sm font-semibold tabular-nums">
              {formatResultEur(result.annualSummary.hydrogenSalesAlternativeRevenueEur, locale)}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <dt className="text-xs text-muted-foreground">{t("results.pathComparison.delta")}</dt>
            <dd className="mt-1 font-mono text-sm font-semibold tabular-nums">
              {formatResultEur(result.annualSummary.deltaVsHydrogenSaleEur, locale)}
            </dd>
          </div>
        </dl>
      </section>

      <ResultsCharts result={result} t={t} />

      <ResultsTables result={result} locale={locale} t={t} />

      <ResultsAssumptions process={result.input.process} locale={locale} t={t} />

      <ResultsWarnings result={result} t={t} />
    </div>
  );
}
