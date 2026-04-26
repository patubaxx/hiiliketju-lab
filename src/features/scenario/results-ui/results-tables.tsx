import { calendarMonthMessageId } from "@/core/domain/calendar-month-order";
import type { CalculationResult } from "@/core/domain/result";
import type { Locale } from "@/i18n/messages";

import {
  formatResultEurCompact,
  formatResultEnergyMwhCompact,
  formatResultMassKgCompact,
  formatResultNumberDisplay,
  formatResultPercent,
  formatResultTonnesFromKg,
} from "./format-result-values";

type TFn = (id: string, vars?: Record<string, string>) => string;

const DAILY_PREVIEW_ROWS = 21;

const tableClass = "w-full border-collapse text-sm";
const thClass =
  "border-b border-border bg-muted/50 px-3 py-2.5 text-left text-xs font-medium text-muted-foreground first:pl-4 last:pr-4";
const tdClass =
  "border-b border-border/60 px-3 py-2.5 font-mono text-xs tabular-nums text-foreground first:pl-4 last:pr-4 align-top";

function zebraRowClass(i: number): string {
  return i % 2 === 1 ? "bg-muted/[0.12]" : "";
}

export function ResultsTables({
  result,
  locale,
  t,
}: {
  readonly result: CalculationResult;
  readonly locale: Locale;
  readonly t: TFn;
}) {
  const s = result.annualSummary;
  const na = t("results.value.na");
  const previewRows = result.dailyResults.slice(0, DAILY_PREVIEW_ROWS);
  const totalDays = result.dailyResults.length;

  const annualRows: { label: string; value: string }[] = [
    { label: t("results.kpi.annualCo2Available"), value: formatResultMassKgCompact(s.annualCO2AvailableKg, locale, t) },
    { label: t("results.kpi.annualCo2Utilized"), value: formatResultMassKgCompact(s.annualCO2UtilizedKg, locale, t) },
    {
      label: t("results.kpi.co2RecyclingRate"),
      value: s.co2RecyclingRatePct === null ? na : formatResultPercent(s.co2RecyclingRatePct, locale),
    },
    {
      label: t("results.kpi.annualMethane"),
      value: `${formatResultNumberDisplay(s.annualMethaneProducedTons, locale)} t`,
    },
    { label: t("results.kpi.annualHydrogen"), value: formatResultMassKgCompact(s.annualHydrogenNeededKg, locale, t) },
    {
      label: t("results.kpi.annualElectricity"),
      value: formatResultEnergyMwhCompact(s.annualElectricityConsumedMwh, locale, t),
    },
    { label: t("results.kpi.annualVariableCost"), value: formatResultEurCompact(s.annualVariableCostEur, locale, t) },
    { label: t("results.kpi.annualCapex"), value: formatResultEurCompact(s.annualCapexCostEur, locale, t) },
    { label: t("results.kpi.annualTotalCost"), value: formatResultEurCompact(s.annualTotalCostEur, locale, t) },
    { label: t("results.kpi.annualMethaneRevenue"), value: formatResultEurCompact(s.annualMethaneRevenueEur, locale, t) },
    { label: t("results.kpi.hydrogenAltRevenue"), value: formatResultEurCompact(s.hydrogenSalesAlternativeRevenueEur, locale, t) },
    {
      label: t("results.kpi.breakEvenMethanePrice"),
      value:
        s.breakEvenMethanePriceEurPerTon === null
          ? na
          : `${formatResultNumberDisplay(s.breakEvenMethanePriceEurPerTon, locale)} EUR/t`,
    },
    {
      label: t("results.kpi.methanePrice10"),
      value:
        s.methanePriceAt10PctProfitabilityEurPerTon === null
          ? na
          : `${formatResultNumberDisplay(s.methanePriceAt10PctProfitabilityEurPerTon, locale)} EUR/t`,
    },
    {
      label: t("results.kpi.methanePrice30"),
      value:
        s.methanePriceAt30PctProfitabilityEurPerTon === null
          ? na
          : `${formatResultNumberDisplay(s.methanePriceAt30PctProfitabilityEurPerTon, locale)} EUR/t`,
    },
    { label: t("results.kpi.deltaVsHydrogen"), value: formatResultEurCompact(s.deltaVsHydrogenSaleEur, locale, t) },
  ];

  return (
    <section className="space-y-10 border-t border-border/70 pt-10" aria-labelledby="results-tables-heading">
      <div className="space-y-2">
        <h3 id="results-tables-heading" className="text-base font-semibold tracking-tight text-foreground">
          {t("results.section.tables")}
        </h3>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{t("results.section.tablesDetailLead")}</p>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{t("results.table.annualTitle")}</h4>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("results.table.annualIntro")}</p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/30 shadow-[var(--shadow-tile)] dark:bg-card/18">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>{t("results.table.column.metric")}</th>
                <th className={`${thClass} w-[min(12rem,28vw)] text-right`}>{t("results.table.column.value")}</th>
              </tr>
            </thead>
            <tbody>
              {annualRows.map((row, i) => (
                <tr key={row.label} className={`${zebraRowClass(i)} transition-colors hover:bg-muted/25`}>
                  <td
                    className={`${tdClass} max-w-[min(280px,55vw)] whitespace-normal font-sans text-foreground/90`}
                  >
                    {row.label}
                  </td>
                  <td className={`${tdClass} text-right`}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{t("results.table.monthlyTitle")}</h4>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("results.table.monthlyIntro")}</p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/30 shadow-[var(--shadow-tile)] dark:bg-card/18">
          <table className={`${tableClass} min-w-[720px]`}>
            <thead>
              <tr>
                <th className={`${thClass} min-w-[5.5rem]`}>{t("results.table.column.month")}</th>
                <th className={`${thClass} text-right`}>{t("results.table.column.methaneT")}</th>
                <th className={`${thClass} text-right`}>{t("results.table.column.electricityMwh")}</th>
                <th className={`${thClass} text-right`}>{t("results.table.column.totalCostEur")}</th>
                <th className={`${thClass} text-right`}>{t("results.table.column.methaneRevenueEur")}</th>
                <th className={`${thClass} text-right`}>{t("results.table.column.hydrogenAltRevenueEur")}</th>
              </tr>
            </thead>
            <tbody>
              {result.monthlySummary.map((m, i) => (
                <tr key={m.monthIndex} className={`${zebraRowClass(i)} transition-colors hover:bg-muted/25`}>
                  <td className={`${tdClass} font-sans`}>
                    {t(calendarMonthMessageId(m.monthIndex))}
                  </td>
                  <td className={`${tdClass} text-right`}>{formatResultTonnesFromKg(m.sums.methaneProducedKg, locale, t)}</td>
                  <td className={`${tdClass} text-right`}>
                    {formatResultNumberDisplay(m.sums.electricityConsumedMwh, locale)}
                  </td>
                  <td className={`${tdClass} text-right`}>{formatResultEurCompact(m.sums.totalCostEur, locale, t)}</td>
                  <td className={`${tdClass} text-right`}>{formatResultEurCompact(m.sums.methaneRevenueEur, locale, t)}</td>
                  <td className={`${tdClass} text-right`}>{formatResultEurCompact(m.sums.hydrogenAlternativeRevenueEur, locale, t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">{t("results.table.dailyPreviewTitle")}</h4>
        {totalDays === 0 ? (
          <p className="text-sm text-muted-foreground">{t("results.table.dailyPreviewEmpty")}</p>
        ) : (
          <details className="group rounded-xl border border-dashed border-border/80 bg-muted/10 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground marker:text-muted-foreground">
              {t("results.table.dailyPreviewDetails")}
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t("results.table.dailyPreviewNote", { shown: String(previewRows.length), total: String(totalDays) })}
            </p>
            <div className="mt-4 overflow-x-auto rounded-lg border border-border/80 bg-card/40">
              <table className={`${tableClass} min-w-[640px]`}>
                <thead>
                  <tr>
                    <th className={`${thClass} min-w-[6.5rem]`}>{t("results.table.column.date")}</th>
                    <th className={`${thClass} text-right`}>{t("results.table.column.availableCo2Kg")}</th>
                    <th className={`${thClass} text-right`}>{t("results.table.column.methaneKg")}</th>
                    <th className={`${thClass} text-right`}>{t("results.table.column.electricityMwh")}</th>
                    <th className={`${thClass} text-right`}>{t("results.table.column.totalCostEur")}</th>
                    <th className={`${thClass} text-right`}>{t("results.table.column.methaneRevenueEur")}</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={row.dayIndex} className={`${zebraRowClass(i)} transition-colors hover:bg-muted/25`}>
                      <td className={`${tdClass} font-sans`}>{row.dateLabel}</td>
                      <td className={`${tdClass} text-right`}>
                        {formatResultNumberDisplay(row.availableCO2Kg, locale)}
                      </td>
                      <td className={`${tdClass} text-right`}>
                        {formatResultNumberDisplay(row.methaneProducedKg, locale)}
                      </td>
                      <td className={`${tdClass} text-right`}>
                        {formatResultNumberDisplay(row.electricityConsumedMwh, locale)}
                      </td>
                      <td className={`${tdClass} text-right`}>{formatResultEurCompact(row.totalCostEur, locale, t)}</td>
                      <td className={`${tdClass} text-right`}>{formatResultEurCompact(row.methaneRevenueEur, locale, t)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </div>
    </section>
  );
}
