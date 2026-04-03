import { describe, expect, it } from "vitest";

import { calculateScenario } from "@/core/calculation/calculate-scenario";
import {
  assertCalculationResultExportable,
  CalculationResultNotExportableError,
} from "@/core/reporting/assert-calculation-result-exportable";
import { parseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

import { minimalExportScenarioWire } from "./fixtures/export-minimal-scenario";

describe("assertCalculationResultExportable", () => {
  it("accepts a normal engine result", () => {
    const result = calculateScenario(parseScenarioInput(minimalExportScenarioWire()));
    expect(() => assertCalculationResultExportable(result)).not.toThrow();
  });

  it("rejects non-string warnings", () => {
    const result = calculateScenario(parseScenarioInput(minimalExportScenarioWire()));
    const bad = {
      ...result,
      warnings: [1] as unknown as string[],
    };
    expect(() => assertCalculationResultExportable(bad)).toThrow(CalculationResultNotExportableError);
  });

  it("rejects truncated daily rows", () => {
    const result = calculateScenario(parseScenarioInput(minimalExportScenarioWire()));
    const bad = {
      ...result,
      dailyResults: result.dailyResults.slice(0, 10),
    };
    expect(() => assertCalculationResultExportable(bad)).toThrow(CalculationResultNotExportableError);
  });
});
