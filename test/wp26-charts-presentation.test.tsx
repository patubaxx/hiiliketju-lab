/** @vitest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { calculateScenario } from "@/core/calculation/calculate-scenario";
import { mergeProcessAssumptionsInput, type ScenarioInput } from "@/core/domain/scenario";
import { buildScenarioPayload } from "@/features/scenario/input-ui/build-scenario-payload";
import { createInitialFormState } from "@/features/scenario/input-ui/form-state";
import { ResultsCharts } from "@/features/scenario/results-ui/results-charts";
import { safeParseScenarioInput } from "@/features/scenario/schemas/scenario-schema";
import { translate } from "@/i18n/messages";
import { LocaleProvider, useLocale } from "@/i18n/locale-context";

import { waitForEnLocale } from "./wp26-helpers";

function runFromInitialState() {
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

function ChartsWrap() {
  const { t, locale } = useLocale();
  return <ResultsCharts result={runFromInitialState()} locale={locale} t={t} />;
}

afterEach(() => {
  localStorage.removeItem("hiiliketju.locale");
});

describe("WP26 – results charts (axis labels, scaling)", () => {
  it("renders X-axis date label and a scaled CO₂ y-axis string (English)", async () => {
    localStorage.setItem("hiiliketju.locale", "en");
    render(
      <LocaleProvider>
        <ChartsWrap />
      </LocaleProvider>,
    );
    await waitForEnLocale();
    const xDate = translate("en", "results.chart.axis.xDate");
    await waitFor(() => {
      // One footer per first three charts; the cost/revenue card uses a combined "Date · unit/d" line (no duplicate X label in SVG)
      const nodes = screen.getAllByText(xDate, { exact: true });
      expect(nodes).toHaveLength(3);
    });
    expect(
      screen.getByText(new RegExp(`^${xDate.replace(/[()]/g, "\\$&")} ·`)),
    ).toBeTruthy();
    const co2YAxisOptions = [
      translate("en", "results.chart.axis.yKgd"),
      translate("en", "results.chart.axis.yTpd"),
      translate("en", "results.chart.axis.yKtd"),
    ];
    expect(
      co2YAxisOptions.some((label) => screen.queryAllByText(label, { exact: true }).length > 0),
    ).toBe(true);
  });
});
