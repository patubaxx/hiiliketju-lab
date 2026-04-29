import type { ScenarioSummary } from "@/core/domain/result";
import type { Locale } from "@/i18n/messages";

import { cn } from "@/lib/utils";

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
  | "annualCo2FreeUsed"
  | "annualCo2Purchased"
  | "annualCo2PurchaseCost"
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
  | "deltaVsHydrogen"
  | "h2BindingDays"
  | "ch4BindingDays";

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
    <div className="flex min-h-[5.25rem] flex-col rounded-lg border border-border/60 border-l-[3px] border-l-structural/40 bg-card/90 px-4 py-3.5 shadow-[var(--shadow-tile)] dark:border-structural/35 dark:bg-card/48">
      <p className="text-sm font-medium leading-snug text-muted-foreground">{label}</p>
      <p className="mt-auto break-words pt-2 font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground">
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
    <div className="flex min-h-[4.5rem] flex-col rounded-lg border border-border/55 bg-card/55 px-4 py-3 shadow-[var(--shadow-tile)] dark:bg-card/32">
      <p className="text-xs font-medium leading-snug text-muted-foreground">{label}</p>
      <p className="mt-auto break-words pt-1.5 font-mono text-base font-semibold tabular-nums text-foreground">{value}</p>
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
        sub: t("results.kpiHelp.annualCo2Utilized"),
      };
    case "co2RecyclingRate":
      return {
        label: t("results.kpi.co2RecyclingRate"),
        value:
          summary.co2RecyclingRatePct === null ? na : formatResultPercent(summary.co2RecyclingRatePct, locale),
        sub: t("results.kpiHelp.co2RecyclingRate"),
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
    case "annualCo2FreeUsed":
      return {
        label: t("results.kpi.annualCo2FreeUsed"),
        value: formatResultMassKgCompact(summary.annualFreeCo2UsedKg, locale, t),
        sub: t("results.kpiHelp.annualCo2FreeUsed"),
      };
    case "annualCo2Purchased":
      return {
        label: t("results.kpi.annualCo2Purchased"),
        value: formatResultMassKgCompact(summary.annualPurchasedCo2Kg, locale, t),
        sub: t("results.kpiHelp.annualCo2Purchased"),
      };
    case "annualCo2PurchaseCost":
      return {
        label: t("results.kpi.annualCo2PurchaseCost"),
        value: formatResultEurCompact(summary.annualCo2PurchaseCostEur, locale, t),
        sub: t("results.kpiHelp.annualCo2PurchaseCost"),
      };
    case "h2BindingDays":
      return {
        label: t("results.kpi.h2BindingDays"),
        value: `${formatResultNumberDisplay(summary.h2CapacityBindingDays, locale)} ${t("results.unit.days")}`,
        sub: t("results.kpiHelp.bindingDays"),
      };
    case "ch4BindingDays":
      return {
        label: t("results.kpi.ch4BindingDays"),
        value: `${formatResultNumberDisplay(summary.ch4CapacityBindingDays, locale)} ${t("results.unit.days")}`,
        sub: t("results.kpiHelp.bindingDays"),
      };
    default: {
      const _x: never = key;
      return _x;
    }
  }
}

/**
 * WP28: extra KPIs that are only meaningful when caps and/or purchase are active.
 * Surface them only when at least one is non-trivial; otherwise the headline grid stays uncluttered.
 */
function shouldRenderWp28Kpi(key: KpiKey, summary: ScenarioSummary): boolean {
  switch (key) {
    case "annualCo2FreeUsed":
    case "annualCo2Purchased":
    case "annualCo2PurchaseCost":
      return summary.annualPurchasedCo2Kg > 0 || summary.annualCo2PurchaseCostEur > 0;
    case "h2BindingDays":
      return summary.h2CapacityBindingDays > 0;
    case "ch4BindingDays":
      return summary.ch4CapacityBindingDays > 0;
    default:
      return false;
  }
}

const WP28_OPTIONAL_KEYS: readonly KpiKey[] = [
  "annualCo2FreeUsed",
  "annualCo2Purchased",
  "annualCo2PurchaseCost",
  "h2BindingDays",
  "ch4BindingDays",
];

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
  className,
}: {
  readonly summary: ScenarioSummary;
  readonly locale: Locale;
  readonly t: TFn;
  readonly className?: string;
}) {
  const na = t("results.value.na");

  return (
    <section
      className={cn("space-y-4 border-t border-border/60 pt-6", className)}
      aria-labelledby="results-kpi-secondary-heading"
    >
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
        {WP28_OPTIONAL_KEYS.filter((k) => shouldRenderWp28Kpi(k, summary)).map((key) => {
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
