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

/** Fixed chart height so ResponsiveContainer never depends on % height in a grid with indefinite width. */
const CHART_HEIGHT_PX = 240;

const responsiveChartProps = {
  width: "100%" as const,
  height: CHART_HEIGHT_PX,
  minHeight: CHART_HEIGHT_PX,
  minWidth: 0 as const,
  /** Avoid first-paint width/height -1 and console warning before ResizeObserver runs. */
  initialDimension: { width: 800, height: CHART_HEIGHT_PX },
};

/** Room for X-axis ticks + insideBottom axis label (was clipped at bottom: 0). */
const chartMarginDefault = { top: 4, right: 12, left: 0, bottom: 28 };
const chartMarginWithLegend = { top: 4, right: 12, left: 0, bottom: 36 };

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h4 className="text-sm font-semibold leading-snug text-foreground">{title}</h4>
      <div
        className="mt-4 w-full min-w-0"
        style={{ height: CHART_HEIGHT_PX, minHeight: CHART_HEIGHT_PX }}
      >
        {children}
      </div>
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
        <ChartCard title={t("results.chart.co2Availability")}>
          <ResponsiveContainer {...responsiveChartProps}>
            <LineChart data={co2Data} margin={chartMarginDefault}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="x"
                tickFormatter={tickFormatter}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                interval={30}
                label={{ value: t("results.chart.axis.dayOfYear"), position: "insideBottom", offset: 0, fontSize: 10 }}
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

        <ChartCard title={t("results.chart.electricityPrice")}>
          <ResponsiveContainer {...responsiveChartProps}>
            <LineChart data={priceData} margin={chartMarginDefault}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="x"
                tickFormatter={tickFormatter}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                interval={30}
                label={{ value: t("results.chart.axis.dayOfYear"), position: "insideBottom", offset: 0, fontSize: 10 }}
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

        <ChartCard title={t("results.chart.methaneProduction")}>
          <ResponsiveContainer {...responsiveChartProps}>
            <LineChart data={methaneData} margin={chartMarginDefault}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="x"
                tickFormatter={tickFormatter}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                interval={30}
                label={{ value: t("results.chart.axis.dayOfYear"), position: "insideBottom", offset: 0, fontSize: 10 }}
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

        <ChartCard title={t("results.chart.costVsRevenueDaily")}>
          <ResponsiveContainer {...responsiveChartProps}>
            <LineChart data={costRevData} margin={chartMarginWithLegend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="x"
                tickFormatter={tickFormatter}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                interval={30}
                label={{ value: t("results.chart.axis.dayOfYear"), position: "insideBottom", offset: 0, fontSize: 10 }}
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
