/** Presentation-only formatters for PDF text (en-GB; neutral technical report). */

export function formatPdfEur(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPdfNumber(value: number, maximumFractionDigits = 4): string {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits,
  }).format(value);
}

/**
 * Compact Y-axis tick labels (max 2 meaningful decimals, k/M suffix for large values).
 * Used by PDF line charts; does not change underlying series.
 */
export function formatPdfChartAxisTick(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const a = Math.abs(value);
  if (a >= 1_000_000) {
    const m = value / 1_000_000;
    return `${m.toFixed(2)}M`;
  }
  if (a >= 1_000) {
    const k = value / 1_000;
    return `${k.toFixed(2)}k`;
  }
  if (a >= 100) {
    return formatPdfNumber(value, 2);
  }
  if (a >= 1) {
    return formatPdfNumber(value, 2);
  }
  return formatPdfNumber(value, 2);
}

export function formatPdfPercentRatio(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function formatPdfMetricCell(value: number | null, unit: string): string {
  if (value === null) {
    return "—";
  }
  if (unit === "EUR" || unit === "EUR/t CH₄") {
    return formatPdfEur(value);
  }
  if (unit === "%") {
    return formatPdfPercentRatio(value);
  }
  return `${formatPdfNumber(value)} ${unit}`;
}
