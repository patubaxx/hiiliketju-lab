import { describe, expect, it } from "vitest";

import { parseExportScenarioPostBody } from "@/app/api/export/parse-export-body";

import { minimalExportScenarioWire } from "./fixtures/export-minimal-scenario";

describe("parseExportScenarioPostBody", () => {
  it("rejects invalid JSON", () => {
    const r = parseExportScenarioPostBody("{");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(400);
      expect(r.payload.code).toBe("invalid_json");
    }
  });

  it("rejects missing scenario", () => {
    const r = parseExportScenarioPostBody("{}");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.payload.code).toBe("missing_scenario");
    }
  });

  it("rejects Zod validation failures", () => {
    const r = parseExportScenarioPostBody(JSON.stringify({ scenario: { scenarioName: "" } }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.payload.code).toBe("validation_failed");
      expect(r.payload.issues).toBeDefined();
    }
  });

  it("accepts a minimal valid scenario", () => {
    const r = parseExportScenarioPostBody(JSON.stringify({ scenario: minimalExportScenarioWire() }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.input.scenarioName).toBe("API export test");
      expect(r.input.process.stoichiometricHydrogenDemandFactorKgH2PerKgCo2.value).toBeDefined();
    }
  });

  it("ignores extra top-level payload objects and still trusts only scenario", () => {
    const scenario = minimalExportScenarioWire();
    const r = parseExportScenarioPostBody(
      JSON.stringify({
        scenario,
        calculationResult: {
          annualSummary: { annualTotalCostEur: 999999999 },
        },
      }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.input.scenarioName).toBe(scenario.scenarioName);
      expect(r.input.economics.methanePriceEurPerTch4).toBe(scenario.economics.methanePriceEurPerTch4);
    }
  });
});
