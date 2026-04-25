import { Document, G, Line, Page, Path, StyleSheet, Svg, Text, Tspan, View } from "@react-pdf/renderer";

import type { PdfReportModel } from "./build-pdf-report-model";
import { buildPdfCostRevenueChartLayout, buildPdfDayValueChartLayout } from "./pdf-chart-geometry";
import { formatPdfChartAxisTick, formatPdfEur, formatPdfMetricCell, formatPdfNumber } from "./pdf-format";

const CHART_W = 230;
/** SVG height includes space for X tick labels below the plot. */
const CHART_H = 106;

const PDF_DAILY_APPENDIX_NOTE =
  "Full daily results (365 rows per metric) and the complete input snapshot are available in the Excel export for this scenario.";

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },
  brandTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#111827",
  },
  subtitle: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 6,
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 3,
  },
  kvRow: { flexDirection: "row", marginBottom: 3 },
  kvKey: { width: "38%", color: "#4b5563" },
  kvVal: { width: "62%", fontFamily: "Helvetica" },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    paddingBottom: 4,
    marginTop: 4,
  },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#374151" },
  row: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  cellLabel: { width: "58%", fontSize: 8.5 },
  cellValue: { width: "42%", fontSize: 8.5, textAlign: "right" },
  assumptionBlock: {
    marginBottom: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 2,
  },
  assumptionLiterature: {
    borderLeftWidth: 3,
    borderLeftColor: "#d97706",
    backgroundColor: "#fffbeb",
  },
  assumptionBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#b45309",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  assumptionValue: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  metaLine: { fontSize: 7.5, color: "#4b5563", marginBottom: 2 },
  warningLine: {
    fontSize: 8.5,
    marginBottom: 6,
    paddingLeft: 6,
    borderLeftWidth: 2,
    borderLeftColor: "#9ca3af",
  },
  chartGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  chartBox: { width: CHART_W, marginBottom: 10, marginRight: 12 },
  chartTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 4, color: "#374151" },
  chartCaption: { fontSize: 7, color: "#6b7280", marginTop: 2 },
  footNote: { fontSize: 8, color: "#6b7280", marginTop: 14, fontStyle: "italic" },
  monthlyTh: { fontFamily: "Helvetica-Bold", fontSize: 7, color: "#374151" },
  monthlyCell: { fontSize: 7, textAlign: "right" },
  monthlyCellFirst: { fontSize: 7, textAlign: "left" },
});

const PDF_CHART_AXIS_STROKE = "#9ca3af";
const PDF_CHART_GRID_STROKE = "#e5e7eb";
const PDF_CHART_TICK_STYLE = { fontSize: 5.8, fill: "#6b7280", fontFamily: "Helvetica" } as const;
const PDF_CHART_X_LABEL_STYLE = { fontSize: 5.8, fill: "#6b7280", fontFamily: "Helvetica" } as const;

