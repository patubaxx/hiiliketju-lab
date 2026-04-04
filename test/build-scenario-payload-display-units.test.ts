import { describe, expect, it } from "vitest";

import { buildScenarioPayload } from "@/features/scenario/input-ui/build-scenario-payload";
import { createInitialFormState } from "@/features/scenario/input-ui/form-state";

describe("buildScenarioPayload display units", () => {
  it("converts annual CO₂ from kg/year to canonical kt/year on the wire", () => {
    const state = {
      ...createInitialFormState(),
      annualAmountKtPerYear: "2500000",
      annualCo2DisplayUnit: "kg_per_year" as const,
    };
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const co2 = (built.payload as { co2: { annualAmountKtPerYear: number } }).co2;
    expect(co2.annualAmountKtPerYear).toBe(2.5);
  });

  it("leaves kt/year unchanged when display unit is kt/year", () => {
    const state = {
      ...createInitialFormState(),
      annualAmountKtPerYear: "3",
      annualCo2DisplayUnit: "kt_per_year" as const,
    };
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const co2 = (built.payload as { co2: { annualAmountKtPerYear: number } }).co2;
    expect(co2.annualAmountKtPerYear).toBe(3);
  });

  it("converts constant electricity from c/kWh to canonical EUR/MWh", () => {
    const state = {
      ...createInitialFormState(),
      electricity: {
        mode: "constant" as const,
        priceEurPerMwh: "9",
        priceDisplayUnit: "c_per_kwh" as const,
      },
    };
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const el = (built.payload as { electricity: { priceEurPerMwh: number } }).electricity;
    expect(el.priceEurPerMwh).toBe(90);
  });

  it("leaves EUR/MWh unchanged when display unit is EUR/MWh", () => {
    const state = {
      ...createInitialFormState(),
      electricity: {
        mode: "constant" as const,
        priceEurPerMwh: "77",
        priceDisplayUnit: "eur_per_mwh" as const,
      },
    };
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const el = (built.payload as { electricity: { priceEurPerMwh: number } }).electricity;
    expect(el.priceEurPerMwh).toBe(77);
  });
});
