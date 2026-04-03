import type { ScenarioSummary } from "@/core/domain/result";
import type { Locale } from "@/i18n/messages";

import { formatResultEur, formatResultNumber, formatResultPercent } from "./format-result-values";

type TFn = (id: string, vars?: Record<string, string>) => string;

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-mono text-lg font-semibold tabular-nums text-foreground">{value}</p>
      {sub ? <p className="mt-1 text-[0.7rem] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function ResultsKpiGrid({
  summary,
  locale,
  t,
}: {
  readonly summary: ScenarioSummary;
  readonly locale: Locale;
  readonly t: TFn;
}) {
  const na = t("results.value.na");

  return (
    <section className="space-y-3" aria-labelledby="results-kpi-heading">
      <h3 id="results-kpi-heading" className="text-sm font-semibold tracking-tight text-foreground">
        {t("results.section.kpis")}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <KpiCard
          label={t("results.kpi.annualCo2Available")}
          value={`${formatResultNumber(summary.annualCO2AvailableKg, locale, { maximumFractionDigits: 2 })} kg`}
        />
        <KpiCard
          label={t("results.kpi.annualCo2Utilized")}
          value={`${formatResultNumber(summary.annualCO2UtilizedKg, locale, { maximumFractionDigits: 2 })} kg`}
        />
        <KpiCard
          label={t("results.kpi.co2RecyclingRate")}
          value={
            summary.co2RecyclingRatePct === null ? na : formatResultPercent(summary.co2RecyclingRatePct, locale)
          }
        />
        <KpiCard
          label={t("results.kpi.annualMethane")}
          value={`${formatResultNumber(summary.annualMethaneProducedTons, locale, { maximumFractionDigits: 4 })} t`}
        />
        <KpiCard
          label={t("results.kpi.annualHydrogen")}
          value={`${formatResultNumber(summary.annualHydrogenNeededKg, locale, { maximumFractionDigits: 2 })} kg`}
        />
        <KpiCard
          label={t("results.kpi.annualElectricity")}
          value={`${formatResultNumber(summary.annualElectricityConsumedMwh, locale, { maximumFractionDigits: 4 })} MWh`}
        />
        <KpiCard
          label={t("results.kpi.annualVariableCost")}
          value={formatResultEur(summary.annualVariableCostEur, locale)}
        />
        <KpiCard
          label={t("results.kpi.annualCapex")}
          value={formatResultEur(summary.annualCapexCostEur, locale)}
        />
        <KpiCard
          label={t("results.kpi.annualTotalCost")}
          value={formatResultEur(summary.annualTotalCostEur, locale)}
        />
        <KpiCard
          label={t("results.kpi.annualMethaneRevenue")}
          value={formatResultEur(summary.annualMethaneRevenueEur, locale)}
        />
        <KpiCard
          label={t("results.kpi.hydrogenAltRevenue")}
          value={formatResultEur(summary.hydrogenSalesAlternativeRevenueEur, locale)}
        />
        <KpiCard
          label={t("results.kpi.breakEvenMethanePrice")}
          value={
            summary.breakEvenMethanePriceEurPerTon === null
              ? na
              : `${formatResultEur(summary.breakEvenMethanePriceEurPerTon, locale)} / t`
          }
        />
        <KpiCard
          label={t("results.kpi.methanePrice10")}
          value={
            summary.methanePriceAt10PctProfitabilityEurPerTon === null
              ? na
              : `${formatResultEur(summary.methanePriceAt10PctProfitabilityEurPerTon, locale)} / t`
          }
        />
        <KpiCard
          label={t("results.kpi.methanePrice30")}
          value={
            summary.methanePriceAt30PctProfitabilityEurPerTon === null
              ? na
              : `${formatResultEur(summary.methanePriceAt30PctProfitabilityEurPerTon, locale)} / t`
          }
        />
        <KpiCard
          label={t("results.kpi.deltaVsHydrogen")}
          value={formatResultEur(summary.deltaVsHydrogenSaleEur, locale)}
        />
      </div>
    </section>
  );
}
