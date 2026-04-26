import type { ScenarioSummary } from "@/core/domain/result";
import type { Locale } from "@/i18n/messages";

import {
  formatResultEurCompact,
  formatResultEnergyMwhCompact,
  formatResultMassKgCompact,
  formatResultNumberDisplay,
  formatResultPercent,
} from "./format-result-values";

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

/**
 * Executive summary — avoids duplicating path revenues shown in path comparison.
 */
const HEADLINE_KEYS: readonly KpiKey[] = ["deltaVsHydrogen", "annualTotalCost", "breakEvenMethanePrice"];

/**
 * Physical / cost / price context; path revenues appear in path comparison + annual table.
 */
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
    <div className="rounded-lg border border-border/65 bg-card/85 px-4 py-3.5 shadow-[var(--shadow-tile)] dark:bg-card/45">
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
    <div className="rounded-lg border border-border/60 bg-card/65 px-4 py-3 shadow-[var(--shadow-tile)] dark:bg-card/38">
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
        value: formatResultMassKgCompact(summary.annualCO2AvailableKg, locale, t),
      };
    case "annualCo2Utilized":
      return {
        label: t("results.kpi.annualCo2Utilized"),
        value: formatResultMassKgCompact(summary.annualCO2UtilizedKg, locale, t),
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
        value: `${formatResultNumberDisplay(summary.annualMethaneProducedTons, locale)} t`,
      };
    case "annualHydrogen":
      return {
        label: t("results.kpi.annualHydrogen"),
        value: formatResultMassKgCompact(summary.annualHydrogenNeededKg, locale, t),
      };
    case "annualElectricity":
      return {
        label: t("results.kpi.annualElectricity"),
        value: formatResultEnergyMwhCompact(summary.annualElectricityConsumedMwh, locale, t),
      };
    case "annualVariableCost":
      return {
        label: t("results.kpi.annualVariableCost"),
        value: formatResultEurCompact(summary.annualVariableCostEur, locale, t),
      };
    case "annualCapex":
      return {
        label: t("results.kpi.annualCapex"),
        value: formatResultEurCompact(summary.annualCapexCostEur, locale, t),
      };
    case "annualTotalCost":
      return {
        label: t("results.kpi.annualTotalCost"),
        value: formatResultEurCompact(summary.annualTotalCostEur, locale, t),
      };
    case "annualMethaneRevenue":
      return {
        label: t("results.kpi.annualMethaneRevenue"),
        value: formatResultEurCompact(summary.annualMethaneRevenueEur, locale, t),
      };
    case "hydrogenAltRevenue":
      return {
        label: t("results.kpi.hydrogenAltRevenue"),
        value: formatResultEurCompact(summary.hydrogenSalesAlternativeRevenueEur, locale, t),
      };
    case "breakEvenMethanePrice":
      return {
        label: t("results.kpi.breakEvenMethanePrice"),
        value:
          summary.breakEvenMethanePriceEurPerTon === null
            ? na
            : `${formatResultEurCompact(summary.breakEvenMethanePriceEurPerTon, locale, t)}/t`,
      };
    case "methanePrice10":
      return {
        label: t("results.kpi.methanePrice10"),
        value:
          summary.methanePriceAt10PctProfitabilityEurPerTon === null
            ? na
            : `${formatResultEurCompact(summary.methanePriceAt10PctProfitabilityEurPerTon, locale, t)}/t`,
      };
    case "methanePrice30":
      return {
        label: t("results.kpi.methanePrice30"),
        value:
          summary.methanePriceAt30PctProfitabilityEurPerTon === null
            ? na
            : `${formatResultEurCompact(summary.methanePriceAt30PctProfitabilityEurPerTon, locale, t)}/t`,
      };
    case "deltaVsHydrogen":
      return {
        label: t("results.kpi.deltaVsHydrogen"),
        value: formatResultEurCompact(summary.deltaVsHydrogenSaleEur, locale, t),
      };
    default: {
      const _x: never = key;
      return _x;
    }
  }
}

export function ResultsKpiHeadline({
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
    <section className="space-y-4" aria-labelledby="results-kpi-headline-heading">
      <h3 id="results-kpi-headline-heading" className="text-base font-semibold tracking-tight text-foreground">
        {t("results.section.kpisHeadline")}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HEADLINE_KEYS.map((key) => {
          const { label, value, sub } = kpiContent(key, summary, locale, t, na);
          return <HeadlineKpiCard key={key} label={label} value={value} sub={sub} />;
        })}
      </div>
    </section>
  );
}

export function ResultsKpiSecondary({
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
    <section className="space-y-4 border-t border-border/70 pt-8" aria-labelledby="results-kpi-secondary-heading">
      <div className="space-y-1">
        <h3 id="results-kpi-secondary-heading" className="text-sm font-semibold tracking-tight text-foreground">
          {t("results.section.kpisSecondary")}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">{t("results.kpiSecondary.lead")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SECONDARY_KEYS.map((key) => {
          const { label, value, sub } = kpiContent(key, summary, locale, t, na);
          return <SecondaryKpiCard key={key} label={label} value={value} sub={sub} />;
        })}
      </div>
    </section>
  );
}

/** Renders both tiers; prefer `ResultsKpiHeadline` + `ResultsKpiSecondary` in the panel for layout control. */
export function ResultsKpiGrid({
  summary,
  locale,
  t,
}: {
  readonly summary: ScenarioSummary;
  readonly locale: Locale;
  readonly t: TFn;
}) {
  return (
    <div className="space-y-8">
      <ResultsKpiHeadline summary={summary} locale={locale} t={t} />
      <ResultsKpiSecondary summary={summary} locale={locale} t={t} />
    </div>
  );
}
