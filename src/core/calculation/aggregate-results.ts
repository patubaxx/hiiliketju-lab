/**
 * Roll-ups from canonical `DailyResult[]`: monthly buckets by calendar month, annual KPIs for summaries and exports.
 * All totals are simple sums over daily rows unless noted on `ScenarioSummary` (e.g. ratio/price fields use nulls).
 */
import type { DailyResult, MonthlySummary, ScenarioSummary } from "@/core/domain/result";
import {
  MONTH_START_DAY_INDEX,
  NON_LEAP_MONTH_DAYS,
  SCENARIO_PERIOD_DAYS,
  monthIndexForDayIndex,
} from "@/core/domain/temporal";

function emptyMonthSums() {
  return {
    availableCO2Kg: 0,
    usableCO2Kg: 0,
    freeCo2UsedKg: 0,
    purchasedCo2Kg: 0,
    co2PurchaseCostEur: 0,
    hydrogenNeededKg: 0,
    methaneProducedKg: 0,
    electricityConsumedMwh: 0,
    electricityCostEur: 0,
    variableCostEur: 0,
    allocatedCapexCostEur: 0,
    totalCostEur: 0,
    methaneRevenueEur: 0,
    hydrogenAlternativeRevenueEur: 0,
  };
}

type MutableSums = ReturnType<typeof emptyMonthSums>;

function addDailyToSums(sums: MutableSums, row: DailyResult): void {
  sums.availableCO2Kg += row.availableCO2Kg;
  sums.usableCO2Kg += row.usableCO2Kg;
  sums.freeCo2UsedKg += row.freeCo2UsedKg;
  sums.purchasedCo2Kg += row.purchasedCo2Kg;
  sums.co2PurchaseCostEur += row.co2PurchaseCostEur;
  sums.hydrogenNeededKg += row.hydrogenNeededKg;
  sums.methaneProducedKg += row.methaneProducedKg;
  sums.electricityConsumedMwh += row.electricityConsumedMwh;
  sums.electricityCostEur += row.electricityCostEur;
  sums.variableCostEur += row.variableCostEur;
  sums.allocatedCapexCostEur += row.allocatedCapexCostEur;
  sums.totalCostEur += row.totalCostEur;
  sums.methaneRevenueEur += row.methaneRevenueEur;
  sums.hydrogenAlternativeRevenueEur += row.hydrogenAlternativeRevenueEur;
}

/**
 * Calendar months in order (0 = January), aggregating all numeric `DailyResult` fields.
 */
export function aggregateMonthlyFromDaily(dailyResults: readonly DailyResult[]): readonly MonthlySummary[] {
  if (dailyResults.length !== SCENARIO_PERIOD_DAYS) {
    throw new RangeError(`Expected ${SCENARIO_PERIOD_DAYS} daily rows`);
  }

  const buckets: MutableSums[] = Array.from({ length: 12 }, () => emptyMonthSums());
  const h2BindingDays = Array.from({ length: 12 }, () => 0);
  const ch4BindingDays = Array.from({ length: 12 }, () => 0);

  for (const row of dailyResults) {
    const m = monthIndexForDayIndex(row.dayIndex);
    addDailyToSums(buckets[m]!, row);
    if (row.h2CapacityBinding) h2BindingDays[m]!++;
    if (row.ch4CapacityBinding) ch4BindingDays[m]!++;
  }

  const out: MonthlySummary[] = [];
  for (let m = 0; m < 12; m++) {
    const firstDayIndex = MONTH_START_DAY_INDEX[m]!;
    const lastDayIndex = firstDayIndex + NON_LEAP_MONTH_DAYS[m]! - 1;
    out.push({
      monthIndex: m,
      firstDayIndex,
      lastDayIndex,
      sums: buckets[m]!,
      h2CapacityBindingDays: h2BindingDays[m]!,
      ch4CapacityBindingDays: ch4BindingDays[m]!,
    });
  }
  return out;
}