function PdfDayValueLineChart({
  series,
  width,
  height,
  lastDayIndex,
  stroke,
}: {
  readonly series: readonly { dayIndex: number; value: number }[];
  readonly width: number;
  readonly height: number;
  readonly lastDayIndex: number;
  readonly stroke: string;
}) {
  const layout = buildPdfDayValueChartLayout(series, width, height, lastDayIndex);
  const { plot, yAxisX, xAxisY, yTicks, xTicks, linePathD } = layout;
  if (!linePathD) {
    return <Text style={{ fontSize: 7, color: "#9ca3af" }}>No data</Text>;
  }
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <G>
        {yTicks.map((yt) => (
          <Line
            key={`gy-${yt.value}`}
            x1={plot.x0}
            y1={yt.y}
            x2={plot.x0 + plot.w}
            y2={yt.y}
            stroke={PDF_CHART_GRID_STROKE}
            strokeWidth={0.35}
          />
        ))}
        {xTicks.map((xt) => (
          <Line
            key={`gx-${xt.day}`}
            x1={xt.x}
            y1={plot.y0}
            x2={xt.x}
            y2={xAxisY}
            stroke={PDF_CHART_GRID_STROKE}
            strokeWidth={0.35}
          />
        ))}
      </G>
      <Path d={linePathD} stroke={stroke} strokeWidth={1.2} fill="none" />
      <Line x1={yAxisX} y1={plot.y0} x2={yAxisX} y2={xAxisY} stroke={PDF_CHART_AXIS_STROKE} strokeWidth={0.75} />
      <Line x1={plot.x0} y1={xAxisY} x2={plot.x0 + plot.w} y2={xAxisY} stroke={PDF_CHART_AXIS_STROKE} strokeWidth={0.75} />
      {yTicks.map((yt) => (
        <Text
          key={`yl-${yt.value}`}
          x={yAxisX - 3}
          y={yt.y}
          style={PDF_CHART_TICK_STYLE}
        >
          <Tspan textAnchor="end" dominantBaseline="middle">
            {formatPdfChartAxisTick(yt.value)}
          </Tspan>
        </Text>
      ))}
      {xTicks.map((xt) => (
        <Text key={`xl-${xt.day}`} x={xt.x} y={xAxisY + 11} style={PDF_CHART_X_LABEL_STYLE}>
          <Tspan textAnchor="middle" dominantBaseline="middle">
            {String(xt.day)}
          </Tspan>
        </Text>
      ))}
    </Svg>
  );
}

function PdfCostRevenueLineChart({
  series,
  width,
  height,
  lastDayIndex,
}: {
  readonly series: readonly { dayIndex: number; totalCostEur: number; methaneRevenueEur: number }[];
  readonly width: number;
  readonly height: number;
  readonly lastDayIndex: number;
}) {
  const layout = buildPdfCostRevenueChartLayout(series, width, height, lastDayIndex);
  const { plot, yAxisX, xAxisY, yTicks, xTicks, costPathD, revenuePathD } = layout;
  if (!costPathD && !revenuePathD) {
    return <Text style={{ fontSize: 7, color: "#9ca3af" }}>No data</Text>;
  }
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <G>
        {yTicks.map((yt) => (
          <Line
            key={`gy-${yt.value}`}
            x1={plot.x0}
            y1={yt.y}
            x2={plot.x0 + plot.w}
            y2={yt.y}
            stroke={PDF_CHART_GRID_STROKE}
            strokeWidth={0.35}
          />
        ))}
        {xTicks.map((xt) => (
          <Line
            key={`gx-${xt.day}`}
            x1={xt.x}
            y1={plot.y0}
            x2={xt.x}
            y2={xAxisY}
            stroke={PDF_CHART_GRID_STROKE}
            strokeWidth={0.35}
          />
        ))}
      </G>
      {costPathD ? <Path d={costPathD} stroke="#b91c1c" strokeWidth={1.2} fill="none" /> : null}
      {revenuePathD ? <Path d={revenuePathD} stroke="#15803d" strokeWidth={1.2} fill="none" /> : null}
      <Line x1={yAxisX} y1={plot.y0} x2={yAxisX} y2={xAxisY} stroke={PDF_CHART_AXIS_STROKE} strokeWidth={0.75} />
      <Line x1={plot.x0} y1={xAxisY} x2={plot.x0 + plot.w} y2={xAxisY} stroke={PDF_CHART_AXIS_STROKE} strokeWidth={0.75} />
      {yTicks.map((yt) => (
        <Text
          key={`yl-${yt.value}`}
          x={yAxisX - 3}
          y={yt.y}
          style={PDF_CHART_TICK_STYLE}
        >
          <Tspan textAnchor="end" dominantBaseline="middle">
            {formatPdfChartAxisTick(yt.value)}
          </Tspan>
        </Text>
      ))}
      {xTicks.map((xt) => (
        <Text key={`xl-${xt.day}`} x={xt.x} y={xAxisY + 11} style={PDF_CHART_X_LABEL_STYLE}>
          <Tspan textAnchor="middle" dominantBaseline="middle">
            {String(xt.day)}
          </Tspan>
        </Text>
      ))}
    </Svg>
  );
}

