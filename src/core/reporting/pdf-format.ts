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
