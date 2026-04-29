/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { calculateScenario } from "@/core/calculation/calculate-scenario";
import { type ScenarioInput } from "@/core/domain/scenario";
import { buildScenarioPayload } from "@/features/scenario/input-ui/build-scenario-payload";
import { createInitialFormState, defaultElectricityBranch } from "@/features/scenario/input-ui/form-state";
import { ScenarioInputApp } from "@/features/scenario/input-ui/scenario-input-app";
import { safeParseScenarioInput, scenarioWireToScenarioInput } from "@/features/scenario/schemas/scenario-schema";
import { LocaleProvider } from "@/i18n/locale-context";

import { waitForStoredLocaleEnApplied } from "./wait-for-stored-locale";

const LOCALE_KEY = "hiiliketju.locale";

afterEach(() => {
  cleanup();
  localStorage.removeItem(LOCALE_KEY);
});

describe("WP22 – default locale (Finnish)", () => {
  it("uses Finnish for the simple setup title when no locale is stored", () => {
    localStorage.removeItem(LOCALE_KEY);
    render(
      <LocaleProvider>
        <ScenarioInputApp />
      </LocaleProvider>,
    );
    expect(screen.getByTestId("setup-simple-section").textContent).toMatch(/Perusasetukset/);
  });

  it("first paint matches default Finnish, then applies stored en after effect (no hydration skew)", async () => {
    localStorage.setItem(LOCALE_KEY, "en");
    render(
      <LocaleProvider>
        <ScenarioInputApp />
      </LocaleProvider>,
    );
    expect(screen.getByTestId("setup-simple-section").textContent).toMatch(/Perusasetukset/);
    await waitFor(() => {
      expect(screen.getByTestId("setup-simple-section").textContent).toMatch(/Basic inputs/i);
    });
  });
});

describe("WP22 – simple setup shell", () => {
  beforeEach(() => {
    localStorage.setItem(LOCALE_KEY, "en");
  });

  it("renders annual CO₂, utilization, and electricity; hides scenario name until advanced is open", async () => {
    render(
      <LocaleProvider>
        <ScenarioInputApp />
      </LocaleProvider>,
    );
    await waitForStoredLocaleEnApplied();
    expect(screen.getByTestId("setup-simple-section")).toBeTruthy();
    expect(screen.getByLabelText(/Annual CO₂/i)).toBeTruthy();
    expect(screen.getByLabelText(/Utilization rate/i)).toBeTruthy();
    expect(screen.getByTestId("elmode")).toBeTruthy();
    expect(screen.queryByTestId("field-scenario-name")).toBeNull();
  });

  it("exposes the scenario name in advanced and keeps default payload valid without opening it", () => {
    const state = createInitialFormState();
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const parsed = safeParseScenarioInput(built.payload);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const input: ScenarioInput = scenarioWireToScenarioInput(parsed.data);
    const r = calculateScenario(input);
    expect(r.input.scenarioName).toBe("New scenario");
  });

  it("run pipeline from default simple form state returns a full calculation result", () => {
    const state = createInitialFormState();
    const built = buildScenarioPayload(state);
    if (!built.ok) throw new Error("payload");
    const parsed = safeParseScenarioInput(built.payload);
    if (!parsed.success) throw new Error("parse");
    const input: ScenarioInput = scenarioWireToScenarioInput(parsed.data);
    const r = calculateScenario(input);
    expect(r.annualSummary.annualMethaneRevenueEur).toBeDefined();
  });

  it("lets the user edit scenario name in advanced and maps it in the wire payload", async () => {
    render(
      <LocaleProvider>
        <ScenarioInputApp />
      </LocaleProvider>,
    );
    await waitForStoredLocaleEnApplied();
    fireEvent.click(screen.getByTestId("toggle-advanced-setup"));
    const name = screen.getByTestId("field-scenario-name");
    fireEvent.change(name, { target: { value: "Customer project" } });
    expect((name as HTMLInputElement).value).toBe("Customer project");
    const s = {
      ...createInitialFormState(),
      scenarioName: "Customer project",
    };
    const built = buildScenarioPayload(s);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const parsed = safeParseScenarioInput(built.payload);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.scenarioName).toBe("Customer project");
  });
});

describe("WP22 – electricity in simple (visible modes)", () => {
  beforeEach(() => {
    localStorage.setItem(LOCALE_KEY, "en");
  });

  it("exposes only constant and imported market options in the simple electricity selector", async () => {
    render(
      <LocaleProvider>
        <ScenarioInputApp />
      </LocaleProvider>,
    );
    await waitForStoredLocaleEnApplied();
    const sel = screen.getByTestId("elmode") as HTMLSelectElement;
    const opts = [...sel.querySelectorAll("option")].map((o) => o.textContent?.trim() ?? "");
    expect(opts).toEqual([
      "Constant purchase price (EUR/MWh)",
      "Imported market data (daily or hourly purchase-price series)",
    ]);
  });

  it("works with constant electricity (parse + calc)", () => {
    const state = createInitialFormState();
    expect(state.electricity.mode).toBe("constant");
    const built = buildScenarioPayload(state);
    if (!built.ok) throw new Error("fail");
    const parsed = safeParseScenarioInput(built.payload);
    if (!parsed.success) throw new Error("zod");
    const r = calculateScenario(scenarioWireToScenarioInput(parsed.data));
    expect(r.input.electricity.mode).toBe("constant");
  });

  it("works with historical_market_data_imported (parse + calc)", () => {
    const state = {
      ...createInitialFormState(),
      electricity: defaultElectricityBranch("historical_market_data_imported"),
    };
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const parsed = safeParseScenarioInput(built.payload);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const r = calculateScenario(scenarioWireToScenarioInput(parsed.data));
    expect(r.input.electricity.mode).toBe("historical_market_data_imported");
  });
});

describe("WP22 – advanced region toggle", () => {
  beforeEach(() => {
    localStorage.setItem(LOCALE_KEY, "en");
  });

  it("reveals the advanced block when the toggle is pressed", async () => {
    render(
      <LocaleProvider>
        <ScenarioInputApp />
      </LocaleProvider>,
    );
    await waitForStoredLocaleEnApplied();
    expect(screen.queryByTestId("setup-advanced-region")).toBeNull();
    fireEvent.click(screen.getByTestId("toggle-advanced-setup"));
    await waitFor(() => {
      expect(screen.getByTestId("setup-advanced-region")).toBeTruthy();
    });
  });
});