export function ScenarioPdfDocument({ model }: { readonly model: PdfReportModel }) {
  const { overview, excelModel, charts } = model;
  const genDate = model.generatedAtIso.slice(0, 19).replace("T", " ") + " UTC";
  const lastDayIndex = Math.max(0, overview.periodDays - 1);

  return (
    <Document title={`Hiiliketju — ${overview.scenarioName}`} author="Hiiliketju" subject="Scenario report">
      <Page size="A4" style={styles.page}>
        <Text style={styles.brandTitle}>Hiiliketju scenario report</Text>
        <Text style={styles.subtitle}>Single-scenario technical summary (read-only, from calculation engine output)</Text>

        <Text style={styles.sectionTitle}>Scenario overview</Text>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>Scenario name</Text>
          <Text style={styles.kvVal}>{overview.scenarioName}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>Analysis period (days)</Text>
          <Text style={styles.kvVal}>{String(overview.periodDays)}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>Assumptions version</Text>
          <Text style={styles.kvVal}>{overview.assumptionsVersion}</Text>
        </View>
        {overview.scenarioNotes ? (
          <View style={{ marginTop: 6 }}>
            <Text style={{ fontSize: 8, color: "#4b5563", marginBottom: 2 }}>Scenario notes</Text>
            <Text style={{ fontSize: 8.5 }}>{overview.scenarioNotes}</Text>
          </View>
        ) : null}
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>Report generated</Text>
          <Text style={styles.kvVal}>{genDate}</Text>
        </View>

        <Text style={styles.sectionTitle}>Path comparison (annual)</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { width: "62%" }]}>Description</Text>
          <Text style={[styles.th, { width: "38%", textAlign: "right" }]}>EUR</Text>
        </View>
        {excelModel.comparison.map((c, idx) => (
          <View style={styles.row} key={`cmp-${idx}`}>
            <Text style={styles.cellLabel}>{c.label}</Text>
            <Text style={styles.cellValue}>{formatPdfEur(c.valueEur)}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Annual summary</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { width: "58%" }]}>Metric</Text>
          <Text style={[styles.th, { width: "42%", textAlign: "right" }]}>Value</Text>
        </View>
        {excelModel.annualMetrics.map((m) => (
          <View style={styles.row} key={m.metricKey} wrap={false}>
            <Text style={styles.cellLabel}>{m.label}</Text>
            <Text style={styles.cellValue}>{formatPdfMetricCell(m.value, m.unit)}</Text>
          </View>
        ))}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Process assumptions</Text>
        {excelModel.processAssumptions.map((a) => {
          const lit = a.assumptionSource === "literature_based";
          return (
            <View
              key={a.fieldKey}
              style={[styles.assumptionBlock, lit ? styles.assumptionLiterature : {}]}
              wrap={false}
            >
              {lit ? <Text style={styles.assumptionBadge}>Literature-based</Text> : null}
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 }}>{a.fieldLabel}</Text>
              <Text style={styles.assumptionValue}>
                {formatPdfNumber(a.value, 6)} {a.unit}
              </Text>
              <Text style={styles.metaLine}>assumptionSource: {a.assumptionSource}</Text>
              <Text style={styles.metaLine}>assumptionStatus: {a.assumptionStatus}</Text>
              {a.assumptionNote ? <Text style={{ fontSize: 7.5, color: "#374151", marginTop: 2 }}>{a.assumptionNote}</Text> : null}
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>Engine warnings</Text>
        <Text style={{ fontSize: 8, color: "#6b7280", marginBottom: 6 }}>
          Raw strings from the calculation engine (opaque; not classified or rewritten).
        </Text>
        {excelModel.warnings.length === 0 ? (
          <Text style={{ fontSize: 9 }}>None.</Text>
        ) : (
          excelModel.warnings.map((w, i) => (
            <Text key={i} style={styles.warningLine}>
              {w}
            </Text>
          ))
        )}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Resolved daily series (downsampled charts)</Text>
        <Text style={{ fontSize: 8, color: "#6b7280", marginBottom: 8 }}>
          Charts use a downsampled subset of canonical daily points for readability. Values are not recomputed.
        </Text>
        <View style={styles.chartGrid}>
          <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>CO₂ available (kg/day)</Text>
            <PdfDayValueLineChart
              series={charts.co2KgPerDay}
              width={CHART_W}
              height={CHART_H}
              lastDayIndex={lastDayIndex}
              stroke="#2563eb"
            />
            <Text style={styles.chartCaption}>Y: kg/day · X: day index (0 = first day)</Text>
          </View>
          <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>Electricity purchase price (EUR/MWh)</Text>
            <PdfDayValueLineChart
              series={charts.priceEurPerMwh}
              width={CHART_W}
              height={CHART_H}
              lastDayIndex={lastDayIndex}
              stroke="#7c3aed"
            />
            <Text style={styles.chartCaption}>Y: EUR/MWh · X: day index (0 = first day)</Text>
          </View>
          <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>Methane produced (kg/day)</Text>
            <PdfDayValueLineChart
              series={charts.methaneKgPerDay}
              width={CHART_W}
              height={CHART_H}
              lastDayIndex={lastDayIndex}
              stroke="#059669"
            />
            <Text style={styles.chartCaption}>Y: kg/day · X: day index (0 = first day)</Text>
          </View>
          <View style={styles.chartBox}>
            <Text style={styles.chartTitle}>Daily total cost vs methane revenue (EUR/day)</Text>
            <PdfCostRevenueLineChart series={charts.costRevenue} width={CHART_W} height={CHART_H} lastDayIndex={lastDayIndex} />
            <Text style={styles.chartCaption}>Y: EUR/day · Red: total cost · Green: methane revenue</Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Monthly summary</Text>
        <View style={[styles.tableHeader, { marginTop: 4 }]}>
          <Text style={[styles.monthlyTh, { width: "10%" }]}>Mo</Text>
          <Text style={[styles.monthlyTh, { width: "18%", textAlign: "right" }]}>CH₄ (kg)</Text>
          <Text style={[styles.monthlyTh, { width: "18%", textAlign: "right" }]}>Elec (MWh)</Text>
          <Text style={[styles.monthlyTh, { width: "18%", textAlign: "right" }]}>Cost (EUR)</Text>
          <Text style={[styles.monthlyTh, { width: "18%", textAlign: "right" }]}>CH₄ rev (EUR)</Text>
          <Text style={[styles.monthlyTh, { width: "18%", textAlign: "right" }]}>H₂ alt (EUR)</Text>
        </View>
        {excelModel.monthlyRows.map((m) => (
          <View style={styles.row} key={m.monthIndex} wrap={false}>
            <Text style={[styles.monthlyCellFirst, { width: "10%" }]}>{m.monthIndex + 1}</Text>
            <Text style={[styles.monthlyCell, { width: "18%" }]}>{formatPdfNumber(m.methaneProducedKg, 2)}</Text>
            <Text style={[styles.monthlyCell, { width: "18%" }]}>{formatPdfNumber(m.electricityConsumedMwh, 3)}</Text>
            <Text style={[styles.monthlyCell, { width: "18%" }]}>{formatPdfEur(m.totalCostEur)}</Text>
            <Text style={[styles.monthlyCell, { width: "18%" }]}>{formatPdfEur(m.methaneRevenueEur)}</Text>
            <Text style={[styles.monthlyCell, { width: "18%" }]}>{formatPdfEur(m.hydrogenAlternativeRevenueEur)}</Text>
          </View>
        ))}

        <Text style={styles.footNote}>{PDF_DAILY_APPENDIX_NOTE}</Text>
      </Page>
    </Document>
  );
}
