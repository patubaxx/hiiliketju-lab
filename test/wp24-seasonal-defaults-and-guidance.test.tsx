/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { calculateScenario } from "@/core/calculation/calculate-scenario";
import { DEFAULT_SEASONAL_CO2_RELATIVE_WEIGHTS } from "@/core/domain/seasonal-co2-default-weights";
import { mergeProcessAssumptionsInput, type ScenarioInput } from "@/core/domain/scenario";
import { buildScenarioPayload } from "@/features/scenario/input-ui/build-scenario-payload";
import {
  createInitialFormState,
  defaultCo2Branch,
} from "@/features/scenario/input-ui/form-state";
import { ScenarioInputApp } from "@/features/scenario/input-ui/scenario-input-app";
import { ResultsTables } from "@/features/scenario/results-ui/results-tables";
import { safeParseScenarioInput } from "@/features/scenario/schemas/scenario-schema";
import { translate } from "@/i18n/messages";
import { LocaleProvider, useLocale } from "@/i18n/locale-context";

import { waitForStoredLocaleEnApplied } from "./wait-for-stored-locale";

const LOCALE = "hiiliketju.locale";

function runFromInitialState(): ReturnType<typeof calculateScenario> {
  const state = createInitialFormState();
  const built = buildScenarioPayload(state);
  if (!built.ok) throw new Error("payload");
  const parsed = safeParseScenarioInput(built.payload);
  if (!parsed.success) throw new Error("parse");
  const input: ScenarioInput = {
    ...parsed.data,
    process: mergeProcessAssumptionsInput(parsed.data.process),
  };
  return calculateScenario(input);
}

afterEach(() => {
  cleanup();
  localStorage.removeItem(LOCALE);
});

describe("WP24 – default seasonal CO₂ and profile constant", () => {
  it("initial form state is seasonal_daily with the winter-weighted 12 default weights", () => {
    const s = createInitialFormState();
    expect(s.co2.mode).toBe("seasonal_daily");
    if (s.co2.mode !== "seasonal_daily") return;
    expect(s.co2.monthlyWeights).toHaveLength(12);
    for (let i = 0; i < 12; i++) {
      expect(parseFloat(s.co2.monthlyWeights[i]!)).toBeCloseTo(DEFAULT_SEASONAL_CO2_RELATIVE_WEIGHTS[i]!, 10);
    }
  });

  it("defaultCo2Branch(seasonal_daily) matches the same profile", () => {
    const b = defaultCo2Branch("seasonal_daily");
    expect(b.mode).toBe("seasonal_daily");
    if (b.mode !== "seasonal_daily") return;
    for (let i = 0; i < 12; i++) {
      expect(parseFloat(b.monthlyWeights[i]!)).toBeCloseTo(DEFAULT_SEASONAL_CO2_RELATIVE_WEIGHTS[i]!, 10);
    }
  });
});

describe("WP24 – payload and annual reconciliation (seasonal default)", () => {
  it("buildScenarioPayload from default form includes seasonal mode with 12 relative weights", () => {
    const built = buildScenarioPayload(createInitialFormState());
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const av = (built.payload as { co2: { availability: { mode: string; monthlyRelativeWeights: number[] } } })
      .co2.availability;
    expect(av.mode).toBe("seasonal_daily");
    expect(av.monthlyRelativeWeights).toHaveLength(12);
  });

  it("calculation from default Simple pipeline preserves annual available CO₂ mass (1 kt/year ≈ 1e6 kg)", () => {
    const r = runFromInitialState();
    expect(r.annualSummary.annualCO2AvailableKg).toBeCloseTo(1_000_000, 0);
  });

  it("flat_annual co₂ mode still runs when selected", () => {
    const state = createInitialFormState();
    const built = buildScenarioPayload({ ...state, co2: defaultCo2Branch("flat_annual") });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const p = safeParseScenarioInput(built.payload);
    expect(p.success).toBe(true);
    if (!p.success) return;
    const input: ScenarioInput = { ...p.data, process: mergeProcessAssumptionsInput(p.data.process) };
    const r = calculateScenario(input);
    expect(r.annualSummary.annualCO2AvailableKg).toBeCloseTo(1_000_000, 0);
  });
});

describe("WP24 – seasonal UI: localized month names and guidance (English)", () => {
  beforeEach(() => {
    localStorage.setItem(LOCALE, "en");
  });

  it("Advanced seasonal weights use English month names, not “Month 1”", async () => {
    render(
      <LocaleProvider>
        <ScenarioInputApp />
      </LocaleProvider>,
    );
    await waitForStoredLocaleEnApplied();
    fireEvent.click(screen.getByTestId("toggle-advanced-setup"));
    await waitFor(() => {
      expect(screen.getByLabelText("January")).toBeTruthy();
    });
    expect(screen.getByLabelText("December")).toBeTruthy();
    expect(screen.queryByText(/Month 1/)).toBeNull();
  });

  it("renders key guidance callouts in Simple and Advanced", async () => {
    render(
      <LocaleProvider>
        <ScenarioInputApp />
      </LocaleProvider>,
    );
    await waitForStoredLocaleEnApplied();
    expect(screen.getByTestId("guidance-simple-setup").textContent?.length).toBeGreaterThan(50);
    fireEvent.click(screen.getByTestId("toggle-advanced-setup"));
    await waitFor(() => {
      expect(screen.getByTestId("guidance-co2-availability").textContent?.length).toBeGreaterThan(20);
    });
    expect(screen.getByTestId("guidance-economics").textContent?.length).toBeGreaterThan(20);
    expect(screen.getByTestId("guidance-advanced-process").textContent?.length).toBeGreaterThan(20);
  });

  it("guidance copy does not reference hidden inactive process fields as user inputs", async () => {
    render(
      <LocaleProvider>
        <ScenarioInputApp />
      </LocaleProvider>,
    );
    await waitForStoredLocaleEnApplied();
    fireEvent.click(screen.getByTestId("toggle-advanced-setup"));
    await waitFor(() => {
      expect(screen.getByTestId("guidance-advanced-process").textContent?.length).toBeGreaterThan(20);
    });
    const g = screen.getByTestId("guidance-advanced-process").textContent ?? "";
    expect(g.toLowerCase()).not.toMatch(/plant availability/);
    expect(g.toLowerCase()).not.toMatch(/process efficiency/);
  });

  it("monthly results table uses localized month name after locale applies (en)", async () => {
    const r = runFromInitialState();
    const jan = translate("en", "calendar.months.january");
    function T() {
      const { t, locale } = useLocale();
      return <ResultsTables result={r} locale={locale} t={t} />;
    }
    localStorage.setItem(LOCALE, "en");
    render(
      <LocaleProvider>
        <T />
      </LocaleProvider>,
    );
    await waitFor(
      () => {
        expect(screen.getByText(jan)).toBeTruthy();
      },
      { timeout: 8_000 },
    );
  });
});