function sumDailyResults(dailyResults: readonly DailyResult[]): {
  readonly sums: MutableSums;
  readonly h2BindingDays: number;
  readonly ch4BindingDays: number;
} {
  const totals = emptyMonthSums();
  let h2BindingDays = 0;
  let ch4BindingDays = 0;
  for (const row of dailyResults) {
    addDailyToSums(totals, row);
    if (row.h2CapacityBinding) h2BindingDays++;
    if (row.ch4CapacityBinding) ch4BindingDays++;
  }
  return { sums: totals, h2BindingDays, ch4BindingDays };
}

/**
 * Annual KPIs from daily rows: sums mass and energy, then derives business metrics.
 *
 * Null semantics (avoid misleading infinities or undefined ratios):
 * - `co2RecyclingRatePct`: null when no CO₂ was available (utilized/available undefined). Reflects only
 *   the biogenic free-stream pathway: `annualFreeCo2UsedKg / annualCo2AvailableKg × 100`. Purchased CO₂
 *   is *not* counted toward biogenic recycling.
 * - `breakEvenMethanePriceEurPerTon`, profitability methane prices: null when no methane was produced (EUR/t would diverge).
 * `deltaVsHydrogenSaleEur` is always a number (can be negative) from summed daily revenues.
 */
export function aggregateAnnualFromDaily(dailyResults: readonly DailyResult[]): ScenarioSummary {
  const { sums: t, h2BindingDays, ch4BindingDays } = sumDailyResults(dailyResults);
  const annualMethaneProducedTons = t.methaneProducedKg / 1000;
  const annualCO2AvailableKg = t.availableCO2Kg;
  const annualCO2UtilizedKg = t.usableCO2Kg;
  const annualFreeCo2UsedKg = t.freeCo2UsedKg;
  const annualPurchasedCo2Kg = t.purchasedCo2Kg;
  const annualCo2PurchaseCostEur = t.co2PurchaseCostEur;
  const co2RecyclingRatePct =
    annualCO2AvailableKg > 0 ? (annualFreeCo2UsedKg / annualCO2AvailableKg) * 100 : null;

  const annualTotalCostEur = t.totalCostEur;
  const breakEvenMethanePriceEurPerTon =
    annualMethaneProducedTons > 0 ? annualTotalCostEur / annualMethaneProducedTons : null;
  const methanePriceAt10PctProfitabilityEurPerTon =
    annualMethaneProducedTons > 0 ? (annualTotalCostEur * 1.1) / annualMethaneProducedTons : null;
  const methanePriceAt30PctProfitabilityEurPerTon =
    annualMethaneProducedTons > 0 ? (annualTotalCostEur * 1.3) / annualMethaneProducedTons : null;

  return {
    annualCO2AvailableKg,
    annualCO2UtilizedKg,
    annualFreeCo2UsedKg,
    annualPurchasedCo2Kg,
    annualCo2PurchaseCostEur,
    co2RecyclingRatePct,
    annualMethaneProducedTons,
    annualHydrogenNeededKg: t.hydrogenNeededKg,
    annualElectricityConsumedMwh: t.electricityConsumedMwh,
    annualVariableCostEur: t.variableCostEur,
    annualCapexCostEur: t.allocatedCapexCostEur,
    annualTotalCostEur,
    annualMethaneRevenueEur: t.methaneRevenueEur,
    hydrogenSalesAlternativeRevenueEur: t.hydrogenAlternativeRevenueEur,
    breakEvenMethanePriceEurPerTon,
    methanePriceAt10PctProfitabilityEurPerTon,
    methanePriceAt30PctProfitabilityEurPerTon,
    deltaVsHydrogenSaleEur: t.methaneRevenueEur - t.hydrogenAlternativeRevenueEur,
    h2CapacityBindingDays: h2BindingDays,
    ch4CapacityBindingDays: ch4BindingDays,
  };
}
