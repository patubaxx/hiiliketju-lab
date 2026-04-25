/**
 * Pure SVG path geometry for PDF line charts from canonical series points.
 * Only scales and positions existing values for display — no business recomputation.
 */

export type PdfPathPoint = { readonly x: number; readonly y: number };

/** Last day index for a 365-day MVP horizon (0-based). */
export const MVP_LAST_DAY_INDEX = 364;

export type PdfChartPlotRect = {
  readonly x0: number;
  readonly y0: number;
  readonly w: number;
  readonly h: number;
};

export type PdfDayValueChartLayout = {
  readonly svgWidth: number;
  readonly svgHeight: number;
  readonly plot: PdfChartPlotRect;
  readonly yAxisX: number;
  readonly xAxisY: number;
  readonly yTicks: readonly { readonly value: number; readonly y: number }[];
  readonly xTicks: readonly { readonly day: number; readonly x: number }[];
  readonly linePathD: string;
};

export type PdfCostRevenueChartLayout = {
  readonly svgWidth: number;
  readonly svgHeight: number;
  readonly plot: PdfChartPlotRect;
  readonly yAxisX: number;
  readonly xAxisY: number;
  readonly yTicks: readonly { readonly value: number; readonly y: number }[];
  readonly xTicks: readonly { readonly day: number; readonly x: number }[];
  readonly costPathD: string;
  readonly revenuePathD: string;
};

/** Inner margins inside the SVG for axes and tick labels (pt). Wider left for compact k/M tick labels. */
const PDF_CHART_MARGINS = {
  left: 52,
  right: 8,
  top: 10,
  bottom: 24,
} as const;

const Y_TICK_TARGET = 4;
const X_TICK_COUNT = 4;

function clampLastDayIndex(lastDayIndex: number): number {
  return Math.max(1, Math.floor(lastDayIndex));
}

function niceStep(roughStep: number): number {
  if (!Number.isFinite(roughStep) || roughStep <= 0) {
    return 1;
  }
  const exp = Math.floor(Math.log10(roughStep));
  const f = roughStep / 10 ** exp;
  let nf = 1;
  if (f <= 1) {
    nf = 1;
  } else if (f <= 2) {
    nf = 2;
  } else if (f <= 5) {
    nf = 5;
  } else {
    nf = 10;
  }
  return nf * 10 ** exp;
}

function expandEqualRange(v: number): { min: number; max: number } {
  const pad = Math.abs(v) * 0.05 || 1;
  return { min: v - pad, max: v + pad };
}

/**
 * Build axis tick values (~`maxTicks`) spanning a padded [dataMin, dataMax] with “nice” steps.
 */
export function pdfChartLinearYTicks(dataMin: number, dataMax: number, maxTicks: number): number[] {
  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) {
    return [0, 1];
  }
  let minV = dataMin;
  let maxV = dataMax;
  if (minV === maxV) {
    const e = expandEqualRange(minV);
    minV = e.min;
    maxV = e.max;
  }
  const span = maxV - minV;
  /** Extra headroom so lines are not drawn on the top/bottom border (WP26). */
  const pad = Math.max(span * 0.06, Math.abs(maxV) * 0.04, 1e-6);
  const lo = minV - pad;
  const hi = maxV + pad;
  const step = niceStep((hi - lo) / Math.max(1, maxTicks - 1));
  let v = Math.ceil((lo - step * 1e-9) / step) * step;
  const ticks: number[] = [];
  while (v <= hi + step * 1e-6 && ticks.length < maxTicks + 8) {
    ticks.push(v);
    v += step;
  }
  if (ticks.length < 2) {
    return [lo, hi];
  }
  if (ticks.length > maxTicks + 1) {
    const stride = Math.ceil(ticks.length / maxTicks);
    const thinned = ticks.filter((_, i) => i % stride === 0);
    if (thinned[thinned.length - 1] !== ticks[ticks.length - 1]) {
      thinned.push(ticks[ticks.length - 1]!);
    }
    return thinned;
  }
  return ticks;
}

