/**
 * WP16 — Deterministic 2025 Finnish electricity defaults pipeline tests
 *
 * Covers:
 * 1. Fixture integrity — hourly (8 760) and daily (365) arrays exist with correct shapes.
 * 2. Daily derivation correctness — daily[d] equals arithmetic mean of the 24 (or 23/25 on
 *    DST days) corresponding hourly values.
 * 3. Unit normalization — values are in EUR/MWh (not raw snt/kWh).
 * 4. Imported mode default loading — `defaultElectricityBranch` and resolution-switch produce
 *    real 2025 data, not flat 50-placeholders.
 * 5. Contract preservation — schema validates the new defaults without change.
 */
import { describe, expect, it } from "vitest";

import {
  FINLAND_2025_DAILY_EUR_PER_MWH,
  FINLAND_2025_HOURLY_EUR_PER_MWH,
  defaultElectricityBranch,
} from "@/features/scenario/input-ui/form-state";
import { electricityPriceInputSchema } from "@/features/scenario/schemas/electricity-price-schema";

// ─── 1. Fixture integrity ────────────────────────────────────────────────────

describe("WP16 – fixture integrity", () => {
  it("hourly array has exactly 8 760 values", () => {
    expect(FINLAND_2025_HOURLY_EUR_PER_MWH).toHaveLength(8760);
  });

  it("daily array has exactly 365 values", () => {
    expect(FINLAND_2025_DAILY_EUR_PER_MWH).toHaveLength(365);
  });

  it("all hourly values are finite numbers", () => {
    for (const v of FINLAND_2025_HOURLY_EUR_PER_MWH) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("all daily values are finite numbers", () => {
    for (const v of FINLAND_2025_DAILY_EUR_PER_MWH) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("data ordering is stable (first value matches known Jan-1 first hour)", () => {
    // Jan 1 2025 00:00 price from source: 0.503 snt/kWh × 10 = 5.03 EUR/MWh
    expect(FINLAND_2025_HOURLY_EUR_PER_MWH[0]).toBeCloseTo(5.03, 1);
  });

  it("last hourly value matches known Dec-31 last hour", () => {
    // Dec 31 2025 23:xx prices from source (snt/kWh → EUR/MWh):
    // 23:00 = 18.436 snt/kWh → 184.36 EUR/MWh
    // 23:15 = 13.805 snt/kWh → 138.05 EUR/MWh
    // 23:30 = 13.406 snt/kWh → 134.06 EUR/MWh
    // 23:45 = 12.452 snt/kWh → 124.52 EUR/MWh
    // Hourly mean = (184.36 + 138.05 + 134.06 + 124.52) / 4 = 145.2475 EUR/MWh
    expect(FINLAND_2025_HOURLY_EUR_PER_MWH[8759]).toBeCloseTo(145.2475, 2);
  });
});

// ─── 2. Daily derivation correctness ────────────────────────────────────────

describe("WP16 – daily derivation correctness", () => {
  it("daily[0] (Jan 1) equals arithmetic mean of the first 24 hourly values", () => {
    const expectedMean =
      FINLAND_2025_HOURLY_EUR_PER_MWH.slice(0, 24).reduce((s, v) => s + v, 0) / 24;
    expect(FINLAND_2025_DAILY_EUR_PER_MWH[0]).toBeCloseTo(expectedMean, 4);
  });

  it("daily[1] (Jan 2) equals arithmetic mean of hourly values 24–47", () => {
    const expectedMean =
      FINLAND_2025_HOURLY_EUR_PER_MWH.slice(24, 48).reduce((s, v) => s + v, 0) / 24;
    expect(FINLAND_2025_DAILY_EUR_PER_MWH[1]).toBeCloseTo(expectedMean, 4);
  });

  it("daily[87] (Mar 29, day before spring-forward) equals mean of 24 hourly values", () => {
    // 0-based day indices: Jan has 31 days (0–30), Feb has 28 (31–58), Mar 1–29 = days 59–87.
    // So Mar 29 = day index 87, a regular 24-hour day.
    // All days 0–87 have 24 hours → hourly start of day 87 = 87 × 24 = 2088.
    const MAR29_IDX = 87;
    const startHour = 87 * 24; // 2088
    const expectedMean =
      FINLAND_2025_HOURLY_EUR_PER_MWH.slice(startHour, startHour + 24).reduce(
        (s, v) => s + v,
        0,
      ) / 24;
    expect(FINLAND_2025_DAILY_EUR_PER_MWH[MAR29_IDX]).toBeCloseTo(expectedMean, 4);
  });

  it("spring-forward day (Mar 30, index 88) has 23 hourly slots — daily mean covers exactly those", () => {
    // Mar 30 = day index 88 (Jan 31 + Feb 28 + Mar 1–29 = 31+28+29 = 88 days before).
    // Days 0–87 each have 24 hours → hourly start of day 88 = 88 × 24 = 2112.
    // Mar 30 is the spring-forward day: hour 03 is skipped → 23 hourly values.
    const MAR30_IDX = 88;
    const hourStart = 88 * 24; // 2112
    const SPRING_FORWARD_HOURS = 23;
    const expectedMean =
      FINLAND_2025_HOURLY_EUR_PER_MWH.slice(hourStart, hourStart + SPRING_FORWARD_HOURS).reduce(
        (s, v) => s + v,
        0,
      ) / SPRING_FORWARD_HOURS;
    expect(FINLAND_2025_DAILY_EUR_PER_MWH[MAR30_IDX]).toBeCloseTo(expectedMean, 4);
  });

  it("total hourly values sum to 8760 regardless of DST adjustments", () => {
    // This is a shape check more than a derivation check, but confirms DST balance.
    expect(FINLAND_2025_HOURLY_EUR_PER_MWH).toHaveLength(8760);
  });
});

// ─── 3. Unit normalization ───────────────────────────────────────────────────

describe("WP16 – unit normalization (snt/kWh → EUR/MWh)", () => {
  it("first hourly value is approximately 5.03 EUR/MWh (source: 0.503 snt/kWh × 10)", () => {
    // 0.503 snt/kWh × 10 = 5.03 EUR/MWh
    expect(FINLAND_2025_HOURLY_EUR_PER_MWH[0]).toBeCloseTo(5.03, 1);
  });

  it("all hourly values are in EUR/MWh scale (not raw snt/kWh which would be 10× lower)", () => {
    // If values were accidentally left in snt/kWh, the scale would be ~0.5 not ~5 EUR/MWh for Jan 1.
    // At least the first non-trivial price must be above 1 EUR/MWh (confirming × 10 was applied).
    const firstNonZero = FINLAND_2025_HOURLY_EUR_PER_MWH.find((v) => v > 0.1);
    expect(firstNonZero).toBeGreaterThan(1);
  });

  it("daily average for first week is above 0 EUR/MWh (confirms non-zero data in EUR/MWh)", () => {
    const weekAvg = FINLAND_2025_DAILY_EUR_PER_MWH.slice(0, 7).reduce((s, v) => s + v, 0) / 7;
    expect(weekAvg).toBeGreaterThan(0);
  });
});

// ─── 4. Imported mode default loading ────────────────────────────────────────

describe("WP16 – imported market mode default loading", () => {
  it("defaultElectricityBranch('historical_market_data_imported') uses daily 2025 data, not flat 50s", () => {
    const branch = defaultElectricityBranch("historical_market_data_imported");
    expect(branch.mode).toBe("historical_market_data_imported");
    if (branch.mode !== "historical_market_data_imported") return;

    expect(branch.resolution).toBe("daily");
    const lines = branch.seriesText.split("\n");
    expect(lines).toHaveLength(365);

    // The first value must match the 2025 daily default, not the old placeholder "50"
    expect(parseFloat(lines[0])).not.toBeCloseTo(50, 1);
    expect(parseFloat(lines[0])).toBeCloseTo(FINLAND_2025_DAILY_EUR_PER_MWH[0], 4);
  });

  it("daily seriesText has 365 lines matching FINLAND_2025_DAILY_EUR_PER_MWH", () => {
    const branch = defaultElectricityBranch("historical_market_data_imported");
    if (branch.mode !== "historical_market_data_imported") return;

    const lines = branch.seriesText.split("\n");
    expect(lines).toHaveLength(365);
    for (let i = 0; i < 365; i++) {
      expect(parseFloat(lines[i])).toBeCloseTo(FINLAND_2025_DAILY_EUR_PER_MWH[i], 4);
    }
  });

  it("hourly data array has 8760 values and is not all 50s", () => {
    const hourlyText = FINLAND_2025_HOURLY_EUR_PER_MWH.join("\n");
    const lines = hourlyText.split("\n");
    expect(lines).toHaveLength(8760);
    // Not all values should be 50 (the old placeholder)
    const allFifty = lines.every((l) => parseFloat(l) === 50);
    expect(allFifty).toBe(false);
  });

  it("default resolution is 'daily'", () => {
    const branch = defaultElectricityBranch("historical_market_data_imported");
    if (branch.mode !== "historical_market_data_imported") return;
    expect(branch.resolution).toBe("daily");
  });
});

// ─── 5. Contract preservation ────────────────────────────────────────────────

describe("WP16 – contract preservation (schema validation)", () => {
  it("electricityPriceInputSchema accepts the 2025 daily defaults (365 values)", () => {
    const prices = Array.from(FINLAND_2025_DAILY_EUR_PER_MWH);
    const result = electricityPriceInputSchema.safeParse({
      mode: "historical_market_data_imported",
      resolution: "daily",
      pricesEurPerMwh: prices,
    });
    expect(result.success).toBe(true);
  });

  it("electricityPriceInputSchema accepts the 2025 hourly defaults (8760 values)", () => {
    const prices = Array.from(FINLAND_2025_HOURLY_EUR_PER_MWH);
    const result = electricityPriceInputSchema.safeParse({
      mode: "historical_market_data_imported",
      resolution: "hourly",
      pricesEurPerMwh: prices,
    });
    expect(result.success).toBe(true);
  });

  it("schema rejects wrong-length daily series (364 instead of 365)", () => {
    const prices = Array.from(FINLAND_2025_DAILY_EUR_PER_MWH).slice(0, 364);
    const result = electricityPriceInputSchema.safeParse({
      mode: "historical_market_data_imported",
      resolution: "daily",
      pricesEurPerMwh: prices,
    });
    expect(result.success).toBe(false);
  });

  it("schema rejects wrong-length hourly series (8759 instead of 8760)", () => {
    const prices = Array.from(FINLAND_2025_HOURLY_EUR_PER_MWH).slice(0, 8759);
    const result = electricityPriceInputSchema.safeParse({
      mode: "historical_market_data_imported",
      resolution: "hourly",
      pricesEurPerMwh: prices,
    });
    expect(result.success).toBe(false);
  });

  it("schema still validates constant mode (no regression)", () => {
    const result = electricityPriceInputSchema.safeParse({
      mode: "constant",
      priceEurPerMwh: 80,
    });
    expect(result.success).toBe(true);
  });

  it("schema still validates daily_series mode (no regression)", () => {
    const prices = Array.from({ length: 365 }, (_, i) => 60 + i * 0.01);
    const result = electricityPriceInputSchema.safeParse({
      mode: "daily_series",
      dailyPricesEurPerMwh: prices,
    });
    expect(result.success).toBe(true);
  });
});
