import { describe, expect, it } from "vitest";

import { buildPdfCostRevenueChartLayout, buildPdfDayValueChartLayout } from "@/core/reporting/pdf-chart-geometry";

describe("PDF chart layout (WP26 — clamp & large values)", () => {
  it("produces a non-empty line path and grid-aligned Y ticks for very large values", () => {
    const series = [
      { dayIndex: 0, value: 5_000_000 },
      { dayIndex: 100, value: 12_000_000 },
      { dayIndex: 364, value: 8_000_000 },
    ];
    const layout = buildPdfDayValueChartLayout(series, 230, 106, 364);
    const { plot } = layout;
    expect(layout.linePathD.length).toBeGreaterThan(10);
    expect(layout.yTicks.length).toBeGreaterThan(1);
    for (const yt of layout.yTicks) {
      expect(yt.y).toBeGreaterThanOrEqual(plot.y0);
      expect(yt.y).toBeLessThanOrEqual(plot.y0 + plot.h);
    }
  });

  it("lays out cost and revenue lines for large daily EUR (shared Y scale)", () => {
    const series = Array.from({ length: 50 }, (_, i) => ({
      dayIndex: i * 7,
      totalCostEur: 9_000_000 + i * 10_000,
      methaneRevenueEur: 8_500_000 + i * 10_000,
    }));
    const layout = buildPdfCostRevenueChartLayout(series, 230, 106, 364);
    const { plot } = layout;
    expect(layout.costPathD.length + layout.revenuePathD.length).toBeGreaterThan(20);
    for (const yt of layout.yTicks) {
      expect(yt.y).toBeGreaterThanOrEqual(plot.y0);
      expect(yt.y).toBeLessThanOrEqual(plot.y0 + plot.h);
    }
  });
});
