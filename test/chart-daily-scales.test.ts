import { describe, expect, it } from "vitest";

import { pickEurPerDayYScaleFromMaxAbsEur, pickMassPerDayYScaleFromMaxAbsKg } from "@/core/presentation/chart-daily-scales";

describe("chart-daily-scales (WP26)", () => {
  it("scales mass per day from kg to t to kt", () => {
    expect(pickMassPerDayYScaleFromMaxAbsKg(50)).toEqual({ divisor: 1, unitId: "kg" });
    expect(pickMassPerDayYScaleFromMaxAbsKg(5_000)).toEqual({ divisor: 1_000, unitId: "t" });
    expect(pickMassPerDayYScaleFromMaxAbsKg(2_000_000)).toEqual({ divisor: 1_000_000, unitId: "kt" });
  });

  it("scales EUR per day from EUR to kEUR to MEUR", () => {
    expect(pickEurPerDayYScaleFromMaxAbsEur(400)).toEqual({ divisor: 1, unitId: "eur" });
    expect(pickEurPerDayYScaleFromMaxAbsEur(50_000)).toEqual({ divisor: 1_000, unitId: "kEUR" });
    expect(pickEurPerDayYScaleFromMaxAbsEur(3_000_000)).toEqual({ divisor: 1_000_000, unitId: "MEUR" });
  });
});
