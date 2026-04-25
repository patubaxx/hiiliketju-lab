/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { calculateScenario } from "@/core/calculation/calculate-scenario";
import { defaultProcessAssumptionsInput } from "@/core/domain/assumptions";
import {
  USER_FACING_EXPORT_PROCESS_ASSUMPTION_KEYS,
} from "@/core/domain/user-facing-process-assumptions";
import { buildScenarioExcelExportModel } from "@/core/reporting/build-export-model";
import { ScenarioInputApp } from "@/features/scenario/input-ui/scenario-input-app";
import { ResultsAssumptions } from "@/features/scenario/results-ui/results-assumptions";
import { parseScenarioInput } from "@/features/scenario/schemas/scenario-schema";
import { LocaleProvider, useLocale } from "@/i18n/locale-context";

import { waitForStoredLocaleEnApplied } from "./wait-for-stored-locale";

beforeEach(() => {
  localStorage.setItem("hiiliketju.locale", "en");
});
afterEach(() => {
  cleanup();
  localStorage.removeItem("hiiliketju.locale");
});

function minimalRaw() {
  return {
    scenarioName: "wp23",
    periodDays: 365,
    co2: {
      annualAmountKtPerYear: 1,
      utilizationRatePct: 100,
      availability: { mode: "flat_annual" as const },
    },
    electricity: { mode: "constant" as const, priceEurPerMwh: 80 },
    economics: {
      methanePriceEurPerTch4: 200,
      hydrogenPriceEurPerKg: 6,
      otherOpexEurPerYear: 0,
      includeCapex: false,
    },
    assumptionsMeta: { assumptionsVersion: "wp23" },
    process: {},
  };
}

describe("WP23 – active assumptions policy (user-facing surface)", () => {
  it("Advanced setup shows the three engine-active process fields and hides plant availability and process efficiency", async () => {
    render(
      <LocaleProvider>
        <ScenarioInputApp />
      </LocaleProvider>,
    );
    await waitForStoredLocaleEnApplied();
    fireEvent.click(screen.getByTestId("toggle-advanced-setup"));

    expect(
      screen.getByLabelText("Stoichiometric H₂ demand (kg H₂ / kg CO₂)"),
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Stoichiometric CH₄ yield (kg CH₄ / kg CO₂)"),
    ).toBeTruthy();
    expect(screen.getByLabelText("Electrolyzer SEC (kWh / kg H₂)")).toBeTruthy();

    expect(screen.queryByLabelText("Plant availability (%)")).toBeNull();
    expect(screen.queryByLabelText("Process efficiency (%)")).toBeNull();
  });

  it("Results assumptions list shows active process fields with literature metadata, not plant/process efficiency", async () => {
    function AssumptionsFixture() {
      const { t, locale } = useLocale();
      return <ResultsAssumptions process={defaultProcessAssumptionsInput()} locale={locale} t={t} />;
    }
    render(
      <LocaleProvider>
        <AssumptionsFixture />
      </LocaleProvider>,
    );
    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { name: "Stoichiometric H₂ demand (kg H₂ / kg CO₂)" }),
        ).toBeTruthy();
      },
      { timeout: 8_000 },
    );
    expect(screen.getByRole("heading", { name: "Stoichiometric CH₄ yield (kg CH₄ / kg CO₂)" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Electrolyzer SEC (kWh / kg H₂)" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Electrolyzer SEC (MWh / kg H₂)" })).toBeTruthy();
    expect(screen.queryByText("Plant availability (%)")).toBeNull();
    expect(screen.queryByText("Process efficiency (%)")).toBeNull();
  });

  it("Excel/PDF shared export model includes only user-facing process rows (excludes plant/process efficiency)", () => {
    const result = calculateScenario(parseScenarioInput(minimalRaw()));
    const model = buildScenarioExcelExportModel(result);
    const keys = model.processAssumptions.map((r) => r.fieldKey);
    expect(keys).toEqual([...USER_FACING_EXPORT_PROCESS_ASSUMPTION_KEYS]);
    expect(keys).not.toContain("plantAvailabilityPct");
    expect(keys).not.toContain("processEfficiencyPct");
    const h2 = model.processAssumptions.find(
      (r) => r.fieldKey === "stoichiometricHydrogenDemandFactorKgH2PerKgCo2",
    );
    expect(h2?.assumptionSource).toBe("literature_based");
  });
});
