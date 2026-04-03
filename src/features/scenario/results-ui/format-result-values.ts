import type { Locale } from "@/i18n/messages";

const localeTag: Record<Locale, string> = {
  en: "en-GB",
  fi: "fi-FI",
  sv: "sv-SE",
};

export function formatResultNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(localeTag[locale], {
    maximumFractionDigits: 4,
    ...options,
  }).format(value);
}

export function formatResultEur(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag[locale], {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatResultPercent(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag[locale], {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value / 100);
}

/** Tonnes from kilograms (presentation only). */
export function formatResultTonnesFromKg(kg: number, locale: Locale): string {
  return formatResultNumber(kg / 1000, locale, { maximumFractionDigits: 4 });
}
