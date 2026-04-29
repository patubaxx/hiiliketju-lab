import { describe, expect, it } from "vitest";

import { en } from "@/i18n/messages/en";

/** Dot paths under `results.table` used by `src/features/scenario/results-ui/results-tables.tsx`. */
const RESULTS_TABLE_KEYS = [
  "results.table.annualTitle",
  "results.table.annualIntro",
  "results.table.monthlyTitle",
  "results.table.monthlyIntro",
  "results.table.dailyPreviewTitle",
  "results.table.dailyPreviewEmpty",
  "results.table.dailyPreviewDetails",
  "results.table.dailyPreviewNote",
  "results.table.column.metric",
  "results.table.column.value",
  "results.table.column.month",
  "results.table.column.methaneT",
  "results.table.column.electricityMwh",
  "results.table.column.totalCostEur",
  "results.table.column.methaneRevenueEur",
  "results.table.column.hydrogenAltRevenueEur",
  "results.table.column.date",
  "results.table.column.availableCo2Kg",
  "results.table.column.methaneKg",
] as const;

function getLeaf(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const segment of path.split(".")) {
    if (cur === undefined || cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[segment];
  }
  return cur;
}

describe("en i18n: results.table coverage for results-tables.tsx", () => {
  it("defines every results.table.* translation key used by the results tables section", () => {
    for (const id of RESULTS_TABLE_KEYS) {
      const v = getLeaf(en, id);
      expect(v, `Missing key: ${id}`).toBeDefined();
      expect(typeof v, id).toBe("string");
      expect((v as string).length, `${id} empty`).toBeGreaterThan(0);
    }
  });
});
