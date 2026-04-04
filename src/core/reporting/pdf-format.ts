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

/** Compact tick labels for small PDF chart axes (reporting layer only). */
export function formatPdfChartAxisTick(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const a = Math.abs(value);
  if (a >= 1_000_000) {
    const m = value / 1_000_000;
    return Number.isInteger(m) ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (a >= 100_000) {
    return `${Math.round(value / 1_000)}k`;
  }
  if (a >= 10_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  if (a >= 1000) {
    return formatPdfNumber(value, 0);
  }
  if (a >= 100) {
    return formatPdfNumber(value, 1);
  }
  if (a >= 1) {
    return formatPdfNumber(value, 2);
  }
  return formatPdfNumber(value, 3);
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
