import { describe, expect, it } from "vitest";

import {
  FINLAND_2025_DAILY_EUR_PER_MWH,
  FINLAND_2025_HOURLY_EUR_PER_MWH,
} from "@/data/electricity-defaults-2025-fi";
import {
  BUNDLED_FINLAND_2025_IMPORTED_DAILY_SERIES_TEXT,
  BUNDLED_FINLAND_2025_IMPORTED_HOURLY_SERIES_TEXT,
  computeNumericSeriesStats,
  isBundledFinland2025DefaultImportedSeries,
  summarizeImportedElectricitySeriesText,
} from "@/features/scenario/input-ui/imported-electricity-series";

function mean(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

describe("imported electricity series helpers (WP20)", () => {
  it("detects bundled Finland 2025 defaults by exact series text for daily and hourly", () => {
    expect(
      isBundledFinland2025DefaultImportedSeries("daily", BUNDLED_FINLAND_2025_IMPORTED_DAILY_SERIES_TEXT),
    ).toBe(true);
    expect(
      isBundledFinland2025DefaultImportedSeries("hourly", BUNDLED_FINLAND_2025_IMPORTED_HOURLY_SERIES_TEXT),
    ).toBe(true);
    expect(
      isBundledFinland2025DefaultImportedSeries("daily", BUNDLED_FINLAND_2025_IMPORTED_HOURLY_SERIES_TEXT),
    ).toBe(false);
    expect(isBundledFinland2025DefaultImportedSeries("hourly", "1\n" + "1\n".repeat(100))).toBe(false);
  });

  it("computes mean, min, and max for daily and hourly default arrays (deterministic)", () => {
    const daily = computeNumericSeriesStats(FINLAND_2025_DAILY_EUR_PER_MWH);
    const hourly = computeNumericSeriesStats(FINLAND_2025_HOURLY_EUR_PER_MWH);
    expect(daily).not.toBeNull();
    expect(hourly).not.toBeNull();
    if (!daily || !hourly) return;
    expect(daily.count).toBe(365);
    expect(hourly.count).toBe(8760);
    expect(daily.mean).toBeCloseTo(mean(FINLAND_2025_DAILY_EUR_PER_MWH), 10);
    expect(daily.min).toBe(Math.min(...FINLAND_2025_DAILY_EUR_PER_MWH));
    expect(daily.max).toBe(Math.max(...FINLAND_2025_DAILY_EUR_PER_MWH));
    expect(hourly.mean).toBeCloseTo(mean(FINLAND_2025_HOURLY_EUR_PER_MWH), 10);
  });

  it("summarizes text parsed the same way as the form (newlines, commas)", () => {
    const fromNewlines = summarizeImportedElectricitySeriesText("10\n20\n30");
    const fromCommas = summarizeImportedElectricitySeriesText("10, 20, 30");
    expect(fromNewlines.ok && fromCommas.ok).toBe(true);
    if (fromNewlines.ok && fromCommas.ok) {
      expect(fromNewlines.stats.mean).toBe(20);
      expect(fromNewlines.stats.min).toBe(10);
      expect(fromNewlines.stats.max).toBe(30);
      expect(fromCommas.stats).toEqual(fromNewlines.stats);
    }
  });
});
