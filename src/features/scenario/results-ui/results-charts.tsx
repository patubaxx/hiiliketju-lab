"use client";

import * as React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CalculationResult } from "@/core/domain/result";

type TFn = (id: string, vars?: Record<string, string>) => string;

/** Fixed SVG height; X-axis title is rendered below the chart (HTML) to avoid tick/label overlap inside Recharts. */
const CHART_CONTAINER_HEIGHT_PX = 300;

const responsiveChartProps = {
  width: "100%" as const,
  height: CHART_CONTAINER_HEIGHT_PX,
  minHeight: CHART_CONTAINER_HEIGHT_PX,
  minWidth: 0 as const,
  /** Avoid first-paint width/height -1 and console warning before ResizeObserver runs. */
  initialDimension: { width: 800, height: CHART_CONTAINER_HEIGHT_PX },
};

const chartMarginDefault = { top: 8, right: 12, left: 4, bottom: 36 };
const chartMarginWithLegend = { top: 8, right: 12, left: 4, bottom: 52 };

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
    <div className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-sm">
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

export function ResultsCharts({ result, t }: { result: CalculationResult; t: TFn }) {
  const co2Data = React.useMemo(
    () =>
      result.resolvedDailyCo2.map((p) => ({
        x: p.dayIndex,
        label: p.dateLabel,
        availableCO2Kg: p.availableCO2Kg,
      })),
    [result.resolvedDailyCo2],
  );

  const priceData = React.useMemo(
    () =>
      result.resolvedDailyElectricityPrice.map((p) => ({
        x: p.dayIndex,
        label: p.dateLabel,
        priceEurPerMwh: p.electricityPriceEurPerMWh,
      })),
    [result.resolvedDailyElectricityPrice],
  );

  const methaneData = React.useMemo(
    () =>
      result.dailyResults.map((row) => ({
        x: row.dayIndex,
        label: row.dateLabel,
        methaneProducedKg: row.methaneProducedKg,
      })),
    [result.dailyResults],
  );

  const costRevData = React.useMemo(
    () =>
      result.dailyResults.map((row) => ({
        x: row.dayIndex,
        label: row.dateLabel,
        totalCostEur: row.totalCostEur,
        methaneRevenueEur: row.methaneRevenueEur,
      })),
    [result.dailyResults],
  );

  const tickFormatter = React.useCallback((v: number) => String(v), []);

  return (
    <section className="space-y-5 border-t border-border/70 pt-10" aria-labelledby="results-charts-heading">
      <div className="space-y-2">
        <h3 id="results-charts-heading" className="text-base font-semibold tracking-tight text-foreground">
          {t("results.section.charts")}
        </h3>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{t("results.section.chartsLead")}</p>
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <ChartCard title={t("results.chart.co2Availability")} xAxisCaption={t("results.chart.axis.dayOfYear")}>
          <ResponsiveContainer {...responsiveChartProps}>
            <LineChart data={co2Data} margin={chartMarginDefault}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="x"
                tickFormatter={tickFormatter}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickMargin={6}
                interval={30}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                width={52}
                tickFormatter={(v) => (typeof v === "number" ? v.toExponential(0) : String(v))}
              />
              <Tooltip
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { label?: string } | undefined;
                  return row?.label ?? "";
                }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="availableCO2Kg"
                name={t("results.chart.series.availableCo2Kg")}
                stroke="var(--chart-2)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("results.chart.electricityPrice")} xAxisCaption={t("results.chart.axis.dayOfYear")}>
          <ResponsiveContainer {...responsiveChartProps}>
            <LineChart data={priceData} margin={chartMarginDefault}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="x"
                tickFormatter={tickFormatter}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickMargin={6}
                interval={30}
              />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={44} />
              <Tooltip
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { label?: string } | undefined;
                  return row?.label ?? "";
                }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="priceEurPerMwh"
                name={t("results.chart.series.electricityPrice")}
                stroke="var(--chart-3)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("results.chart.methaneProduction")} xAxisCaption={t("results.chart.axis.dayOfYear")}>
          <ResponsiveContainer {...responsiveChartProps}>
            <LineChart data={methaneData} margin={chartMarginDefault}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="x"
                tickFormatter={tickFormatter}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickMargin={6}
                interval={30}
              />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={44} />
              <Tooltip
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { label?: string } | undefined;
                  return row?.label ?? "";
                }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="methaneProducedKg"
                name={t("results.chart.series.methaneProducedKg")}
                stroke="var(--chart-1)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("results.chart.costVsRevenueDaily")} xAxisCaption={t("results.chart.axis.dayOfYear")}>
          <ResponsiveContainer {...responsiveChartProps}>
            <LineChart data={costRevData} margin={chartMarginWithLegend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="x"
                tickFormatter={tickFormatter}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickMargin={6}
                interval={30}
              />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={44} />
              <Tooltip
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { label?: string } | undefined;
                  return row?.label ?? "";
                }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line
                type="monotone"
                dataKey="totalCostEur"
                name={t("results.chart.series.totalCostEur")}
                stroke="var(--chart-4)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="methaneRevenueEur"
                name={t("results.chart.series.methaneRevenueEur")}
                stroke="var(--chart-5)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}
