import type { CalculationResult } from "@/core/domain/result";
import type { Locale } from "@/i18n/messages";

import { formatResultEur, formatResultNumber, formatResultPercent, formatResultTonnesFromKg } from "./format-result-values";

type TFn = (id: string, vars?: Record<string, string>) => string;

const DAILY_PREVIEW_ROWS = 21;

const tableClass = "w-full border-collapse text-sm";
const thClass = "border-b border-border bg-muted/40 px-2 py-2 text-left text-xs font-medium text-muted-foreground";
const tdClass = "border-b border-border/80 px-2 py-2 font-mono text-xs tabular-nums text-foreground";

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
      value: s.breakEvenMethanePriceEurPerTon === null ? na : formatResultEur(s.breakEvenMethanePriceEurPerTon, locale),
    },
    {
      label: t("results.kpi.methanePrice10"),
      value: s.methanePriceAt10PctProfitabilityEurPerTon === null ? na : formatResultEur(s.methanePriceAt10PctProfitabilityEurPerTon, locale),
    },
    {
      label: t("results.kpi.methanePrice30"),
      value: s.methanePriceAt30PctProfitabilityEurPerTon === null ? na : formatResultEur(s.methanePriceAt30PctProfitabilityEurPerTon, locale),
    },
    { label: t("results.kpi.deltaVsHydrogen"), value: formatResultEur(s.deltaVsHydrogenSaleEur, locale) },
  ];

  return (
    <section className="space-y-6" aria-labelledby="results-tables-heading">
      <h2 id="results-tables-heading" className="text-sm font-semibold tracking-tight text-foreground">
        {t("results.section.tables")}
      </h2>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("results.table.annualTitle")}
        </h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>{t("results.table.column.metric")}</th>
                <th className={thClass}>{t("results.table.column.value")}</th>
              </tr>
            </thead>
            <tbody>
              {annualRows.map((row) => (
                <tr key={row.label}>
                  <td className={`${tdClass} max-w-[min(280px,55vw)] whitespace-normal text-foreground/90`}>{row.label}</td>
                  <td className={tdClass}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("results.table.monthlyTitle")}
        </h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className={`${tableClass} min-w-[720px]`}>
            <thead>
              <tr>
                <th className={thClass}>{t("results.table.column.month")}</th>
                <th className={thClass}>{t("results.table.column.methaneT")}</th>
                <th className={thClass}>{t("results.table.column.electricityMwh")}</th>
                <th className={thClass}>{t("results.table.column.totalCostEur")}</th>
                <th className={thClass}>{t("results.table.column.methaneRevenueEur")}</th>
                <th className={thClass}>{t("results.table.column.hydrogenAltRevenueEur")}</th>
              </tr>
            </thead>
            <tbody>
              {result.monthlySummary.map((m) => (
                <tr key={m.monthIndex}>
                  <td className={tdClass}>
                    {t("co2.month")} {m.monthIndex + 1}
                  </td>
                  <td className={tdClass}>{formatResultTonnesFromKg(m.sums.methaneProducedKg, locale)}</td>
                  <td className={tdClass}>
                    {formatResultNumber(m.sums.electricityConsumedMwh, locale, { maximumFractionDigits: 4 })}
                  </td>
                  <td className={tdClass}>{formatResultEur(m.sums.totalCostEur, locale)}</td>
                  <td className={tdClass}>{formatResultEur(m.sums.methaneRevenueEur, locale)}</td>
                  <td className={tdClass}>{formatResultEur(m.sums.hydrogenAlternativeRevenueEur, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("results.table.dailyPreviewTitle")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("results.table.dailyPreviewNote", { shown: String(previewRows.length), total: String(totalDays) })}
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className={`${tableClass} min-w-[640px]`}>
            <thead>
              <tr>
                <th className={thClass}>{t("results.table.column.date")}</th>
                <th className={thClass}>{t("results.table.column.availableCo2Kg")}</th>
                <th className={thClass}>{t("results.table.column.methaneKg")}</th>
                <th className={thClass}>{t("results.table.column.electricityMwh")}</th>
                <th className={thClass}>{t("results.table.column.totalCostEur")}</th>
                <th className={thClass}>{t("results.table.column.methaneRevenueEur")}</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row) => (
                <tr key={row.dayIndex}>
                  <td className={tdClass}>{row.dateLabel}</td>
                  <td className={tdClass}>{formatResultNumber(row.availableCO2Kg, locale, { maximumFractionDigits: 2 })}</td>
                  <td className={tdClass}>{formatResultNumber(row.methaneProducedKg, locale, { maximumFractionDigits: 4 })}</td>
                  <td className={tdClass}>{formatResultNumber(row.electricityConsumedMwh, locale, { maximumFractionDigits: 6 })}</td>
                  <td className={tdClass}>{formatResultEur(row.totalCostEur, locale)}</td>
                  <td className={tdClass}>{formatResultEur(row.methaneRevenueEur, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
