/** @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScenarioInputApp } from "@/features/scenario/input-ui/scenario-input-app";
import { LocaleProvider } from "@/i18n/locale-context";

describe("WP17 – advanced assumptions transparency UX", () => {
  it("shows literature-based defaults and metadata before any override", () => {
    render(
      <LocaleProvider>
        <ScenarioInputApp />
      </LocaleProvider>,
    );

    expect(screen.getAllByText("Literature-based")).toHaveLength(5);
    expect(screen.getByText("0.1832")).toBeTruthy();
    expect(screen.getByText("0.3645")).toBeTruthy();
    expect(screen.getByText("54")).toBeTruthy();
    expect(screen.getAllByText("Literature based").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Estimated").length).toBeGreaterThan(0);
  });

  it("switches a row to custom mode and keeps SEC editing to one visible field", () => {
    render(
      <LocaleProvider>
        <ScenarioInputApp />
      </LocaleProvider>,
    );

    expect(screen.queryByLabelText("Electrolyzer SEC (MWh / kg H₂)")).toBeNull();

    const h2Checkbox = screen.getByLabelText("Stoichiometric H₂ demand (kg H₂ / kg CO₂)");
    fireEvent.click(h2Checkbox);

    expect(screen.getByText("Using custom value")).toBeTruthy();
    expect(screen.getByDisplayValue("0.1832")).toBeTruthy();
    expect(screen.getAllByText("Customer provided").length).toBeGreaterThan(0);
  });
});
