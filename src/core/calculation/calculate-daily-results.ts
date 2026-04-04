/**
 * Daily-first engine: one `DailyResult` per MVP day from already-harmonized CO₂ and electricity series.
 * Exported per-day helpers are pure unit transformations; they are the single place for these stoichiometric
 * and cost formulas (UI and exports must not duplicate them).
 */
import type { DailyResult } from "@/core/domain/result";
import type { EconomicsInput } from "@/core/domain/scenario";
import type { ProcessAssumptionsInput } from "@/core/domain/assumptions";
import type { ResolvedDailyCo2Point, ResolvedDailyElectricityPricePoint } from "@/core/domain/temporal";
import { SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";

export function usableCo2KgPerDay(availableCo2Kg: number, utilizationRatePct: number): number {
  return availableCo2Kg * (utilizationRatePct / 100);
}

export function hydrogenNeededKgPerDay(
  usableCo2Kg: number,
  stoichiometricHydrogenDemandFactorKgH2PerKgCo2: number,
): number {
  return usableCo2Kg * stoichiometricHydrogenDemandFactorKgH2PerKgCo2;
}

export function methaneProducedKgPerDay(
  usableCo2Kg: number,
  stoichiometricMethaneYieldFactorKgCh4PerKgCo2: number,
): number {
  return usableCo2Kg * stoichiometricMethaneYieldFactorKgCh4PerKgCo2;
}

export function electricityConsumedMwhPerDay(
  hydrogenNeededKg: number,
  electrolyzerSecMwhPerKgH2: number,
): number {
  return hydrogenNeededKg * electrolyzerSecMwhPerKgH2;
}

export function electricityCostEurPerDay(
  electricityConsumedMwh: number,
  priceEurPerMwh: number,
): number {
  return electricityConsumedMwh * priceEurPerMwh;
}

export function otherOpexAllocatedEurPerDay(otherOpexEurPerYear: number): number {
  return otherOpexEurPerYear / SCENARIO_PERIOD_DAYS;
}

export function variableCostEurPerDay(
  electricityCostEur: number,
  otherOpexAllocatedEur: number,
): number {
  return electricityCostEur + otherOpexAllocatedEur;
}

export function totalCostEurPerDay(
  variableCostEur: number,
  allocatedCapexCostEur: number,
): number {
  return variableCostEur + allocatedCapexCostEur;
}

export function methaneRevenueEurPerDay(
  methaneProducedKg: number,
  methanePriceEurPerTch4: number,
): number {
  return (methaneProducedKg / 1000) * methanePriceEurPerTch4;
}

export function hydrogenAlternativeRevenueEurPerDay(
  hydrogenNeededKg: number,
  hydrogenPriceEurPerKg: number,
): number {
  return hydrogenNeededKg * hydrogenPriceEurPerKg;
}

export type DailyCalculationParams = {
  readonly resolvedCo2: readonly ResolvedDailyCo2Point[];
  readonly resolvedElectricityPrice: readonly ResolvedDailyElectricityPricePoint[];
  readonly economics: EconomicsInput;
  readonly process: ProcessAssumptionsInput;
  readonly electrolyzerSecMwhPerKgH2: number;
  readonly dailyAllocatedCapexEur: number;
  readonly utilizationRatePct: number;
};

/**
 * One row per MVP day; assumes resolved series are aligned on `dayIndex` 0..364.
 */
export function calculateDailyResults(params: DailyCalculationParams): readonly DailyResult[] {
  const {
    resolvedCo2,
    resolvedElectricityPrice,
    economics,
    process,
    electrolyzerSecMwhPerKgH2,
    dailyAllocatedCapexEur,
    utilizationRatePct,
  } = params;

  if (resolvedCo2.length !== SCENARIO_PERIOD_DAYS || resolvedElectricityPrice.length !== SCENARIO_PERIOD_DAYS) {
    throw new RangeError("Resolved CO₂ and electricity series must each have 365 points");
  }

  const h2Factor = process.stoichiometricHydrogenDemandFactorKgH2PerKgCo2.value;
  const ch4Factor = process.stoichiometricMethaneYieldFactorKgCh4PerKgCo2.value;
  /*
   * `plantAvailabilityPct` and `processEfficiencyPct` remain on `process` with full `AssumptionValue` metadata so
   * the UI and exports can show source/status/notes. They are intentionally not multiplied into the daily mass
   * or energy balance in the current MVP (defaults are neutral 100%). Changing that requires an explicit product
   * decision and must stay consistent with harmonization and reporting, not a silent local tweak.
   */

  const out: DailyResult[] = [];
  for (let d = 0; d < SCENARIO_PERIOD_DAYS; d++) {
    const co2Point = resolvedCo2[d]!;
    const pricePoint = resolvedElectricityPrice[d]!;
    if (co2Point.dayIndex !== d || pricePoint.dayIndex !== d) {
      throw new RangeError(`Misaligned dayIndex at slot ${d}`);
    }

    const availableCO2Kg = co2Point.availableCO2Kg;
    const usableCO2Kg = usableCo2KgPerDay(availableCO2Kg, utilizationRatePct);
    const hydrogenNeededKg = hydrogenNeededKgPerDay(usableCO2Kg, h2Factor);
    const methaneProducedKg = methaneProducedKgPerDay(usableCO2Kg, ch4Factor);
    const electricityConsumedMwh = electricityConsumedMwhPerDay(hydrogenNeededKg, electrolyzerSecMwhPerKgH2);
    const electricityCostEur = electricityCostEurPerDay(
      electricityConsumedMwh,
      pricePoint.electricityPriceEurPerMWh,
    );
    const otherOx = otherOpexAllocatedEurPerDay(economics.otherOpexEurPerYear);
    const variableCostEur = variableCostEurPerDay(electricityCostEur, otherOx);
    const totalCostEur = totalCostEurPerDay(variableCostEur, dailyAllocatedCapexEur);
    const methaneRevenueEur = methaneRevenueEurPerDay(
      methaneProducedKg,
      economics.methanePriceEurPerTch4,
    );
    const hydrogenAlternativeRevenueEur = hydrogenAlternativeRevenueEurPerDay(
      hydrogenNeededKg,
      economics.hydrogenPriceEurPerKg,
    );

    out.push({
      dayIndex: d,
      dateLabel: co2Point.dateLabel,
      availableCO2Kg,
      usableCO2Kg,
      hydrogenNeededKg,
      methaneProducedKg,
      electricityConsumedMwh,
      electricityCostEur,
      variableCostEur,
      allocatedCapexCostEur: dailyAllocatedCapexEur,
      totalCostEur,
      methaneRevenueEur,
      hydrogenAlternativeRevenueEur,
    });
  }
  return out;
}
