import { describe, expect, it } from "vitest";

import { buildScenarioPayload } from "@/features/scenario/input-ui/build-scenario-payload";
import { createInitialFormState } from "@/features/scenario/input-ui/form-state";
import { parseNumberSeries } from "@/features/scenario/input-ui/parse-number-series";
import {
  parseNumericCell,
  parseTimeSeriesCsv,
} from "@/features/scenario/input-ui/parse-time-series-csv";
import { safeParseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

describe("parseNumericCell", () => {
  it("accepts dot decimals and integers", () => {
    expect(parseNumericCell("10")).toBe(10);
    expect(parseNumericCell("10.5")).toBe(10.5);
    expect(parseNumericCell("-0.25")).toBe(-0.25);
  });

  it("accepts single comma as decimal separator", () => {
    expect(parseNumericCell("10,5")).toBe(10.5);
    expect(parseNumericCell("-3,14")).toBe(-3.14);
  });

  it("rejects ambiguous numbers", () => {
    expect(parseNumericCell("1,000,5")).toBeNull();
    expect(parseNumericCell("abc")).toBeNull();
  });
});

describe("parseTimeSeriesCsv", () => {
  it("parses single-column values with exact count", () => {
    const csv = "1\n2\n3";
    const r = parseTimeSeriesCsv(csv, { resolution: "daily", expectedCount: 3 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.values).toEqual([1, 2, 3]);
    expect(r.seriesText).toBe("1\n2\n3");
    expect(parseNumberSeries(r.seriesText)).toEqual({ ok: true, values: [1, 2, 3] });
  });

  it("accepts negative prices in single-column CSV", () => {
    const csv = "-10\n0\n-0.25";
    const r = parseTimeSeriesCsv(csv, { resolution: "daily", expectedCount: 3 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.values).toEqual([-10, 0, -0.25]);
  });

  it("accepts negative prices in two-column daily CSV", () => {
    const csv = "2023-01-01,-5.5\n2023-01-02,0";
    const r = parseTimeSeriesCsv(csv, { resolution: "daily", expectedCount: 2 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.values).toEqual([-5.5, 0]);
  });

  it("strips BOM", () => {
    const csv = "\uFEFF10\n20\n30";
    const r = parseTimeSeriesCsv(csv, { resolution: "daily", expectedCount: 3 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.values).toEqual([10, 20, 30]);
  });

  it("skips a simple header row", () => {
    const csv = "timestamp,value\n2023-01-01,1\n2023-01-02,2";
    const r = parseTimeSeriesCsv(csv, { resolution: "daily", expectedCount: 2 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.values).toEqual([1, 2]);
  });

  it("accepts semicolon delimiter in two-column rows", () => {
    const csv = "2023-01-01;10\n2023-01-02;12,5";
    const r = parseTimeSeriesCsv(csv, { resolution: "daily", expectedCount: 2 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.values).toEqual([10, 12.5]);
  });

  it("fills ordered values from two-column daily rows in arbitrary order", () => {
    const csv = "2023-01-02,2\n2023-01-01,1";
    const r = parseTimeSeriesCsv(csv, { resolution: "daily", expectedCount: 2 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.values).toEqual([1, 2]);
  });

  it("rejects wrong single-column row count", () => {
    const r = parseTimeSeriesCsv("1\n2", { resolution: "daily", expectedCount: 3 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("wrong_row_count");
  });

  it("rejects empty file", () => {
    const r = parseTimeSeriesCsv("   \n  ", { resolution: "daily", expectedCount: 1 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("empty_file");
  });

  it("rejects invalid number in single-column mode", () => {
    const r = parseTimeSeriesCsv("1\nx\n3", { resolution: "daily", expectedCount: 3 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("invalid_number");
  });

  it("rejects duplicate timestamps", () => {
    const csv = "2023-01-01,1\n2023-01-01,2";
    const r = parseTimeSeriesCsv(csv, { resolution: "daily", expectedCount: 2 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("duplicate_timestamp");
  });

  it("rejects incomplete two-column daily series", () => {
    const csv = "2023-01-01,1";
    const r = parseTimeSeriesCsv(csv, { resolution: "daily", expectedCount: 2 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("incomplete_series");
    expect(r.error.missingCount).toBe(1);
  });

  it("parses hourly two-column rows with clock time", () => {
    const csv = [
      "2023-01-01T00:00:00,1",
      "2023-01-01T01:00:00,2",
      "2023-01-01T02:00:00,3",
      "2023-01-01T03:00:00,4",
    ].join("\n");
    const r = parseTimeSeriesCsv(csv, { resolution: "hourly", expectedCount: 4 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.values).toEqual([1, 2, 3, 4]);
  });

  it("rejects date-only rows in hourly two-column mode", () => {
    const csv = "2023-01-01,10\n2023-01-02,20";
    const r = parseTimeSeriesCsv(csv, { resolution: "hourly", expectedCount: 2 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("hourly_date_only_timestamp");
  });

  it("rejects mixing single and double column rows", () => {
    const csv = "1\n2023-01-02,2";
    const r = parseTimeSeriesCsv(csv, { resolution: "daily", expectedCount: 2 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("mixed_row_formats");
  });

  it("normalizes a 365 single-column series for integration-style check", () => {
    const csv = Array.from({ length: 365 }, () => "1").join("\n");
    const r = parseTimeSeriesCsv(csv, { resolution: "daily", expectedCount: 365 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.values.length).toBe(365);
    const parsed = parseNumberSeries(r.seriesText);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.values.length).toBe(365);
  });

  it("feeds buildScenarioPayload via the same seriesText path as manual entry", () => {
    const csv = Array.from({ length: 365 }, (_, i) => String(i % 3)).join("\n");
    const r = parseTimeSeriesCsv(csv, { resolution: "daily", expectedCount: 365 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const state = {
      ...createInitialFormState(),
      co2: { mode: "time_series_daily" as const, seriesText: r.seriesText },
    };
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const avail = (built.payload as { co2: { availability: { dailyAvailableCo2Kg: number[] } } }).co2
      .availability;
    expect(avail.dailyAvailableCo2Kg[0]).toBe(0);
    expect(avail.dailyAvailableCo2Kg[1]).toBe(1);
    expect(avail.dailyAvailableCo2Kg.length).toBe(365);
  });

  it("CSV import of negative electricity prices validates through buildScenarioPayload and scenario schema", () => {
    const csv = Array.from({ length: 365 }, (_, i) => String(i === 10 ? -7.5 : 20)).join("\n");
    const r = parseTimeSeriesCsv(csv, { resolution: "daily", expectedCount: 365 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const state = {
      ...createInitialFormState(),
      electricity: { mode: "daily_series" as const, seriesText: r.seriesText },
    };
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const z = safeParseScenarioInput(built.payload as Record<string, unknown>);
    expect(z.success).toBe(true);
    if (z.success) {
      expect(z.data.electricity.mode).toBe("daily_series");
      if (z.data.electricity.mode === "daily_series") {
        expect(z.data.electricity.dailyPricesEurPerMwh[10]).toBe(-7.5);
      }
    }
  });

  it("manual electricity hourly series text with negatives validates through buildScenarioPayload and scenario schema", () => {
    const seriesText = Array.from({ length: 8760 }, (_, i) => String(i % 100 === 0 ? -1 : 5)).join("\n");
    const state = {
      ...createInitialFormState(),
      electricity: { mode: "hourly_series" as const, seriesText },
    };
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const z = safeParseScenarioInput(built.payload as Record<string, unknown>);
    expect(z.success).toBe(true);
  });
});
