import { describe, expect, it } from "vitest";

import {
  DISPLAY_VALUE_NA,
  formatDisplayNumber,
  formatDisplayPercent,
  formatScaledCurrencyEur,
  formatScaledEnergyMWh,
  formatScaledMassKg,
} from "@/core/presentation/format-scaled-number";

describe("formatScaledCurrencyEur", () => {
  it("keeps small amounts in EUR", () => {
    const r = formatScaledCurrencyEur(500);
    expect(r.unit).toBe("EUR");
    expect(r.value).toBe(500);
    expect(r.formatted).toBe("500.00");
  });

  it("uses kEUR from 1 000", () => {
    const r = formatScaledCurrencyEur(12_500);
    expect(r.unit).toBe("kEUR");
    expect(r.value).toBe(12.5);
    expect(r.formatted).toBe("12.50");
  });

  it("uses MEUR from 1 000 000", () => {
    const r = formatScaledCurrencyEur(2_500_000);
    expect(r.unit).toBe("MEUR");
    expect(r.value).toBe(2.5);
    expect(r.formatted).toBe("2.50");
  });

  it("handles negative values", () => {
    const r = formatScaledCurrencyEur(-1_200_000);
    expect(r.unit).toBe("MEUR");
    expect(r.value).toBe(-1.2);
  });
});

describe("formatScaledMassKg", () => {
  it("uses kg under 1 t", () => {
    const r = formatScaledMassKg(500);
    expect(r.unit).toBe("kg");
    expect(r.formatted).toBe("500.00");
  });

  it("uses t from 1 000 kg", () => {
    const r = formatScaledMassKg(15_000);
    expect(r.unit).toBe("t");
    expect(r.value).toBe(15);
  });

  it("uses kt from 1 000 000 kg", () => {
    const r = formatScaledMassKg(3_200_000);
    expect(r.unit).toBe("kt");
    expect(r.value).toBe(3.2);
  });
});

describe("formatScaledEnergyMWh", () => {
  it("keeps MWh under 1 000 MWh", () => {
    const r = formatScaledEnergyMWh(80);
    expect(r.unit).toBe("MWh");
    expect(r.formatted).toBe("80.00");
  });

  it("uses GWh from 1 000 MWh", () => {
    const r = formatScaledEnergyMWh(2_100);
    expect(r.unit).toBe("GWh");
    expect(r.value).toBe(2.1);
  });
});

describe("formatDisplayNumber", () => {
  it("rounds to max 2 decimals by default", () => {
    expect(formatDisplayNumber(3.456789)).toBe("3.46");
  });

  it("returns placeholder for non-finite", () => {
    expect(formatDisplayNumber(Number.NaN)).toBe(DISPLAY_VALUE_NA);
    expect(formatDisplayNumber(Number.POSITIVE_INFINITY)).toBe(DISPLAY_VALUE_NA);
  });
});

describe("formatDisplayPercent", () => {
  it("formats percent with max 2 decimals in ratio form", () => {
    const s = formatDisplayPercent(12.34);
    expect(s).toMatch(/12/);
  });
});
