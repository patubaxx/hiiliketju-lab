import { describe, expect, it } from "vitest";

import { calculateScenario } from "@/core/calculation/calculate-scenario";
import { buildScenarioExcelExportModel } from "@/core/reporting/build-export-model";
import { mergeProcessAssumptionsInput } from "@/core/domain/scenario";
import { buildScenarioPayload } from "@/features/scenario/input-ui/build-scenario-payload";
import { createInitialFormState } from "@/features/scenario/input-ui/form-state";
import { parseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

function baseScenarioRaw() {
  return {
    scenarioName: "wp17",
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
    assumptionsMeta: { assumptionsVersion: "wp17_test" },
    process: {},
  };
}

describe("WP17 – advanced assumptions payload/provenance", () => {
  it("keeps untouched process fields omitted so canonical merge provides defaults", () => {
    const state = createInitialFormState();
    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const payload = built.payload as { process: Record<string, unknown> };
    expect(payload.process).toEqual({});
  });

  it("maps single SEC override (kWh) and derives SEC MWh for canonical consistency", () => {
    const state = createInitialFormState();
    state.process.electrolyzerSpecificEnergyConsumptionKwhPerKgH2.override = true;
    state.process.electrolyzerSpecificEnergyConsumptionKwhPerKgH2.value = "60";
    state.process.electrolyzerSpecificEnergyConsumptionKwhPerKgH2.assumptionSource = "customer_provided";
    state.process.electrolyzerSpecificEnergyConsumptionKwhPerKgH2.assumptionStatus = "confirmed";
    state.process.electrolyzerSpecificEnergyConsumptionMwhPerKgH2.override = false;

    const built = buildScenarioPayload(state);
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const payload = built.payload as {
      process: {
        electrolyzerSpecificEnergyConsumptionKwhPerKgH2: {
          value: number;
          assumptionMeta: { assumptionSource: string; assumptionStatus: string };
        };
        electrolyzerSpecificEnergyConsumptionMwhPerKgH2: {
          value: number;
          assumptionMeta: { assumptionSource: string; assumptionStatus: string };
        };
      };
    };

    expect(payload.process.electrolyzerSpecificEnergyConsumptionKwhPerKgH2.value).toBe(60);
    expect(payload.process.electrolyzerSpecificEnergyConsumptionKwhPerKgH2.assumptionMeta.assumptionSource).toBe(
      "customer_provided",
    );
    expect(payload.process.electrolyzerSpecificEnergyConsumptionMwhPerKgH2.value).toBe(0.06);
    expect(payload.process.electrolyzerSpecificEnergyConsumptionMwhPerKgH2.assumptionMeta.assumptionSource).toBe(
      "derived",
    );
  });

  it("preserves provenance through merge, calculation result, and export mapping", () => {
    const merged = mergeProcessAssumptionsInput({
      stoichiometricHydrogenDemandFactorKgH2PerKgCo2: {
        value: 0.2,
        assumptionMeta: {
          assumptionSource: "customer_provided",
          assumptionStatus: "confirmed",
        },
      },
    });

    const parsed = parseScenarioInput({
      ...baseScenarioRaw(),
      process: merged,
    });
    const result = calculateScenario(parsed);
    const exportModel = buildScenarioExcelExportModel(result);

    expect(result.input.process.stoichiometricHydrogenDemandFactorKgH2PerKgCo2.assumptionMeta.assumptionSource).toBe(
      "customer_provided",
    );
    expect(result.input.process.stoichiometricMethaneYieldFactorKgCh4PerKgCo2.assumptionMeta.assumptionSource).toBe(
      "literature_based",
    );

    const stoichH2Export = exportModel.processAssumptions.find(
      (row) => row.fieldKey === "stoichiometricHydrogenDemandFactorKgH2PerKgCo2",
    );
    const stoichCh4Export = exportModel.processAssumptions.find(
      (row) => row.fieldKey === "stoichiometricMethaneYieldFactorKgCh4PerKgCo2",
    );

    expect(stoichH2Export?.assumptionSource).toBe("customer_provided");
    expect(stoichCh4Export?.assumptionSource).toBe("literature_based");
  });
});
