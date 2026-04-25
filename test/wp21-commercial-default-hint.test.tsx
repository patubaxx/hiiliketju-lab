/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildScenarioPayload } from "@/features/scenario/input-ui/build-scenario-payload";
import {
  createInitialFormState,
  isHydrogenPriceAtFactoryDefault,
  isMethanePriceAtFactoryDefault,
} from "@/features/scenario/input-ui/form-state";
import { ScenarioInputApp } from "@/features/scenario/input-ui/scenario-input-app";
import { LocaleProvider } from "@/i18n/locale-context";

import { waitForStoredLocaleEnApplied } from "./wait-for-stored-locale";

afterEach(() => {
  cleanup();
  localStorage.removeItem("hiiliketju.locale");
});

beforeEach(() => {
  localStorage.setItem("hiiliketju.locale", "en");
});

function renderApp() {
  return render(
    <LocaleProvider>
      <ScenarioInputApp />
    </LocaleProvider>,
  );
}

async function expandAdvanced() {
  await waitForStoredLocaleEnApplied();
  fireEvent.click(screen.getByTestId("toggle-advanced-setup"));
}

describe("WP21 – commercial default price verify hints (helpers)", () => {
  it("treats factory default methane and hydrogen strings as defaults (parse-aligned)", () => {
    expect(isMethanePriceAtFactoryDefault("1200")).toBe(true);
    expect(isMethanePriceAtFactoryDefault("1200.0")).toBe(true);
    expect(isMethanePriceAtFactoryDefault(" 1200 ")).toBe(true);
    expect(isMethanePriceAtFactoryDefault("1199")).toBe(false);

    expect(isHydrogenPriceAtFactoryDefault("4")).toBe(true);
    expect(isHydrogenPriceAtFactoryDefault("4.0")).toBe(true);
    expect(isHydrogenPriceAtFactoryDefault("3.5")).toBe(false);
  });
});

describe("WP21 – commercial default price verify hints (UI)", () => {
  it("shows default-verify hints for methane and hydrogen on initial load", async () => {
    renderApp();
    await expandAdvanced();
    expect(screen.getByTestId("economics-methane-default-verify-hint")).toBeTruthy();
    expect(screen.getByTestId("economics-hydrogen-default-verify-hint")).toBeTruthy();
  });

  it("hides methane hint after the value is changed away from the factory default", async () => {
    renderApp();
    await expandAdvanced();
    const input = screen.getByLabelText(/Assumed methane sales price/i);
    fireEvent.change(input, { target: { value: "1195" } });
    expect(screen.queryByTestId("economics-methane-default-verify-hint")).toBeNull();
  });

  it("hides hydrogen hint after the value is changed away from the factory default", async () => {
    renderApp();
    await expandAdvanced();
    const input = screen.getByLabelText(/Assumed hydrogen sales price/i);
    fireEvent.change(input, { target: { value: "3.5" } });
    expect(screen.queryByTestId("economics-hydrogen-default-verify-hint")).toBeNull();
  });

  it("re-shows the methane hint when the user edits back to the factory default", async () => {
    renderApp();
    await expandAdvanced();
    const methane = screen.getByLabelText(/Assumed methane sales price/i);
    fireEvent.change(methane, { target: { value: "2000" } });
    expect(screen.queryByTestId("economics-methane-default-verify-hint")).toBeNull();
    fireEvent.change(methane, { target: { value: "1200" } });
    expect(screen.getByTestId("economics-methane-default-verify-hint")).toBeTruthy();
  });
});

describe("WP21 – buildScenarioPayload unchanged for economics", () => {
  it("initial economics numbers still map to the same canonical wire values", () => {
    const state = createInitialFormState();
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const econ = (built.payload as { economics: { methanePriceEurPerTch4: number; hydrogenPriceEurPerKg: number } })
      .economics;
    expect(econ.methanePriceEurPerTch4).toBe(1200);
    expect(econ.hydrogenPriceEurPerKg).toBe(4);
  });
});
