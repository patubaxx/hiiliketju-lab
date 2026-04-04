import { describe, expect, it } from "vitest";

import {
  annualCo2InputToKtPerYear,
  annualCo2KtPerYearToInputDisplay,
  electricityPriceEurPerMwhToInputDisplay,
  electricityPriceInputToEurPerMwh,
} from "@/core/domain/input-display-unit-conversions";

describe("input-display-unit-conversions", () => {
  describe("annual CO₂ kt/year ↔ kg/year", () => {
    it("passes through kt/year", () => {
      expect(annualCo2InputToKtPerYear(2.5, "kt_per_year")).toBe(2.5);
      expect(annualCo2KtPerYearToInputDisplay(2.5, "kt_per_year")).toBe(2.5);
    });

    it("converts kg/year to kt/year", () => {
      expect(annualCo2InputToKtPerYear(1_000_000, "kg_per_year")).toBe(1);
      expect(annualCo2InputToKtPerYear(500_000, "kg_per_year")).toBe(0.5);
    });

    it("converts kt/year to kg/year for display", () => {
      expect(annualCo2KtPerYearToInputDisplay(1, "kg_per_year")).toBe(1_000_000);
    });

    it("round-trips", () => {
      const kt = 0.0037;
      const kg = annualCo2KtPerYearToInputDisplay(kt, "kg_per_year");
      expect(annualCo2InputToKtPerYear(kg, "kg_per_year")).toBeCloseTo(kt, 10);
    });
  });

  describe("electricity EUR/MWh ↔ c/kWh", () => {
    it("passes through EUR/MWh", () => {
      expect(electricityPriceInputToEurPerMwh(80, "eur_per_mwh")).toBe(80);
      expect(electricityPriceEurPerMwhToInputDisplay(80, "eur_per_mwh")).toBe(80);
    });

    it("converts c/kWh to EUR/MWh", () => {
      expect(electricityPriceInputToEurPerMwh(8, "c_per_kwh")).toBe(80);
    });

    it("converts EUR/MWh to c/kWh for display", () => {
      expect(electricityPriceEurPerMwhToInputDisplay(80, "c_per_kwh")).toBe(8);
    });

    it("round-trips", () => {
      const eurMwh = 42.5;
      const c = electricityPriceEurPerMwhToInputDisplay(eurMwh, "c_per_kwh");
      expect(electricityPriceInputToEurPerMwh(c, "c_per_kwh")).toBeCloseTo(eurMwh, 10);
    });
  });
});