function valueToPlotY(value: number, axisMin: number, axisMax: number, plot: PdfChartPlotRect): number {
  const span = axisMax - axisMin || 1;
  const y = plot.y0 + plot.h - ((value - axisMin) / span) * plot.h;
  return Math.min(Math.max(y, plot.y0), plot.y0 + plot.h);
}

function dayToPlotX(dayIndex: number, lastDayIndex: number, plot: PdfChartPlotRect): number {
  const d = clampLastDayIndex(lastDayIndex);
  return plot.x0 + (dayIndex / d) * plot.w;
}

/**
 * Map dayIndex 0..lastDayIndex and value to pixel coordinates inside [pad, width-pad] × [pad, height-pad].
 * Y axis is inverted (higher values toward top).
 */
export function projectDayValueSeries(
  series: readonly { dayIndex: number; value: number }[],
  width: number,
  height: number,
  pad = 6,
  lastDayIndex: number = MVP_LAST_DAY_INDEX,
): PdfPathPoint[] {
  if (series.length === 0) return [];
  const d = clampLastDayIndex(lastDayIndex);
  const values = series.map((s) => s.value);
  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const yRange = maxY - minY || 1;
  const innerW = width - 2 * pad;
  const innerH = height - 2 * pad;
  return series.map((s) => ({
    x: pad + (s.dayIndex / d) * innerW,
    y: pad + innerH - ((s.value - minY) / yRange) * innerH,
  }));
}

export function pathDFromPoints(pts: readonly PdfPathPoint[]): string {
  if (pts.length === 0) return "";
  return `M ${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")}`;
}

export function projectCostRevenueSeries(
  series: readonly { dayIndex: number; totalCostEur: number; methaneRevenueEur: number }[],
  width: number,
  height: number,
  pad = 6,
  lastDayIndex: number = MVP_LAST_DAY_INDEX,
): { cost: PdfPathPoint[]; revenue: PdfPathPoint[] } {
  if (series.length === 0) return { cost: [], revenue: [] };
  const d = clampLastDayIndex(lastDayIndex);
  const allY = series.flatMap((s) => [s.totalCostEur, s.methaneRevenueEur]);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const yRange = maxY - minY || 1;
  const innerW = width - 2 * pad;
  const innerH = height - 2 * pad;
  const toY = (v: number) => pad + innerH - ((v - minY) / yRange) * innerH;
  const cost = series.map((s) => ({
    x: pad + (s.dayIndex / d) * innerW,
    y: toY(s.totalCostEur),
  }));
  const revenue = series.map((s) => ({
    x: pad + (s.dayIndex / d) * innerW,
    y: toY(s.methaneRevenueEur),
  }));
  return { cost, revenue };
}

function xTickDays(lastDayIndex: number, count: number): number[] {
  const last = Math.max(0, Math.floor(lastDayIndex));
  if (last === 0) {
    return [0];
  }
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const day = Math.round((i / (count - 1)) * last);
    out.push(Math.min(last, day));
  }
  // de-dupe while preserving order
  const seen = new Set<number>();
  return out.filter((d) => {
    if (seen.has(d)) return false;
    seen.add(d);
    return true;
  });
}

/**
 * Layout for a single-value daily series: plot area, axis ticks, and line path (downsampled points unchanged).
 */
