"use client";

import type { CalculationResult } from "@/core/domain/result";
import type { Locale } from "@/i18n/messages";

import { formatResultEur } from "./format-result-values";
import { ResultsAssumptions } from "./results-assumptions";
import { ResultsCharts } from "./results-charts";
import { ResultsExcelExportButton } from "./results-excel-export-button";
import { ResultsPdfExportButton } from "./results-pdf-export-button";
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
    <div className="space-y-12 rounded-xl border border-border/80 bg-muted/25 px-6 py-8 shadow-sm ring-1 ring-foreground/[0.03] sm:px-8 sm:py-10">
      {/* 1. Outcome + scenario context */}
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

      <p className="text-xs leading-relaxed text-muted-foreground">{t("results.narrative.outcomeIntro")}</p>

      {/* 2. Headline KPIs */}
      <ResultsKpiHeadline summary={s} locale={locale} t={t} />

      {/* 3. Path comparison (revenues only — delta in headline) */}
      <section
        className="rounded-xl border border-border bg-card/90 p-5 shadow-sm sm:p-6"
        aria-labelledby="results-path-heading"
      >
        <h3 id="results-path-heading" className="text-base font-semibold tracking-tight text-foreground">
          {t("results.pathComparison.title")}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("results.pathComparison.help")}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border/80 bg-background/80 px-5 py-4">
            <p className="text-xs font-medium text-muted-foreground">{t("results.pathComparison.methaneRevenue")}</p>
            <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
              {formatResultEur(s.annualMethaneRevenueEur, locale)}
            </p>
          </div>
          <div className="rounded-lg border border-border/80 bg-background/80 px-5 py-4">
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
