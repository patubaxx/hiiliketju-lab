/**
 * WP15 — Product-surface simplification tests
 *
 * Verifies:
 * 1. Annual CO₂ is now handled as kt/year only in the visible form state.
 * 2. Default electricity mode is `constant` (a visible UI mode).
 * 3. Internal schema/engine support for `daily_series` and `hourly_series` is preserved.
 * 4. `buildScenarioPayload` canonical output is correct with the fixed kt/year display unit.
 */
import { describe, expect, it } from "vitest";

import { buildScenarioPayload } from "@/features/scenario/input-ui/build-scenario-payload";
import {
  type ElectricityModeForm,
  createInitialFormState,
} from "@/features/scenario/input-ui/form-state";
import { electricityPriceInputSchema } from "@/features/scenario/schemas/electricity-price-schema";
import { safeParseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

// ─── CO₂ unit simplification ────────────────────────────────────────────────

describe("WP15 – annual CO₂ display unit", () => {
  it("initial form state uses kt_per_year as the CO₂ display unit", () => {
    const state = createInitialFormState();
    expect(state.annualCo2DisplayUnit).toBe("kt_per_year");
  });

  it("buildScenarioPayload passes kt/year value through unchanged to the canonical wire field", () => {
    const state = {
      ...createInitialFormState(),
      annualAmountKtPerYear: "5",
      annualCo2DisplayUnit: "kt_per_year" as const,
    };
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const co2 = (built.payload as { co2: { annualAmountKtPerYear: number } }).co2;
    expect(co2.annualAmountKtPerYear).toBe(5);
  });
});

// ─── Electricity mode visibility ─────────────────────────────────────────────

describe("WP15 – electricity mode visible defaults", () => {
  it("initial form state defaults electricity mode to constant (a visible mode)", () => {
    const state = createInitialFormState();
    expect(state.electricity.mode).toBe("constant");
  });
});

// ─── Internal compatibility: hidden electricity modes ────────────────────────

describe("WP15 – internal electricity mode compatibility retained", () => {
  it("electricityPriceInputSchema still validates daily_series mode", () => {
    const prices = Array.from({ length: 365 }, () => 60);
    const result = electricityPriceInputSchema.safeParse({
      mode: "daily_series",
      dailyPricesEurPerMwh: prices,
    });
    expect(result.success).toBe(true);
  });

  it("electricityPriceInputSchema still validates hourly_series mode", () => {
    const prices = Array.from({ length: 8760 }, () => 55);
    const result = electricityPriceInputSchema.safeParse({
      mode: "hourly_series",
      hourlyPricesEurPerMwh: prices,
    });
    expect(result.success).toBe(true);
  });

  it("electricityPriceInputSchema still validates constant mode", () => {
    const result = electricityPriceInputSchema.safeParse({
      mode: "constant",
      priceEurPerMwh: 80,
    });
    expect(result.success).toBe(true);
  });

  it("electricityPriceInputSchema still validates historical_market_data_imported mode", () => {
    const prices = Array.from({ length: 365 }, () => 70);
    const result = electricityPriceInputSchema.safeParse({
      mode: "historical_market_data_imported",
      resolution: "daily",
      pricesEurPerMwh: prices,
    });
    expect(result.success).toBe(true);
  });

  it("ElectricityModeForm type still includes daily_series and hourly_series (type-level guard)", () => {
    // If ElectricityModeForm no longer included these values, the assignments below would be TypeScript errors.
    const _daily: ElectricityModeForm = "daily_series";
    const _hourly: ElectricityModeForm = "hourly_series";
    expect(_daily).toBe("daily_series");
    expect(_hourly).toBe("hourly_series");
  });

  it("safeParseScenarioInput accepts a full scenario with daily_series electricity", () => {
    const prices = Array.from({ length: 365 }, () => 60);
    const result = safeParseScenarioInput({
      scenarioName: "internal-compat",
      periodDays: 365,
      co2: {
        annualAmountKtPerYear: 1,
        utilizationRatePct: 80,
        availability: { mode: "flat_annual" },
      },
      electricity: { mode: "daily_series", dailyPricesEurPerMwh: prices },
      economics: {
        methanePriceEurPerTch4: 300,
        hydrogenPriceEurPerKg: 5,
        otherOpexEurPerYear: 0,
        includeCapex: false,
      },
      assumptionsMeta: { assumptionsVersion: "test" },
    });
    expect(result.success).toBe(true);
  });

  it("safeParseScenarioInput accepts a full scenario with hourly_series electricity", () => {
    const prices = Array.from({ length: 8760 }, () => 55);
    const result = safeParseScenarioInput({
      scenarioName: "internal-compat-hourly",
      periodDays: 365,
      co2: {
        annualAmountKtPerYear: 1,
        utilizationRatePct: 80,
        availability: { mode: "flat_annual" },
      },
      electricity: { mode: "hourly_series", hourlyPricesEurPerMwh: prices },
      economics: {
        methanePriceEurPerTch4: 300,
        hydrogenPriceEurPerKg: 5,
        otherOpexEurPerYear: 0,
        includeCapex: false,
      },
      assumptionsMeta: { assumptionsVersion: "test" },
    });
    expect(result.success).toBe(true);
  });
});

// ─── Canonical payload integrity ─────────────────────────────────────────────

describe("WP15 – canonical payload integrity with simplified form state", () => {
  it("buildScenarioPayload with initial form state produces a valid parseable payload", () => {
    const state = createInitialFormState();
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const parsed = safeParseScenarioInput(built.payload);
    expect(parsed.success).toBe(true);
  });
});
