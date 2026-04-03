import { describe, expect, it } from "vitest";

import {
  WARNING_LITERATURE_ESTIMATED_PROCESS_DEFAULTS,
  calculateScenario,
} from "@/core/calculation/calculate-scenario";
import { parseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

import { assertCalculationResultShape } from "./helpers/assert-golden-scenario";

const confirmed = {
  assumptionSource: "customer_provided" as const,
  assumptionStatus: "confirmed" as const,
};

function minimalScenarioRaw(overrides?: Record<string, unknown>) {
  return {
    scenarioName: "Contract test",
    periodDays: 365,
    co2: {
      annualAmountKtPerYear: 0.365,
      utilizationRatePct: 100,
      availability: { mode: "flat_annual" as const },
    },
    electricity: { mode: "constant" as const, priceEurPerMwh: 10 },
    economics: {
      methanePriceEurPerTch4: 100,
      hydrogenPriceEurPerKg: 2,
      otherOpexEurPerYear: 0,
      includeCapex: false,
    },
    assumptionsMeta: { assumptionsVersion: "contract_test" },
    process: {},
    ...overrides,
  };
}

/** Every `AssumptionValue` inspected by `literatureEstimatedProcessWarning`, customer-confirmed. */
function allProcessAssumptionsCustomerConfirmed() {
  return {
    stoichiometricHydrogenDemandFactorKgH2PerKgCo2: { value: 0.1832, assumptionMeta: confirmed },
    stoichiometricMethaneYieldFactorKgCh4PerKgCo2: { value: 0.3645, assumptionMeta: confirmed },
    electrolyzerSpecificEnergyConsumptionKwhPerKgH2: { value: 54, assumptionMeta: confirmed },
    electrolyzerSpecificEnergyConsumptionMwhPerKgH2: { value: 0.054, assumptionMeta: confirmed },
    plantAvailabilityPct: { value: 100, assumptionMeta: confirmed },
    processEfficiencyPct: { value: 100, assumptionMeta: confirmed },
  };
}

describe("CalculationResult contract (result.ts)", () => {
  it("exposes canonical top-level keys including annualSummary and warnings", () => {
    const r = calculateScenario(parseScenarioInput(minimalScenarioRaw()));
    assertCalculationResultShape(r);
    expect(r.input).toBeDefined();
    expect(typeof r.annualSummary.annualTotalCostEur).toBe("number");
  });

  it("keeps CAPEX at zero on annualSummary when includeCapex is false", () => {
    const r = calculateScenario(parseScenarioInput(minimalScenarioRaw()));
    expect(r.annualSummary.annualCapexCostEur).toBe(0);
    expect(r.dailyResults.every((d) => d.allocatedCapexCostEur === 0)).toBe(true);
  });

  it("reflects non-zero annualCapexCostEur when CAPEX is enabled", () => {
    const r = calculateScenario(
      parseScenarioInput(
        minimalScenarioRaw({
          economics: {
            methanePriceEurPerTch4: 100,
            hydrogenPriceEurPerKg: 2,
            otherOpexEurPerYear: 0,
            includeCapex: true,
            electrolyzerCapexEur: 365_000,
            methanationCapexEur: 0,
            capexLifetimeYears: 1,
          },
        }),
      ),
    );
    expect(r.annualSummary.annualCapexCostEur).toBeGreaterThan(0);
    expect(r.annualSummary.annualCO2UtilizedKg).toBeLessThanOrEqual(r.annualSummary.annualCO2AvailableKg);
  });

  it("returns a deterministic result for identical parsed input", () => {
    const input = parseScenarioInput(minimalScenarioRaw());
    const a = calculateScenario(input);
    const b = calculateScenario(input);
    expect(a.dailyResults.map((d) => d.totalCostEur)).toEqual(b.dailyResults.map((d) => d.totalCostEur));
    expect(a.warnings).toEqual(b.warnings);
  });

  it("preserves the full input snapshot on the result (including scenario-level assumptionsMeta)", () => {
    const input = parseScenarioInput(
      minimalScenarioRaw({
        assumptionsMeta: { assumptionsVersion: "v_snapshot", notes: "scenario-level only" },
      }),
    );
    const r = calculateScenario(input);
    expect(r.input).toBe(input);
    expect(r.input.assumptionsMeta.assumptionsVersion).toBe("v_snapshot");
    expect(r.input.assumptionsMeta.notes).toBe("scenario-level only");
    expect(r.input.process.stoichiometricHydrogenDemandFactorKgH2PerKgCo2.assumptionMeta).toHaveProperty(
      "assumptionSource",
    );
  });

  it("does not emit the literature umbrella warning when every tracked process assumption is customer-confirmed", () => {
    const r = calculateScenario(
      parseScenarioInput(
        minimalScenarioRaw({
          process: allProcessAssumptionsCustomerConfirmed(),
        }),
      ),
    );
    expect(r.warnings).not.toContain(WARNING_LITERATURE_ESTIMATED_PROCESS_DEFAULTS);
  });

  it("keeps plantAvailabilityPct and processEfficiencyPct metadata-bearing on the snapshot", () => {
    const input = parseScenarioInput(minimalScenarioRaw());
    expect(input.process.plantAvailabilityPct.assumptionMeta.assumptionSource).toBe("literature_based");
    expect(input.process.processEfficiencyPct.assumptionMeta.assumptionSource).toBe("literature_based");
  });

  it("does not change chemical or cost outputs when only plantAvailabilityPct value changes (inactive modifier)", () => {
    const base = minimalScenarioRaw({
      process: {
        ...allProcessAssumptionsCustomerConfirmed(),
        plantAvailabilityPct: { value: 100, assumptionMeta: confirmed },
      },
    });
    const variant = {
      ...base,
      process: {
        ...allProcessAssumptionsCustomerConfirmed(),
        plantAvailabilityPct: { value: 42, assumptionMeta: confirmed },
      },
    };
    const a = calculateScenario(parseScenarioInput(base));
    const b = calculateScenario(parseScenarioInput(variant));
    expect(a.annualSummary.annualMethaneProducedTons).toBeCloseTo(b.annualSummary.annualMethaneProducedTons, 10);
    expect(a.annualSummary.annualHydrogenNeededKg).toBeCloseTo(b.annualSummary.annualHydrogenNeededKg, 10);
    expect(a.annualSummary.annualElectricityConsumedMwh).toBeCloseTo(
      b.annualSummary.annualElectricityConsumedMwh,
      10,
    );
    expect(a.annualSummary.annualTotalCostEur).toBeCloseTo(b.annualSummary.annualTotalCostEur, 6);
  });
});
