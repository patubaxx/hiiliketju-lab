import {
  DISPLAY_VALUE_NA,
  formatDisplayNumber,
  formatDisplayPercent,
  formatScaledCurrencyEur,
  formatScaledEnergyMWh,
  formatScaledMassKg,
} from "@/core/presentation/format-scaled-number";
import type { Locale } from "@/i18n/messages";

const localeTag: Record<Locale, string> = {
  en: "en-GB",
  fi: "fi-FI",
  sv: "sv-SE",
};

type TUnit = (id: string) => string;

const DISPLAY_MD = 2;

/** Legacy: prefer `formatResultNumberDisplay` for 2-decimal table rows. */
export function formatResultNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(localeTag[locale], {
    ...options,
    maximumFractionDigits: options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : DISPLAY_MD,
  }).format(value);
}

export function formatResultNumberDisplay(value: number, locale: Locale, maxFractionDigits: number = DISPLAY_MD): string {
  if (!Number.isFinite(value)) {
    return DISPLAY_VALUE_NA;
  }
  return formatDisplayNumber(value, { maxDecimals: maxFractionDigits, locale: localeTag[locale] });
}

export function formatResultEur(value: number, locale: Locale): string {
  if (!Number.isFinite(value)) {
    return DISPLAY_VALUE_NA;
  }
  return new Intl.NumberFormat(localeTag[locale], {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: DISPLAY_MD,
  }).format(value);
}

/**
 * kEUR / MEUR for large absolute amounts, plain EUR for small (WP26 presentation).
 */
export function formatResultEurCompact(value: number, locale: Locale, t: TUnit): string {
  if (!Number.isFinite(value)) {
    return t("results.value.na");
  }
  const s = formatScaledCurrencyEur(value, { maxDecimals: DISPLAY_MD });
  if (s.unit === "EUR") {
    return formatResultEur(value, locale);
  }
  const u = t(`results.displayUnit.${s.unit}`);
  return `${s.formatted} ${u}`;
}

export function formatResultPercent(value: number, locale: Locale): string {
  if (!Number.isFinite(value)) {
    return DISPLAY_VALUE_NA;
  }
  return formatDisplayPercent(value, { maxDecimals: DISPLAY_MD, locale: localeTag[locale] });
}

/** Mass (kg) with kg / t / kt scaling for large values. */
export function formatResultMassKgCompact(value: number, locale: Locale, t: TUnit): string {
  if (!Number.isFinite(value)) {
    return t("results.value.na");
  }
  const s = formatScaledMassKg(value, { maxDecimals: DISPLAY_MD });
  const u = t(`results.displayUnit.${s.unit}`);
  return `${s.formatted} ${u}`;
}

export function formatResultEnergyMwhCompact(value: number, locale: Locale, t: TUnit): string {
  if (!Number.isFinite(value)) {
    return t("results.value.na");
  }
  const s = formatScaledEnergyMWh(value, { maxDecimals: DISPLAY_MD });
  const u = t(`results.displayUnit.${s.unit}`);
  return `${s.formatted} ${u}`;
}

/** Tonnes from kilograms (max 2 decimals, compact t/kt for large). */
export function formatResultTonnesFromKg(kg: number, locale: Locale, t: TUnit): string {
  if (!Number.isFinite(kg)) {
    return t("results.value.na");
  }
  return formatResultMassKgCompact(kg, locale, t);
}