export function buildPdfDayValueChartLayout(
  series: readonly { dayIndex: number; value: number }[],
  svgWidth: number,
  svgHeight: number,
  lastDayIndex: number,
): PdfDayValueChartLayout {
  const plot: PdfChartPlotRect = {
    x0: PDF_CHART_MARGINS.left,
    y0: PDF_CHART_MARGINS.top,
    w: svgWidth - PDF_CHART_MARGINS.left - PDF_CHART_MARGINS.right,
    h: svgHeight - PDF_CHART_MARGINS.top - PDF_CHART_MARGINS.bottom,
  };
  const yAxisX = plot.x0;
  const xAxisY = plot.y0 + plot.h;
  const dLast = Math.max(0, Math.floor(lastDayIndex));

  if (series.length === 0) {
    return {
      svgWidth,
      svgHeight,
      plot,
      yAxisX,
      xAxisY,
      yTicks: [],
      xTicks: [],
      linePathD: "",
    };
  }

  const values = series.map((s) => s.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const yTickValues = pdfChartLinearYTicks(dataMin, dataMax, Y_TICK_TARGET);
  const axisMin = yTickValues[0]!;
  const axisMax = yTickValues[yTickValues.length - 1]!;

  const yTicks = yTickValues.map((value) => ({
    value,
    y: valueToPlotY(value, axisMin, axisMax, plot),
  }));

  const xTickDayList = xTickDays(dLast, X_TICK_COUNT);
  const xTicks = xTickDayList.map((day) => ({
    day,
    x: dayToPlotX(day, dLast, plot),
  }));

  const pts: PdfPathPoint[] = series.map((s) => {
    const x = dayToPlotX(s.dayIndex, dLast, plot);
    const y = valueToPlotY(s.value, axisMin, axisMax, plot);
    return { x, y };
  });

  return {
    svgWidth,
    svgHeight,
    plot,
    yAxisX,
    xAxisY,
    yTicks,
    xTicks,
    linePathD: pathDFromPoints(pts),
  };
}

/**
 * Layout for cost + methane revenue daily series (shared Y scale).
 */
export function buildPdfCostRevenueChartLayout(
  series: readonly { dayIndex: number; totalCostEur: number; methaneRevenueEur: number }[],
  svgWidth: number,
  svgHeight: number,
  lastDayIndex: number,
): PdfCostRevenueChartLayout {
  const plot: PdfChartPlotRect = {
    x0: PDF_CHART_MARGINS.left,
    y0: PDF_CHART_MARGINS.top,
    w: svgWidth - PDF_CHART_MARGINS.left - PDF_CHART_MARGINS.right,
    h: svgHeight - PDF_CHART_MARGINS.top - PDF_CHART_MARGINS.bottom,
  };
  const yAxisX = plot.x0;
  const xAxisY = plot.y0 + plot.h;
  const dLast = Math.max(0, Math.floor(lastDayIndex));

  if (series.length === 0) {
    return {
      svgWidth,
      svgHeight,
      plot,
      yAxisX,
      xAxisY,
      yTicks: [],
      xTicks: [],
      costPathD: "",
      revenuePathD: "",
    };
  }

  const allY = series.flatMap((s) => [s.totalCostEur, s.methaneRevenueEur]);
  const dataMin = Math.min(...allY);
  const dataMax = Math.max(...allY);
  const yTickValues = pdfChartLinearYTicks(dataMin, dataMax, Y_TICK_TARGET);
  const axisMin = yTickValues[0]!;
  const axisMax = yTickValues[yTickValues.length - 1]!;

  const yTicks = yTickValues.map((value) => ({
    value,
    y: valueToPlotY(value, axisMin, axisMax, plot),
  }));

  const xTickDayList = xTickDays(dLast, X_TICK_COUNT);
  const xTicks = xTickDayList.map((day) => ({
    day,
    x: dayToPlotX(day, dLast, plot),
  }));

  const costPts: PdfPathPoint[] = series.map((s) => {
    const x = dayToPlotX(s.dayIndex, dLast, plot);
    const y = valueToPlotY(s.totalCostEur, axisMin, axisMax, plot);
    return { x, y };
  });
  const revenuePts: PdfPathPoint[] = series.map((s) => {
    const x = dayToPlotX(s.dayIndex, dLast, plot);
    const y = valueToPlotY(s.methaneRevenueEur, axisMin, axisMax, plot);
    return { x, y };
  });

  return {
    svgWidth,
    svgHeight,
    plot,
    yAxisX,
    xAxisY,
    yTicks,
    xTicks,
    costPathD: pathDFromPoints(costPts),
    revenuePathD: pathDFromPoints(revenuePts),
  };
}
