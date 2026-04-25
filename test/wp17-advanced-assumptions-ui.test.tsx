/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ScenarioInputApp } from "@/features/scenario/input-ui/scenario-input-app";
import { LocaleProvider } from "@/i18n/locale-context";

import { waitForStoredLocaleEnApplied } from "./wait-for-stored-locale";

beforeEach(() => {
  localStorage.setItem("hiiliketju.locale", "en");
});
afterEach(() => {
  cleanup();
  localStorage.removeItem("hiiliketju.locale");
});

async function expandAdvanced() {
  await waitForStoredLocaleEnApplied();
  fireEvent.click(screen.getByTestId("toggle-advanced-setup"));
}

describe("WP17 – advanced assumptions transparency UX", () => {
  it("shows literature-based defaults and metadata before any override", async () => {
    render(
      <LocaleProvider>
        <ScenarioInputApp />
      </LocaleProvider>,
    );
    await expandAdvanced();

    expect(screen.getAllByText("Literature-based")).toHaveLength(5);
    expect(screen.getByText("0.1832")).toBeTruthy();
    expect(screen.getByText("0.3645")).toBeTruthy();
    expect(screen.getByText("54")).toBeTruthy();
    expect(screen.getAllByText("Literature based").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Estimated").length).toBeGreaterThan(0);
  });

  it("switches a row to custom mode and keeps SEC editing to one visible field", async () => {
    render(
      <LocaleProvider>
        <ScenarioInputApp />
      </LocaleProvider>,
    );
    await expandAdvanced();

    expect(screen.queryByLabelText("Electrolyzer SEC (MWh / kg H₂)")).toBeNull();

    const h2Checkbox = screen.getByLabelText("Stoichiometric H₂ demand (kg H₂ / kg CO₂)");
    fireEvent.click(h2Checkbox);

    expect(screen.getByText("Using custom value")).toBeTruthy();
    expect(screen.getByDisplayValue("0.1832")).toBeTruthy();
    expect(screen.getAllByText("Customer provided").length).toBeGreaterThan(0);
  });
});
