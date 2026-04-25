/**
 * Default relative monthly weights for `seasonal_daily` CO₂ (WP24). Winter-weighted; normalized by the engine.
 * @see `resolveCo2Series` / `buildSeasonalDailyCo2ProfileKg` — do not change semantics here.
 */
export const DEFAULT_SEASONAL_CO2_RELATIVE_WEIGHTS: readonly number[] = [
  1.35, 1.3, 1.15, 1.0, 0.8, 0.6, 0.5, 0.6, 0.8, 1.0, 1.25, 1.35,
] as const;

export function defaultSeasonalMonthlyWeightFormStrings(): string[] {
  return DEFAULT_SEASONAL_CO2_RELATIVE_WEIGHTS.map((n) => String(n));
}
