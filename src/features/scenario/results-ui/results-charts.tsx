"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";

import { calendarMonthMessageId } from "@/core/domain/calendar-month-order";
import type { CalculationResult } from "@/core/domain/result";
import { pickEurPerDayYScaleFromMaxAbsEur, pickMassPerDayYScaleFromMaxAbsKg } from "@/core/presentation/chart-daily-scales";
import { formatDisplayNumber } from "@/core/presentation/format-scaled-number";
import type { Locale } from "@/i18n/messages";

const localeForIntl: Record<Locale, string> = { en: "en-GB", fi: "fi-FI", sv: "sv-SE" };

type TFn = (id: string, vars?: Record<string, string>) => string;

const CHART_CONTAINER_HEIGHT_PX = 320;

const responsiveChartProps = {
  width: "100%" as const,
  height: CHART_CONTAINER_HEIGHT_PX,
  minHeight: CHART_CONTAINER_HEIGHT_PX,
  minWidth: 0 as const,
  initialDimension: { width: 800, height: CHART_CONTAINER_HEIGHT_PX },
};

const chartMarginDefault = { top: 10, right: 14, left: 6, bottom: 44 };
const chartMarginWithLegend = { top: 10, right: 14, left: 6, bottom: 58 };

const tickStyle = { fontSize: 12, fill: "var(--muted-foreground)" } as const;
const axisLabelStyle = { fontSize: 12, fill: "var(--muted-foreground)" };

function maxAbsOf(nums: readonly number[]): number {
  if (nums.length === 0) {
    return 0;
  }
  return Math.max(...nums.map((n) => Math.abs(n)));
}

function fmt2(value: number, locale: Locale): string {
  return formatDisplayNumber(value, { maxDecimals: 2, locale: localeForIntl[locale] });
}

function ChartCard({
  title,
  xAxisCaption,
  children,
}: {
  title: string;
  xAxisCaption: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border/65 bg-card/75 p-4 shadow-[var(--shadow-tile)] dark:bg-card/38 sm:p-5">
      <h4 className="text-sm font-semibold leading-snug text-foreground">{title}</h4>
      <div className="mt-4 w-full min-w-0 overflow-x-auto overscroll-x-contain sm:overflow-x-visible [-webkit-overflow-scrolling:touch]">
        <div
          className="w-full max-sm:min-w-[600px] sm:min-w-0"
          style={{
            height: CHART_CONTAINER_HEIGHT_PX,
            minHeight: CHART_CONTAINER_HEIGHT_PX,
          }}
        >
          {children}
        </div>
      </div>
      <p className="mt-2 text-center text-xs leading-snug text-muted-foreground">{xAxisCaption}</p>
    </div>
  );
}

