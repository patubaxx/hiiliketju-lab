/**
 * WP28 payload builder contract: canonical wire omitted when Advanced toggles are off;
 * valid plant / marketPurchase blocks when enabled.
 */
import { describe, expect, it } from "vitest";

import { createInitialFormState } from "@/features/scenario/input-ui/form-state";
import { buildScenarioPayload } from "@/features/scenario/input-ui/build-scenario-payload";
import { safeParseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

function assertWireParses(payload: unknown) {
  const parsed = safeParseScenarioInput(payload);
  expect(parsed.success, JSON.stringify(parsed.success ? null : parsed.error.flatten())).toBe(true);
  return parsed;
}

describe("buildScenarioPayload WP28 wire contract", () => {
  it("omits plant and co2.marketPurchase when toggles are off (legacy-compatible wire)", () => {
    const state = createInitialFormState();
    expect(state.plant.enabled).toBe(false);
    expect(state.co2MarketPurchase.enabled).toBe(false);
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const p = built.payload as Record<string, unknown>;
    expect(p).not.toHaveProperty("plant");
    const co2 = p.co2 as Record<string, unknown>;
    expect(co2).not.toHaveProperty("marketPurchase");
    const parsed = assertWireParses(built.payload);
    if (!parsed.success) return;
    expect(parsed.data.plant).toBeUndefined();
    expect(parsed.data.co2.marketPurchase).toBeUndefined();
  });

  it("when plant enabled omits payload if both capacities empty (same as toggle off)", () => {
    const state = createInitialFormState();
    state.plant = {
      enabled: true,
      electrolyzerMaxH2KgPerDay: "",
      methanationMaxCh4KgPerDay: "",
    };
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect((built.payload as Record<string, unknown>).plant).toBeUndefined();
    assertWireParses(built.payload);
  });

  it("emits plant block with numeric caps and parses", () => {
    const state = createInitialFormState();
    state.plant = {
      enabled: true,
      electrolyzerMaxH2KgPerDay: "1000",
      methanationMaxCh4KgPerDay: "",
    };
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const parsed = assertWireParses(built.payload);
    if (!parsed.success) return;
    expect(parsed.data.plant).toEqual({
      electrolyzerMaxH2KgPerDay: 1000,
      methanationMaxCh4KgPerDay: null,
    });
  });

  it("when market CO₂ enabled emits co2.marketPurchase with price", () => {
    const state = createInitialFormState();
    state.co2MarketPurchase = { enabled: true, purchasePriceEurPerTco2: "72.5" };
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const co2 = (built.payload as Record<string, unknown>).co2 as Record<string, unknown>;
    expect(co2.marketPurchase).toEqual({ mode: "enabled", purchasePriceEurPerTco2: 72.5 });
    assertWireParses(built.payload);
  });

  it("returns issues when plant enabled but a filled cap is invalid", () => {
    const state = createInitialFormState();
    state.plant = {
      enabled: true,
      electrolyzerMaxH2KgPerDay: "-1",
      methanationMaxCh4KgPerDay: "",
    };
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(false);
    if (!built.ok) {
      expect(built.issues.some((i) => i.path === "plant.electrolyzerMaxH2KgPerDay")).toBe(true);
    }
  });

  it("returns issues when market purchase enabled but price missing/invalid", () => {
    const state = createInitialFormState();
    state.co2MarketPurchase = { enabled: true, purchasePriceEurPerTco2: "" };
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(false);
  });
});
