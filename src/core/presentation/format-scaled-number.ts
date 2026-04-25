/**
 * Locale-neutral presentation formatters: scale and round values for display only.
 * Do not use in the calculation engine.
 */

export const DISPLAY_VALUE_NA = "—";

export type ScaledDisplayNumber = {
  /** Value expressed in the returned `unit` (e.g. 1.25 MEUR → value 1.25, unit "MEUR") */
  readonly value: number;
  /** Machine-readable unit id for mapping to i18n in UI */
  readonly unit: "EUR" | "kEUR" | "MEUR" | "kg" | "t" | "kt" | "MWh" | "GWh" | "one";
  /** Numeric part, max 2 decimal places, suitable for appending a translated unit */
  readonly formatted: string;
};

const MD = 2;

function fin(n: number, maxDecimals: number): string {
  if (!Number.isFinite(n)) {
    return DISPLAY_VALUE_NA;
  }
  return n.toFixed(maxDecimals);
}

export function formatDisplayNumber(
  value: number,
  options?: { maxDecimals?: number; locale?: string },
): string {
  if (!Number.isFinite(value)) {
    return DISPLAY_VALUE_NA;
  }
  const md = options?.maxDecimals ?? MD;
  return new Intl.NumberFormat(options?.locale ?? "en-GB", {
    maximumFractionDigits: md,
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Scales large EUR amounts to kEUR (≥1 000) or MEUR (≥1 000 000).
 */
export function formatScaledCurrencyEur(
  valueEur: number,
  options?: { maxDecimals?: number },
): ScaledDisplayNumber {
  const maxD = options?.maxDecimals ?? MD;
  if (!Number.isFinite(valueEur)) {
    return { value: 0, unit: "EUR", formatted: DISPLAY_VALUE_NA };
  }
  const a = Math.abs(valueEur);
  if (a < 1_000) {
    return { value: valueEur, unit: "EUR", formatted: fin(valueEur, maxD) };
  }
  if (a < 1_000_000) {
    const v = valueEur / 1_000;
    return { value: v, unit: "kEUR", formatted: fin(v, maxD) };
  }
  const v = valueEur / 1_000_000;
  return { value: v, unit: "MEUR", formatted: fin(v, maxD) };
}

/**
 * Scales mass in kg: kg, t (≥1 000 kg), or kt (≥1 000 000 kg).
 */
export function formatScaledMassKg(
  valueKg: number,
  options?: { maxDecimals?: number },
): ScaledDisplayNumber {
  const maxD = options?.maxDecimals ?? MD;
  if (!Number.isFinite(valueKg)) {
    return { value: 0, unit: "kg", formatted: DISPLAY_VALUE_NA };
  }
  const a = Math.abs(valueKg);
  if (a < 1_000) {
    return { value: valueKg, unit: "kg", formatted: fin(valueKg, maxD) };
  }
  if (a < 1_000_000) {
    const v = valueKg / 1_000;
    return { value: v, unit: "t", formatted: fin(v, maxD) };
  }
  const v = valueKg / 1_000_000;
  return { value: v, unit: "kt", formatted: fin(v, maxD) };
}

/**
 * Scales energy in MWh: MWh, or GWh (≥1 000 MWh).
 */
export function formatScaledEnergyMWh(
  valueMWh: number,
  options?: { maxDecimals?: number },
): ScaledDisplayNumber {
  const maxD = options?.maxDecimals ?? MD;
  if (!Number.isFinite(valueMWh)) {
    return { value: 0, unit: "MWh", formatted: DISPLAY_VALUE_NA };
  }
  const a = Math.abs(valueMWh);
  if (a < 1_000) {
    return { value: valueMWh, unit: "MWh", formatted: fin(valueMWh, maxD) };
  }
  const v = valueMWh / 1_000;
  return { value: v, unit: "GWh", formatted: fin(v, maxD) };
}

export function formatDisplayPercent(
  valuePct: number,
  options?: { maxDecimals?: number; locale?: string },
): string {
  if (!Number.isFinite(valuePct)) {
    return DISPLAY_VALUE_NA;
  }
  const md = options?.maxDecimals ?? MD;
  return new Intl.NumberFormat(options?.locale ?? "en-GB", {
    style: "percent",
    maximumFractionDigits: md,
  }).format(valuePct / 100);
}
