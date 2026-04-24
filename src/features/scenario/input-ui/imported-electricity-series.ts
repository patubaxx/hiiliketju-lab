import {
  FINLAND_2025_DAILY_EUR_PER_MWH,
  FINLAND_2025_HOURLY_EUR_PER_MWH,
} from "@/data/electricity-defaults-2025-fi";

import { parseNumberSeries } from "@/features/scenario/input-ui/parse-number-series";

/** Pre-joined `seriesText` for exact-match default detection (avoids re-allocating on each check). */
export const BUNDLED_FINLAND_2025_IMPORTED_DAILY_SERIES_TEXT =
  FINLAND_2025_DAILY_EUR_PER_MWH.join("\n");

export const BUNDLED_FINLAND_2025_IMPORTED_HOURLY_SERIES_TEXT =
  FINLAND_2025_HOURLY_EUR_PER_MWH.join("\n");

export function isBundledFinland2025DefaultImportedSeries(
  resolution: "daily" | "hourly",
  seriesText: string,
): boolean {
  if (resolution === "daily") {
    return seriesText === BUNDLED_FINLAND_2025_IMPORTED_DAILY_SERIES_TEXT;
  }
  return seriesText === BUNDLED_FINLAND_2025_IMPORTED_HOURLY_SERIES_TEXT;
}

export function computeNumericSeriesStats(values: readonly number[]): {
  count: number;
  mean: number;
  min: number;
  max: number;
} | null {
  if (values.length === 0) {
    return null;
  }
  let sum = 0;
  let min = values[0]!;
  let max = values[0]!;
  for (const v of values) {
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { count: values.length, mean: sum / values.length, min, max };
}

export function summarizeImportedElectricitySeriesText(seriesText: string):
  | { ok: true; stats: { count: number; mean: number; min: number; max: number } }
  | { ok: false; reason: "empty" | "unparseable" } {
  const parsed = parseNumberSeries(seriesText);
  if (!parsed.ok) {
    return { ok: false, reason: "unparseable" };
  }
  if (parsed.values.length === 0) {
    return { ok: false, reason: "empty" };
  }
  return { ok: true, stats: computeNumericSeriesStats(parsed.values) };
}
