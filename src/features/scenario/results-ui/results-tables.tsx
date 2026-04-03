import type { CalculationResult } from "@/core/domain/result";
import type { Locale } from "@/i18n/messages";

import { formatResultEur, formatResultNumber, formatResultPercent, formatResultTonnesFromKg } from "./format-result-values";

type TFn = (id: string, vars?: Record<string, string>) => string;

const DAILY_PREVIEW_ROWS = 21;

const tableClass = "w-full border-collapse text-sm";
const thClass =
  "border-b border-border bg-muted/50 px-3 py-2.5 text-left text-xs font-medium text-muted-foreground first:pl-4 last:pr-4";
const tdClass =
  "border-b border-border/70 px-3 py-2.5 font-mono text-xs tabular-nums text-foreground first:pl-4 last:pr-4 align-top";

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
    { label: t("results.kpi.annualCo2Available"), value: `${formatResultNumber(s.annualCO2AvailableKg, locale, { maximumFractionDigits: 2 })} kg` },
    { label: t("results.kpi.annualCo2Utilized"), value: `${formatResultNumber(s.annualCO2UtilizedKg, locale, { maximumFractionDigits: 2 })} kg` },
    {
      label: t("results.kpi.co2RecyclingRate"),
      value: s.co2RecyclingRatePct === null ? na : formatResultPercent(s.co2RecyclingRatePct, locale),
    },
    { label: t("results.kpi.annualMethane"), value: `${formatResultNumber(s.annualMethaneProducedTons, locale, { maximumFractionDigits: 4 })} t` },
    { label: t("results.kpi.annualHydrogen"), value: `${formatResultNumber(s.annualHydrogenNeededKg, locale, { maximumFractionDigits: 2 })} kg` },
    { label: t("results.kpi.annualElectricity"), value: `${formatResultNumber(s.annualElectricityConsumedMwh, locale, { maximumFractionDigits: 4 })} MWh` },
    { label: t("results.kpi.annualVariableCost"), value: formatResultEur(s.annualVariableCostEur, locale) },
    { label: t("results.kpi.annualCapex"), value: formatResultEur(s.annualCapexCostEur, locale) },
    { label: t("results.kpi.annualTotalCost"), value: formatResultEur(s.annualTotalCostEur, locale) },
    { label: t("results.kpi.annualMethaneRevenue"), value: formatResultEur(s.annualMethaneRevenueEur, locale) },
    { label: t("results.kpi.hydrogenAltRevenue"), value: formatResultEur(s.hydrogenSalesAlternativeRevenueEur, locale) },
    {
      label: t("results.kpi.breakEvenMethanePrice"),
      value:
        s.breakEvenMethanePriceEurPerTon === null
          ? na
          : `${formatResultEur(s.breakEvenMethanePriceEurPerTon, locale)} / t`,
    },
    {
      label: t("results.kpi.methanePrice10"),
      value:
        s.methanePriceAt10PctProfitabilityEurPerTon === null
          ? na
          : `${formatResultEur(s.methanePriceAt10PctProfitabilityEurPerTon, locale)} / t`,
    },
    {
      label: t("results.kpi.methanePrice30"),
      value:
        s.methanePriceAt30PctProfitabilityEurPerTon === null
          ? na
          : `${formatResultEur(s.methanePriceAt30PctProfitabilityEurPerTon, locale)} / t`,
    },
    { label: t("results.kpi.deltaVsHydrogen"), value: formatResultEur(s.deltaVsHydrogenSaleEur, locale) },
  ];

  return (
    <section className="space-y-8" aria-labelledby="results-tables-heading">
      <h3 id="results-tables-heading" className="text-base font-semibold tracking-tight text-foreground">
        {t("results.section.tables")}
      </h3>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">{t("results.table.annualTitle")}</h4>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>{t("results.table.column.metric")}</th>
                <th className={`${thClass} text-right`}>{t("results.table.column.value")}</th>
              </tr>
            </thead>
            <tbody>
              {annualRows.map((row) => (
                <tr key={row.label} className="hover:bg-muted/30">
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
        <h4 className="text-sm font-semibold text-foreground">{t("results.table.monthlyTitle")}</h4>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className={`${tableClass} min-w-[720px]`}>
            <thead>
              <tr>
                <th className={thClass}>{t("results.table.column.month")}</th>
                <th className={`${thClass} text-right`}>{t("results.table.column.methaneT")}</th>
                <th className={`${thClass} text-right`}>{t("results.table.column.electricityMwh")}</th>
                <th className={`${thClass} text-right`}>{t("results.table.column.totalCostEur")}</th>
                <th className={`${thClass} text-right`}>{t("results.table.column.methaneRevenueEur")}</th>
                <th className={`${thClass} text-right`}>{t("results.table.column.hydrogenAltRevenueEur")}</th>
              </tr>
            </thead>
            <tbody>
              {result.monthlySummary.map((m) => (
                <tr key={m.monthIndex} className="hover:bg-muted/30">
                  <td className={`${tdClass} font-sans`}>
                    {t("co2.month")} {m.monthIndex + 1}
                  </td>
                  <td className={`${tdClass} text-right`}>{formatResultTonnesFromKg(m.sums.methaneProducedKg, locale)}</td>
                  <td className={`${tdClass} text-right`}>
                    {formatResultNumber(m.sums.electricityConsumedMwh, locale, { maximumFractionDigits: 4 })}
                  </td>
                  <td className={`${tdClass} text-right`}>{formatResultEur(m.sums.totalCostEur, locale)}</td>
                  <td className={`${tdClass} text-right`}>{formatResultEur(m.sums.methaneRevenueEur, locale)}</td>
                  <td className={`${tdClass} text-right`}>{formatResultEur(m.sums.hydrogenAlternativeRevenueEur, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground">{t("results.table.dailyPreviewTitle")}</h4>
        {totalDays === 0 ? (
          <p className="text-sm text-muted-foreground">{t("results.table.dailyPreviewEmpty")}</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {t("results.table.dailyPreviewNote", { shown: String(previewRows.length), total: String(totalDays) })}
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className={`${tableClass} min-w-[640px]`}>
                <thead>
                  <tr>
                    <th className={thClass}>{t("results.table.column.date")}</th>
                    <th className={`${thClass} text-right`}>{t("results.table.column.availableCo2Kg")}</th>
                    <th className={`${thClass} text-right`}>{t("results.table.column.methaneKg")}</th>
                    <th className={`${thClass} text-right`}>{t("results.table.column.electricityMwh")}</th>
                    <th className={`${thClass} text-right`}>{t("results.table.column.totalCostEur")}</th>
                    <th className={`${thClass} text-right`}>{t("results.table.column.methaneRevenueEur")}</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.dayIndex} className="hover:bg-muted/30">
                      <td className={`${tdClass} font-sans`}>{row.dateLabel}</td>
                      <td className={`${tdClass} text-right`}>
                        {formatResultNumber(row.availableCO2Kg, locale, { maximumFractionDigits: 2 })}
                      </td>
                      <td className={`${tdClass} text-right`}>
                        {formatResultNumber(row.methaneProducedKg, locale, { maximumFractionDigits: 4 })}
                      </td>
                      <td className={`${tdClass} text-right`}>
                        {formatResultNumber(row.electricityConsumedMwh, locale, { maximumFractionDigits: 6 })}
                      </td>
                      <td className={`${tdClass} text-right`}>{formatResultEur(row.totalCostEur, locale)}</td>
                      <td className={`${tdClass} text-right`}>{formatResultEur(row.methaneRevenueEur, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
