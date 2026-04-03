import type { ProcessAssumptionsInput } from "@/core/domain/assumptions";

/**
 * SEC policy (MVP): `electrolyzerSpecificEnergyConsumptionMwhPerKgH2` is **authoritative** for
 * electricity consumption formulas. The kWh companion exists for human readability and traceability.
 *
 * If both numeric values disagree beyond `toleranceMwhPerKgH2`, we **still use the MWh value** for
 * calculations but emit a **deterministic warning** so UI/exports can surface the inconsistency.
 * This avoids silently picking an arbitrary blend while keeping the engine runnable for sensitivity work.
 */
const DEFAULT_TOLERANCE_MWH_PER_KG_H2 = 1e-9;

export type SecResolution = {
  readonly electrolyzerSecMwhPerKgH2: number;
  readonly warnings: readonly string[];
};

export function resolveElectrolyzerSecMwhPerKgH2(
  process: ProcessAssumptionsInput,
  toleranceMwhPerKgH2: number = DEFAULT_TOLERANCE_MWH_PER_KG_H2,
): SecResolution {
  const kwh = process.electrolyzerSpecificEnergyConsumptionKwhPerKgH2.value;
  const mwh = process.electrolyzerSpecificEnergyConsumptionMwhPerKgH2.value;
  if (!Number.isFinite(kwh) || !Number.isFinite(mwh) || kwh < 0 || mwh < 0) {
    throw new RangeError(
      "Electrolyzer SEC values must be finite and non-negative (kWh/kg_H2 and MWh/kg_H2).",
    );
  }
  const impliedMwh = kwh / 1000;
  const delta = Math.abs(mwh - impliedMwh);
  if (delta > toleranceMwhPerKgH2) {
    return {
      electrolyzerSecMwhPerKgH2: mwh,
      warnings: [
        `Electrolyzer SEC inconsistency: MWh/kg_H2 (${mwh}) does not match kWh/kg_H2/1000 (${impliedMwh}); MVP core uses MWh/kg_H2 as authoritative.`,
      ],
    };
  }
  return { electrolyzerSecMwhPerKgH2: mwh, warnings: [] };
}
