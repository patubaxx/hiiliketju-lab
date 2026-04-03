"use client";

import type { CalculationResult } from "@/core/domain/result";
import type { Locale } from "@/i18n/messages";

import { formatResultEur } from "./format-result-values";
import { ResultsAssumptions } from "./results-assumptions";
import { ResultsExcelExportButton } from "./results-excel-export-button";
import { ResultsPdfExportButton } from "./results-pdf-export-button";
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
    <div className="space-y-12 rounded-xl border border-border/80 bg-muted/25 px-6 py-8 shadow-sm ring-1 ring-foreground/[0.03] sm:px-8 sm:py-10">
      <header className="space-y-3 border-b border-border/80 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">{t("results.title")}</h3>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <ResultsExcelExportButton result={result} t={t} />
            <ResultsPdfExportButton result={result} t={t} />
          </div>
        </div>
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
        className="rounded-lg border border-emerald-600/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-foreground"
        role="status"
      >
        {t("results.success")}
      </p>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">{t("results.section.kpis")}</h4>
        <ResultsKpiGrid summary={result.annualSummary} locale={locale} t={t} />
      </div>

      <section
        className="rounded-xl border border-border bg-card/90 p-5 shadow-sm sm:p-6"
        aria-labelledby="results-path-heading"
      >
        <h3 id="results-path-heading" className="text-base font-semibold tracking-tight text-foreground">
          {t("results.section.pathComparison")}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("results.pathComparison.help")}</p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border/80 bg-background/80 px-4 py-3">
            <dt className="text-xs font-medium text-muted-foreground">{t("results.pathComparison.methaneRevenue")}</dt>
            <dd className="mt-1.5 font-mono text-sm font-semibold tabular-nums text-foreground">
              {formatResultEur(result.annualSummary.annualMethaneRevenueEur, locale)}
            </dd>
          </div>
          <div className="rounded-lg border border-border/80 bg-background/80 px-4 py-3">
            <dt className="text-xs font-medium text-muted-foreground">{t("results.pathComparison.hydrogenAltRevenue")}</dt>
            <dd className="mt-1.5 font-mono text-sm font-semibold tabular-nums text-foreground">
              {formatResultEur(result.annualSummary.hydrogenSalesAlternativeRevenueEur, locale)}
            </dd>
          </div>
          <div className="rounded-lg border border-border/80 bg-background/80 px-4 py-3">
            <dt className="text-xs font-medium text-muted-foreground">{t("results.pathComparison.delta")}</dt>
            <dd className="mt-1.5 font-mono text-sm font-semibold tabular-nums text-foreground">
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
