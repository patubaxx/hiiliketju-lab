/**
 * Daily-first engine: one `DailyResult` per MVP day from already-harmonized CO₂ and electricity series.
 * Exported per-day helpers are pure unit transformations; they are the single place for these stoichiometric
 * and cost formulas (UI and exports must not duplicate them).
 *
 * WP28 additions (plant capacity caps + market CO₂ purchase):
 * - `effectiveMaxCo2KgPerDay` derives the daily CO₂ throughput ceiling from optional H₂ and CH₄ caps.
 * - `splitCo2SourcesForDay` decides how much free (biogenic side-stream) and purchased CO₂ feed the process,
 *   subject to the cap and the user's market-purchase setting.
 * - `co2PurchaseCostEurPerDay` adds the purchased-CO₂ cost into the daily variable-cost line.
 * Without caps and without purchase, the engine collapses to the pre-WP28 behavior.
 */
import type { DailyResult } from "@/core/domain/result";
import type {
  Co2MarketPurchaseInput,
  EconomicsInput,
  PlantCapacityInput,
} from "@/core/domain/scenario";
import type { ProcessAssumptionsInput } from "@/core/domain/assumptions";
import type { ResolvedDailyCo2Point, ResolvedDailyElectricityPricePoint } from "@/core/domain/temporal";
import { SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";

/**
 * Pre-WP28 helper: how much CO₂ the operator *intends* to recycle from the biogenic
 * side stream (before any plant cap or market purchase). Kept as a public helper for
 * readability and to preserve the original semantic name.
 */
export function intendedFreeCo2KgPerDay(availableCo2Kg: number, utilizationRatePct: number): number {
  return availableCo2Kg * (utilizationRatePct / 100);
}

/**
 * Backward-compatible alias of {@link intendedFreeCo2KgPerDay}. Pre-WP28 callers used this name to
 * mean "CO₂ fed to the process". After WP28 the actual feed (`usableCO2Kg` on a `DailyResult`) is
 * `freeCo2UsedKg + purchasedCo2Kg`, which is computed in the daily loop with caps and purchase
 * applied.
 */
export function usableCo2KgPerDay(availableCo2Kg: number, utilizationRatePct: number): number {
  return intendedFreeCo2KgPerDay(availableCo2Kg, utilizationRatePct);
}

/**
 * Effective daily CO₂ throughput ceiling derived from optional plant capacity caps.
 * Returns `Number.POSITIVE_INFINITY` when no caps are set (legacy behavior).
 *
 * The cap-from-H₂ side: producing `Q kg_CO2/day` requires `Q × h2Factor kg_H2/day`,
 * so the H₂ cap maps to `electrolyzerMaxH2KgPerDay / h2Factor` kg CO₂/day.
 * Similarly for CH₄ via `methanationMaxCh4KgPerDay / ch4Factor`.
 */
export function effectiveMaxCo2KgPerDay(
  caps: PlantCapacityInput | undefined,
  h2Factor: number,
  ch4Factor: number,
): {
  readonly maxCo2KgPerDay: number;
  readonly h2DerivedCapCo2KgPerDay: number;
  readonly ch4DerivedCapCo2KgPerDay: number;
} {
  let h2Co2 = Number.POSITIVE_INFINITY;
  let ch4Co2 = Number.POSITIVE_INFINITY;
  if (caps) {
    if (caps.electrolyzerMaxH2KgPerDay !== null && Number.isFinite(caps.electrolyzerMaxH2KgPerDay)) {
      h2Co2 = h2Factor > 0 ? caps.electrolyzerMaxH2KgPerDay / h2Factor : Number.POSITIVE_INFINITY;
    }
    if (
      caps.methanationMaxCh4KgPerDay !== null &&
      Number.isFinite(caps.methanationMaxCh4KgPerDay)
    ) {
      ch4Co2 = ch4Factor > 0 ? caps.methanationMaxCh4KgPerDay / ch4Factor : Number.POSITIVE_INFINITY;
    }
  }
  return {
    maxCo2KgPerDay: Math.min(h2Co2, ch4Co2),
    h2DerivedCapCo2KgPerDay: h2Co2,
    ch4DerivedCapCo2KgPerDay: ch4Co2,
  };
}

/**
 * Splits the day's CO₂ feed between biogenic free stream and market purchase.
 * - Free stream is consumed up to `intendedFreeCo2KgPerDay` (= available × util%) but never above the cap.
 * - If `marketPurchase` is enabled AND the cap is finite AND free feed is below the cap, market top-up fills the gap.
 *   Without finite caps, the "fill-to-what?" question is ambiguous and the engine purchases nothing.
 * - The same flag-based bottleneck reporting (h2CapacityBinding, ch4CapacityBinding) marks days where the
 *   process is operating *at* a cap (epsilon tolerance).
 */
export function splitCo2SourcesForDay(args: {
  readonly availableCo2Kg: number;
  readonly utilizationRatePct: number;
  readonly maxCo2KgPerDay: number;
  readonly h2DerivedCapCo2KgPerDay: number;
  readonly ch4DerivedCapCo2KgPerDay: number;
  readonly marketPurchase: Co2MarketPurchaseInput | undefined;
}): {
  readonly freeCo2UsedKg: number;
  readonly purchasedCo2Kg: number;
  readonly usableCo2Kg: number;
  readonly h2CapacityBinding: boolean;
  readonly ch4CapacityBinding: boolean;
} {
  const intendedFree = intendedFreeCo2KgPerDay(args.availableCo2Kg, args.utilizationRatePct);
  const cap = args.maxCo2KgPerDay;
  const freeCo2UsedKg = Math.min(intendedFree, cap);
  let purchasedCo2Kg = 0;

  if (
    args.marketPurchase &&
    args.marketPurchase.mode === "enabled" &&
    Number.isFinite(cap) &&
    freeCo2UsedKg < cap
  ) {
    purchasedCo2Kg = cap - freeCo2UsedKg;
  }

  const usableCo2Kg = freeCo2UsedKg + purchasedCo2Kg;

  // Tolerance epsilon: caps are user-entered scalars; usableCo2Kg is the result of
  // arithmetic on user inputs and stoichiometric factors. 1e-6 kg/day is well below
  // any meaningful operational resolution and avoids float-equality noise.
  const eps = 1e-6;
  const h2Binding =
    Number.isFinite(args.h2DerivedCapCo2KgPerDay) && usableCo2Kg >= args.h2DerivedCapCo2KgPerDay - eps;
  const ch4Binding =
    Number.isFinite(args.ch4DerivedCapCo2KgPerDay) && usableCo2Kg >= args.ch4DerivedCapCo2KgPerDay - eps;

  return {
    freeCo2UsedKg,
    purchasedCo2Kg,
    usableCo2Kg,
    h2CapacityBinding: h2Binding,
    ch4CapacityBinding: ch4Binding,
  };
}

/** Cost of purchased CO₂ for one day, EUR. Pure unit conversion (kg → t × EUR/t). */
export function co2PurchaseCostEurPerDay(
  purchasedCo2Kg: number,
  marketPurchase: Co2MarketPurchaseInput | undefined,
): number {
  if (!marketPurchase || marketPurchase.mode !== "enabled") return 0;
  return (purchasedCo2Kg / 1000) * marketPurchase.purchasePriceEurPerTco2;
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
  co2PurchaseCostEur: number = 0,
): number {
  return electricityCostEur + otherOpexAllocatedEur + co2PurchaseCostEur;
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
  /** Optional plant capacity caps. When omitted, plant is unbounded (legacy behavior). */
  readonly plantCapacity?: PlantCapacityInput;
  /** Optional market CO₂ purchase config. When omitted or `disabled`, no purchase happens. */
  readonly marketPurchase?: Co2MarketPurchaseInput;
};

/**
 * One row per MVP day; assumes resolved series are aligned on `dayIndex` 0..364.
 *
 * WP28: when `plantCapacity` and/or `marketPurchase` are present, the per-day CO₂ feed
 * is constrained by the equipment ceiling and (optionally) topped up from the market.
 * When both are absent, the loop produces identical numeric output to the pre-WP28
 * engine (`usableCO2Kg` collapses to `available × utilization%`).
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
    plantCapacity,
    marketPurchase,
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

  // Effective plant ceiling derived from optional caps (constant across days).
  const caps = effectiveMaxCo2KgPerDay(plantCapacity, h2Factor, ch4Factor);

  const out: DailyResult[] = [];
  for (let d = 0; d < SCENARIO_PERIOD_DAYS; d++) {
    const co2Point = resolvedCo2[d]!;
    const pricePoint = resolvedElectricityPrice[d]!;
    if (co2Point.dayIndex !== d || pricePoint.dayIndex !== d) {
      throw new RangeError(`Misaligned dayIndex at slot ${d}`);
    }

    const availableCO2Kg = co2Point.availableCO2Kg;

    // WP28 split: free vs purchased CO₂; bottleneck flags.
    const split = splitCo2SourcesForDay({
      availableCo2Kg: availableCO2Kg,
      utilizationRatePct,
      maxCo2KgPerDay: caps.maxCo2KgPerDay,
      h2DerivedCapCo2KgPerDay: caps.h2DerivedCapCo2KgPerDay,
      ch4DerivedCapCo2KgPerDay: caps.ch4DerivedCapCo2KgPerDay,
      marketPurchase,
    });

    const usableCO2Kg = split.usableCo2Kg;
    const hydrogenNeededKg = hydrogenNeededKgPerDay(usableCO2Kg, h2Factor);
    const methaneProducedKg = methaneProducedKgPerDay(usableCO2Kg, ch4Factor);
    const electricityConsumedMwh = electricityConsumedMwhPerDay(hydrogenNeededKg, electrolyzerSecMwhPerKgH2);
    const electricityCostEur = electricityCostEurPerDay(
      electricityConsumedMwh,
      pricePoint.electricityPriceEurPerMWh,
    );
    const otherOx = otherOpexAllocatedEurPerDay(economics.otherOpexEurPerYear);
    const co2PurchaseCostEur = co2PurchaseCostEurPerDay(split.purchasedCo2Kg, marketPurchase);
    const variableCostEur = variableCostEurPerDay(electricityCostEur, otherOx, co2PurchaseCostEur);
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
      freeCo2UsedKg: split.freeCo2UsedKg,
      purchasedCo2Kg: split.purchasedCo2Kg,
      co2PurchaseCostEur,
      h2CapacityBinding: split.h2CapacityBinding,
      ch4CapacityBinding: split.ch4CapacityBinding,
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