export function ResultsCharts({
  result,
  locale,
  t,
}: {
  result: CalculationResult;
  locale: Locale;
  t: TFn;
}) {
  const co2Raw = result.resolvedDailyCo2;
  const co2YScale = React.useMemo(() => {
    const m = maxAbsOf(co2Raw.map((p) => p.availableCO2Kg));
    return pickMassPerDayYScaleFromMaxAbsKg(m);
  }, [co2Raw]);

  const co2Data = React.useMemo(
    () =>
      co2Raw.map((p) => ({
        x: p.dayIndex,
        label: p.dateLabel,
        y: p.availableCO2Kg / co2YScale.divisor,
      })),
    [co2Raw, co2YScale.divisor],
  );

  const co2YLabel =
    co2YScale.unitId === "t"
      ? t("results.chart.axis.yTpd")
      : co2YScale.unitId === "kt"
        ? t("results.chart.axis.yKtd")
        : t("results.chart.axis.yKgd");

  const priceData = React.useMemo(
    () =>
      result.resolvedDailyElectricityPrice.map((p) => ({
        x: p.dayIndex,
        label: p.dateLabel,
        y: p.electricityPriceEurPerMWh,
      })),
    [result.resolvedDailyElectricityPrice],
  );

  const methaneRaw = result.dailyResults;
  const methaneYScale = React.useMemo(() => {
    const m = maxAbsOf(methaneRaw.map((r) => r.methaneProducedKg));
    return pickMassPerDayYScaleFromMaxAbsKg(m);
  }, [methaneRaw]);

  const methaneData = React.useMemo(
    () =>
      methaneRaw.map((row) => ({
        x: row.dayIndex,
        label: row.dateLabel,
        y: row.methaneProducedKg / methaneYScale.divisor,
      })),
    [methaneRaw, methaneYScale.divisor],
  );

  const methaneYLabel =
    methaneYScale.unitId === "t"
      ? t("results.chart.axis.yMethaneTpd")
      : methaneYScale.unitId === "kt"
        ? t("results.chart.axis.yMethaneKtd")
        : t("results.chart.axis.yMethaneKgd");

  const costRevRaw = result.dailyResults;
  const eurYScale = React.useMemo(() => {
    const m = maxAbsOf(
      costRevRaw.flatMap((r) => [r.totalCostEur, r.methaneRevenueEur] as const),
    );
    return pickEurPerDayYScaleFromMaxAbsEur(m);
  }, [costRevRaw]);

  const costRevData = React.useMemo(
    () =>
      costRevRaw.map((row) => ({
        x: row.dayIndex,
        label: row.dateLabel,
        cost: row.totalCostEur / eurYScale.divisor,
        rev: row.methaneRevenueEur / eurYScale.divisor,
      })),
    [costRevRaw, eurYScale.divisor],
  );

  const eurYLabel =
    eurYScale.unitId === "kEUR"
      ? t("results.chart.axis.yCostKEurD")
      : eurYScale.unitId === "MEUR"
        ? t("results.chart.axis.yCostMeurD")
        : t("results.chart.axis.yCostEurD");

  const eurUnitHint =
    eurYScale.unitId === "kEUR"
      ? t("results.chart.unit.kEurPerD")
      : eurYScale.unitId === "MEUR"
        ? t("results.chart.unit.meurPerD")
        : t("results.chart.unit.eurPerD");

  const tickFormatterX = React.useCallback((v: number) => String(v), []);

  const tooltipFormatter = React.useCallback<NonNullable<TooltipProps["formatter"]>>(
    (value, name) => {
      const label = name == null ? "" : String(name);
      if (value === undefined) {
        return ["", label];
      }
      if (Array.isArray(value)) {
        return [String(value), label];
      }
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return [String(value), label];
      }
      return [`${fmt2(value, locale)}`, label];
    },
    [locale],
  );

  const co2YTick = React.useCallback((v: number) => fmt2(v, locale), [locale]);
  const priceYTick = React.useCallback((v: number) => fmt2(v, locale), [locale]);
  const methaneYTick = co2YTick;
  const eurYTick = co2YTick;

  return (
    <section className="space-y-5 pt-2" aria-labelledby="results-charts-heading">
      <div className="space-y-2">
        <h3 id="results-charts-heading" className="text-base font-semibold tracking-tight text-foreground">
          {t("results.section.charts")}
        </h3>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{t("results.section.chartsLead")}</p>
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <ChartCard title={t("results.chart.co2Availability")} xAxisCaption={t("results.chart.axis.xDate")}>
          <ResponsiveContainer {...responsiveChartProps}>
            <LineChart data={co2Data} margin={chartMarginDefault}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="x"
                tickFormatter={tickFormatterX}
                tick={tickStyle}
                tickMargin={8}
                interval={30}
                height={36}
              />
              <YAxis
                tick={tickStyle}
                width={64}
                tickFormatter={co2YTick}
                label={{
                  value: co2YLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: axisLabelStyle,
                }}
              />
              <Tooltip
                formatter={tooltipFormatter}
                labelFormatter={(_label, payload) => {
                  const row = payload?.[0]?.payload as { label?: string } | undefined;
                  return row?.label ?? "";
                }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Line
                type="monotone"
                dataKey="y"
                name={t("results.chart.series.availableCo2Kg")}
                stroke="var(--chart-2)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("results.chart.electricityPrice")} xAxisCaption={t("results.chart.axis.xDate")}>
          <ResponsiveContainer {...responsiveChartProps}>
            <LineChart data={priceData} margin={chartMarginDefault}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="x"
                tickFormatter={tickFormatterX}
                tick={tickStyle}
                tickMargin={8}
                interval={30}
                height={36}
              />
              <YAxis
                tick={tickStyle}
                width={56}
                tickFormatter={priceYTick}
                label={{
                  value: t("results.chart.axis.yEurPerMwh"),
                  angle: -90,
                  position: "insideLeft",
                  style: axisLabelStyle,
                }}
              />
              <Tooltip
                formatter={tooltipFormatter}
                labelFormatter={(_label, payload) => {
                  const row = payload?.[0]?.payload as { label?: string } | undefined;
                  return row?.label ?? "";
                }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Line
                type="monotone"
                dataKey="y"
                name={t("results.chart.series.electricityPrice")}
                stroke="var(--chart-3)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("results.chart.methaneProduction")} xAxisCaption={t("results.chart.axis.xDate")}>
          <ResponsiveContainer {...responsiveChartProps}>
            <LineChart data={methaneData} margin={chartMarginDefault}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="x"
                tickFormatter={tickFormatterX}
                tick={tickStyle}
                tickMargin={8}
                interval={30}
                height={36}
              />
              <YAxis
                tick={tickStyle}
                width={64}
                tickFormatter={methaneYTick}
                label={{ value: methaneYLabel, angle: -90, position: "insideLeft", style: axisLabelStyle }}
              />
              <Tooltip
                formatter={tooltipFormatter}
                labelFormatter={(_label, payload) => {
                  const row = payload?.[0]?.payload as { label?: string } | undefined;
                  return row?.label ?? "";
                }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Line
                type="monotone"
                dataKey="y"
                name={t("results.chart.series.methaneProducedKg")}
                stroke="var(--chart-1)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("results.chart.costVsRevenueDaily")} xAxisCaption={`${t("results.chart.axis.xDate")} · ${eurUnitHint}`}>
          <ResponsiveContainer {...responsiveChartProps}>
            <LineChart data={costRevData} margin={chartMarginWithLegend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="x"
                tickFormatter={tickFormatterX}
                tick={tickStyle}
                tickMargin={8}
                interval={30}
                height={36}
              />
              <YAxis
                tick={tickStyle}
                width={68}
                tickFormatter={eurYTick}
                label={{ value: eurYLabel, angle: -90, position: "insideLeft", style: axisLabelStyle }}
              />
              <Tooltip
                formatter={tooltipFormatter}
                labelFormatter={(_label, payload) => {
                  const row = payload?.[0]?.payload as { label?: string } | undefined;
                  return row?.label ?? "";
                }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="cost"
                name={t("results.chart.series.totalCostEur")}
                stroke="var(--results-cost-revenue-cost)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="rev"
                name={t("results.chart.series.methaneRevenueEur")}
                stroke="var(--results-cost-revenue-revenue)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* WP28: monthly CO₂ source mix (free side stream vs purchased market CO₂) — only when purchase is non-zero. */}
        <Co2SourceMixBarChart result={result} locale={locale} t={t} />
      </div>
    </section>
  );
}

/**
 * WP28 stacked bar chart: per calendar month, breaks down total CO₂ used in the process
 * into free (biogenic side-stream) and purchased (market) components. Renders only when
 * the year has any purchased CO₂ — otherwise it would be a single-series chart that
 * duplicates the CO₂ availability line above.
 *
 * Aggregation source: `result.monthlySummary[*].sums.{freeCo2UsedKg, purchasedCo2Kg}`,
 * which the canonical aggregator sums from per-day rows. The chart performs no math.
 */
function Co2SourceMixBarChart({
  result,
  locale,
  t,
}: {
  result: CalculationResult;
  locale: Locale;
  t: TFn;
}) {
  const monthly = result.monthlySummary;
  const totalPurchased = result.annualSummary.annualPurchasedCo2Kg;
  if (!totalPurchased || totalPurchased <= 0) return null;

  // Pick a mass scale (kg / t / kt) based on the largest monthly stack so labels stay readable.
  const monthlyTotalsKg = monthly.map((m) => m.sums.freeCo2UsedKg + m.sums.purchasedCo2Kg);
  const maxAbsKg = maxAbsOf(monthlyTotalsKg);
  const yScale = pickMassPerDayYScaleFromMaxAbsKg(maxAbsKg);
  const yLabel =
    yScale.unitId === "kt"
      ? t("results.chart.axis.yKt")
      : yScale.unitId === "t"
        ? t("results.chart.axis.yT")
        : t("results.chart.axis.yKg");
  const yTick = (v: number): string => fmt2(v, locale);

  const data = monthly.map((m) => ({
    monthIndex: m.monthIndex,
    monthLabel: t(calendarMonthMessageId(m.monthIndex)),
    free: m.sums.freeCo2UsedKg / yScale.divisor,
    purchased: m.sums.purchasedCo2Kg / yScale.divisor,
  }));

  const co2MixTooltipFormatter: NonNullable<TooltipProps["formatter"]> = (value, name) => {
    const label = name == null ? "" : String(name);
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return [value === undefined ? "" : String(value), label];
    }
    return [`${fmt2(value, locale)} ${yScale.unitId}`, label];
  };

  return (
    <ChartCard
      title={t("results.chart.co2SourceMix")}
      xAxisCaption={t("results.chart.axis.month")}
    >
      <ResponsiveContainer {...responsiveChartProps}>
        <BarChart data={data} margin={chartMarginWithLegend}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="monthLabel"
            tick={tickStyle}
            tickMargin={8}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={56}
          />
          <YAxis
            tick={tickStyle}
            width={64}
            tickFormatter={yTick}
            label={{ value: yLabel, angle: -90, position: "insideLeft", style: axisLabelStyle }}
          />
          <Tooltip
            formatter={co2MixTooltipFormatter}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Bar
            dataKey="free"
            name={t("results.chart.series.freeCo2UsedKg")}
            stackId="co2"
            fill="var(--chart-2)"
            isAnimationActive={false}
          />
          <Bar
            dataKey="purchased"
            name={t("results.chart.series.purchasedCo2Kg")}
            stackId="co2"
            fill="var(--chart-3)"
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
