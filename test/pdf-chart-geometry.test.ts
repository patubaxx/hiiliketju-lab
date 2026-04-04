import { describe, expect, it } from "vitest";

import { buildPdfDayValueChartLayout, pdfChartLinearYTicks } from "@/core/reporting/pdf-chart-geometry";

describe("pdf-chart-geometry (PDF chart layout)", () => {
  it("produces Y ticks with nice steps and bounded count", () => {
    const ticks = pdfChartLinearYTicks(0, 1000, 4);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    expect(ticks.length).toBeLessThanOrEqual(6);
    expect(ticks[0]).toBeLessThanOrEqual(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(1000);
  });

  it("buildPdfDayValueChartLayout maps downsampled points into plot with axes metadata", () => {
    const series = [
      { dayIndex: 0, value: 10 },
      { dayIndex: 180, value: 50 },
      { dayIndex: 364, value: 20 },
    ];
    const layout = buildPdfDayValueChartLayout(series, 230, 106, 364);
    expect(layout.linePathD.length).toBeGreaterThan(10);
    expect(layout.yTicks.length).toBeGreaterThanOrEqual(2);
    expect(layout.xTicks.length).toBeGreaterThanOrEqual(2);
    expect(layout.plot.w).toBeGreaterThan(50);
    expect(layout.plot.h).toBeGreaterThan(30);
  });

  it("returns empty path when series is empty", () => {
    const layout = buildPdfDayValueChartLayout([], 230, 106, 364);
    expect(layout.linePathD).toBe("");
    expect(layout.yTicks).toEqual([]);
  });
});
