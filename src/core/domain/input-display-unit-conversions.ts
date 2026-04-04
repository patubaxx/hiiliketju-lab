/**
 * Pure conversions between form display units and canonical wire units for scenario inputs.
 * Wire: annual CO₂ as kt/year; constant electricity purchase price as EUR/MWh.
 */

export const ANNUAL_CO2_DISPLAY_UNITS = ["kt_per_year", "kg_per_year"] as const;
export type AnnualCo2InputDisplayUnit = (typeof ANNUAL_CO2_DISPLAY_UNITS)[number];

export const ELECTRICITY_PRICE_DISPLAY_UNITS = ["eur_per_mwh", "c_per_kwh"] as const;
export type ElectricityPriceInputDisplayUnit = (typeof ELECTRICITY_PRICE_DISPLAY_UNITS)[number];

/** Display value → canonical kt/year. */
export function annualCo2InputToKtPerYear(value: number, unit: AnnualCo2InputDisplayUnit): number {
  return unit === "kt_per_year" ? value : value / 1_000_000;
}

/** Canonical kt/year → display value for the selected unit. */
export function annualCo2KtPerYearToInputDisplay(valueKt: number, unit: AnnualCo2InputDisplayUnit): number {
  return unit === "kt_per_year" ? valueKt : valueKt * 1_000_000;
}

/** Display value → canonical EUR/MWh (c = euro-cent per kWh). */
export function electricityPriceInputToEurPerMwh(
  value: number,
  unit: ElectricityPriceInputDisplayUnit,
): number {
  return unit === "eur_per_mwh" ? value : value * 10;
}

/** Canonical EUR/MWh → display value for the selected unit. */
export function electricityPriceEurPerMwhToInputDisplay(
  valueEurPerMwh: number,
  unit: ElectricityPriceInputDisplayUnit,
): number {
  return unit === "eur_per_mwh" ? valueEurPerMwh : valueEurPerMwh / 10;
}
