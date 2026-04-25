/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { calculateScenario } from "@/core/calculation/calculate-scenario";
import { mergeProcessAssumptionsInput, type ScenarioInput } from "@/core/domain/scenario";
import { buildScenarioPayload } from "@/features/scenario/input-ui/build-scenario-payload";
import { createInitialFormState } from "@/features/scenario/input-ui/form-state";
import { ResultsPanel } from "@/features/scenario/results-ui/results-panel";
import { safeParseScenarioInput } from "@/features/scenario/schemas/scenario-schema";
import { buildUsedAssumptionsModel } from "@/core/reporting/build-used-assumptions-model";
import { buildScenarioExcelExportModel } from "@/core/reporting/build-export-model";
import { useLocale, LocaleProvider } from "@/i18n/locale-context";

async function waitForEnLocale() {
  await waitFor(
    () => {
      expect(document.documentElement.lang).toBe("en");
    },
    { timeout: 3_000 },
  );
}

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

function ResultsFixture({ result }: { result: ReturnType<typeof calculateScenario> }) {
  const { t, locale } = useLocale();
  return <ResultsPanel result={result} locale={locale} t={t} />;
}

afterEach(() => {
  cleanup();
  localStorage.removeItem(LOCALE);
});

describe("WP25 – used assumptions model (shared builder)", () => {
  it("omits plant availability and process efficiency from the row id set", () => {
    const r = runFromInitialState();
    const m = buildUsedAssumptionsModel(r);
    const idBlob = m.map((x) => x.id).join(" ");
    expect(idBlob).not.toMatch(/plant/i);
    expect(idBlob).not.toMatch(/processEff|efficien/i);
  });

  it("keeps process assumption source/status in model", () => {
    const r = runFromInitialState();
    const h2 = r.input.process.stoichiometricHydrogenDemandFactorKgH2PerKgCo2.assumptionMeta.assumptionSource;
    const row = buildUsedAssumptionsModel(r).find((x) => x.id === "process.stoichiometricHydrogenDemandFactorKgH2PerKgCo2");
    expect(row?.sourceKey).toBe(`assumptionSource.${h2}`);
  });

  it("export model reuses the same economic verdict and used-assumptions DTOs", () => {
    const r = runFromInitialState();
    const model = buildScenarioExcelExportModel(r);
    expect(model.economicVerdict.title.length).toBeGreaterThan(5);
    expect(model.usedAssumptionsPrint.length).toBeGreaterThan(8);
  });
});

describe("WP25 – results UI (Simple pipeline)", () => {
  beforeEach(() => {
    localStorage.setItem(LOCALE, "en");
  });

  it("renders verdict and used assumptions after a successful calculation", async () => {
    const r = runFromInitialState();
    render(
      <LocaleProvider>
        <ResultsFixture result={r} />
      </LocaleProvider>,
    );
    await waitForEnLocale();
    expect(screen.getByTestId("results-verdict-card")).toBeTruthy();
    expect(screen.getByTestId("results-used-assumptions")).toBeTruthy();
  });

  it("used assumptions includes seasonal, economics, and CAPEX-off row (English)", async () => {
    const r = runFromInitialState();
    render(
      <LocaleProvider>
        <ResultsFixture result={r} />
      </LocaleProvider>,
    );
    await waitForEnLocale();
    await waitFor(() => {
      expect(screen.getByText(/12 weights/i)).toBeTruthy();
    });
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/methane|Metane|CH₄/i);
    expect(body).toMatch(/capex|CAPEX/i);
  });
});

describe("WP25 – Advanced-edited value reflected in used assumptions", () => {
  beforeEach(() => {
    localStorage.setItem(LOCALE, "en");
  });

  it("higher custom methane price appears in the model", () => {
    const state = createInitialFormState();
    const built = buildScenarioPayload({
      ...state,
      economics: { ...state.economics, methanePriceEurPerTch4: "999" },
    });
    if (!built.ok) throw new Error("x");
    const p = safeParseScenarioInput(built.payload);
    if (!p.success) throw new Error("p");
    const input: ScenarioInput = { ...p.data, process: mergeProcessAssumptionsInput(p.data.process) };
    const r = calculateScenario(input);
    const m = buildUsedAssumptionsModel(r);
    const priceRow = m.find((x) => x.id === "economics.methane");
    expect(priceRow?.value).toBe(999);
  });
});
