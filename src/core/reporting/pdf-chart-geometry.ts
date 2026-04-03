/**
 * Pure SVG path geometry for PDF line charts from canonical series points.
 * Only scales and positions existing values for display — no business recomputation.
 */

export type PdfPathPoint = { readonly x: number; readonly y: number };

const MVP_LAST_DAY = 364;

/**
 * Map dayIndex 0..364 and value to pixel coordinates inside [pad, width-pad] × [pad, height-pad].
 * Y axis is inverted (higher values toward top).
 */
export function projectDayValueSeries(
  series: readonly { dayIndex: number; value: number }[],
  width: number,
  height: number,
  pad = 6,
): PdfPathPoint[] {
  if (series.length === 0) return [];
  const values = series.map((s) => s.value);
  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const yRange = maxY - minY || 1;
  const innerW = width - 2 * pad;
  const innerH = height - 2 * pad;
  return series.map((s) => ({
    x: pad + (s.dayIndex / MVP_LAST_DAY) * innerW,
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
): { cost: PdfPathPoint[]; revenue: PdfPathPoint[] } {
  if (series.length === 0) return { cost: [], revenue: [] };
  const allY = series.flatMap((s) => [s.totalCostEur, s.methaneRevenueEur]);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const yRange = maxY - minY || 1;
  const innerW = width - 2 * pad;
  const innerH = height - 2 * pad;
  const toY = (v: number) => pad + innerH - ((v - minY) / yRange) * innerH;
  const cost = series.map((s) => ({
    x: pad + (s.dayIndex / MVP_LAST_DAY) * innerW,
    y: toY(s.totalCostEur),
  }));
  const revenue = series.map((s) => ({
    x: pad + (s.dayIndex / MVP_LAST_DAY) * innerW,
    y: toY(s.methaneRevenueEur),
  }));
  return { cost, revenue };
}
