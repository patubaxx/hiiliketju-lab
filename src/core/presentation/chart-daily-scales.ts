/**
 * Picks a divisor and unit id for daily chart Y-axes (presentation only).
 * Values in `CalculationResult` stay in base units; charts apply scaling in memory.
 */

export type MassPerDayYScale = { readonly divisor: number; readonly unitId: "kg" | "t" | "kt" };

export function pickMassPerDayYScaleFromMaxAbsKg(maxAbsKg: number): MassPerDayYScale {
  if (!Number.isFinite(maxAbsKg) || maxAbsKg <= 0) {
    return { divisor: 1, unitId: "kg" };
  }
  if (maxAbsKg < 1_000) {
    return { divisor: 1, unitId: "kg" };
  }
  if (maxAbsKg < 1_000_000) {
    return { divisor: 1_000, unitId: "t" };
  }
  return { divisor: 1_000_000, unitId: "kt" };
}

export type EurPerDayYScale = { readonly divisor: number; readonly unitId: "eur" | "kEUR" | "MEUR" };

export function pickEurPerDayYScaleFromMaxAbsEur(maxAbsEur: number): EurPerDayYScale {
  if (!Number.isFinite(maxAbsEur) || maxAbsEur <= 0) {
    return { divisor: 1, unitId: "eur" };
  }
  if (maxAbsEur < 1_000) {
    return { divisor: 1, unitId: "eur" };
  }
  if (maxAbsEur < 1_000_000) {
    return { divisor: 1_000, unitId: "kEUR" };
  }
  return { divisor: 1_000_000, unitId: "MEUR" };
}
