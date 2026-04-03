import type { ScenarioSummary } from "@/core/domain/result";
import type { Locale } from "@/i18n/messages";

import { formatResultEur, formatResultNumber, formatResultPercent } from "./format-result-values";

type TFn = (id: string, vars?: Record<string, string>) => string;

type KpiKey =
  | "annualCo2Available"
  | "annualCo2Utilized"
  | "co2RecyclingRate"
  | "annualMethane"
  | "annualHydrogen"
  | "annualElectricity"
  | "annualVariableCost"
  | "annualCapex"
  | "annualTotalCost"
  | "annualMethaneRevenue"
  | "hydrogenAltRevenue"
  | "breakEvenMethanePrice"
  | "methanePrice10"
  | "methanePrice30"
  | "deltaVsHydrogen";

/** Decision-focused subset; order is intentional for scanability. */
const HEADLINE_KEYS: readonly KpiKey[] = [
  "deltaVsHydrogen",
  "annualTotalCost",
  "annualMethaneRevenue",
  "hydrogenAltRevenue",
  "breakEvenMethanePrice",
];

const SECONDARY_KEYS: readonly KpiKey[] = [
  "annualCo2Available",
  "annualCo2Utilized",
  "co2RecyclingRate",
  "annualMethane",
  "annualHydrogen",
  "annualElectricity",
  "annualVariableCost",
  "annualCapex",
  "methanePrice10",
  "methanePrice30",
];

function HeadlineKpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border/90 bg-card px-5 py-4 shadow-sm ring-1 ring-foreground/[0.04]">
      <p className="text-sm font-medium leading-snug text-muted-foreground">{label}</p>
      <p className="mt-2 break-words font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {sub ? <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function SecondaryKpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-card/80 px-4 py-3 shadow-sm">
      <p className="text-xs font-medium leading-snug text-muted-foreground">{label}</p>
      <p className="mt-1.5 break-words font-mono text-base font-semibold tabular-nums text-foreground">{value}</p>
      {sub ? <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function kpiContent(
  key: KpiKey,
  summary: ScenarioSummary,
  locale: Locale,
  t: TFn,
  na: string,
): { label: string; value: string; sub?: string } {
  switch (key) {
    case "annualCo2Available":
      return {
        label: t("results.kpi.annualCo2Available"),
        value: `${formatResultNumber(summary.annualCO2AvailableKg, locale, { maximumFractionDigits: 2 })} kg`,
      };
    case "annualCo2Utilized":
      return {
        label: t("results.kpi.annualCo2Utilized"),
        value: `${formatResultNumber(summary.annualCO2UtilizedKg, locale, { maximumFractionDigits: 2 })} kg`,
      };
    case "co2RecyclingRate":
      return {
        label: t("results.kpi.co2RecyclingRate"),
        value:
          summary.co2RecyclingRatePct === null ? na : formatResultPercent(summary.co2RecyclingRatePct, locale),
      };
    case "annualMethane":
      return {
        label: t("results.kpi.annualMethane"),
        value: `${formatResultNumber(summary.annualMethaneProducedTons, locale, { maximumFractionDigits: 4 })} t`,
      };
    case "annualHydrogen":
      return {
        label: t("results.kpi.annualHydrogen"),
        value: `${formatResultNumber(summary.annualHydrogenNeededKg, locale, { maximumFractionDigits: 2 })} kg`,
      };
    case "annualElectricity":
      return {
        label: t("results.kpi.annualElectricity"),
        value: `${formatResultNumber(summary.annualElectricityConsumedMwh, locale, { maximumFractionDigits: 4 })} MWh`,
      };
    case "annualVariableCost":
      return {
        label: t("results.kpi.annualVariableCost"),
        value: formatResultEur(summary.annualVariableCostEur, locale),
      };
    case "annualCapex":
      return {
        label: t("results.kpi.annualCapex"),
        value: formatResultEur(summary.annualCapexCostEur, locale),
      };
    case "annualTotalCost":
      return {
        label: t("results.kpi.annualTotalCost"),
        value: formatResultEur(summary.annualTotalCostEur, locale),
      };
    case "annualMethaneRevenue":
      return {
        label: t("results.kpi.annualMethaneRevenue"),
        value: formatResultEur(summary.annualMethaneRevenueEur, locale),
      };
    case "hydrogenAltRevenue":
      return {
        label: t("results.kpi.hydrogenAltRevenue"),
        value: formatResultEur(summary.hydrogenSalesAlternativeRevenueEur, locale),
      };
    case "breakEvenMethanePrice":
      return {
        label: t("results.kpi.breakEvenMethanePrice"),
        value:
          summary.breakEvenMethanePriceEurPerTon === null
            ? na
            : `${formatResultEur(summary.breakEvenMethanePriceEurPerTon, locale)} / t`,
      };
    case "methanePrice10":
      return {
        label: t("results.kpi.methanePrice10"),
        value:
          summary.methanePriceAt10PctProfitabilityEurPerTon === null
            ? na
            : `${formatResultEur(summary.methanePriceAt10PctProfitabilityEurPerTon, locale)} / t`,
      };
    case "methanePrice30":
      return {
        label: t("results.kpi.methanePrice30"),
        value:
          summary.methanePriceAt30PctProfitabilityEurPerTon === null
            ? na
            : `${formatResultEur(summary.methanePriceAt30PctProfitabilityEurPerTon, locale)} / t`,
      };
    case "deltaVsHydrogen":
      return {
        label: t("results.kpi.deltaVsHydrogen"),
        value: formatResultEur(summary.deltaVsHydrogenSaleEur, locale),
      };
    default: {
      const _x: never = key;
      return _x;
    }
  }
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
    <div className="space-y-8">
      <section className="space-y-4" aria-labelledby="results-kpi-headline-heading">
        <h3 id="results-kpi-headline-heading" className="text-base font-semibold tracking-tight text-foreground">
          {t("results.section.kpisHeadline")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {HEADLINE_KEYS.map((key) => {
            const { label, value, sub } = kpiContent(key, summary, locale, t, na);
            return <HeadlineKpiCard key={key} label={label} value={value} sub={sub} />;
          })}
        </div>
      </section>

      <section className="space-y-4 border-t border-border/70 pt-8" aria-labelledby="results-kpi-secondary-heading">
        <h3 id="results-kpi-secondary-heading" className="text-sm font-semibold tracking-tight text-foreground">
          {t("results.section.kpisSecondary")}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SECONDARY_KEYS.map((key) => {
            const { label, value, sub } = kpiContent(key, summary, locale, t, na);
            return <SecondaryKpiCard key={key} label={label} value={value} sub={sub} />;
          })}
        </div>
      </section>
    </div>
  );
}
