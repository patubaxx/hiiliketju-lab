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

function addDailyToSums(sums: ReturnType<typeof emptyMonthSums>, row: DailyResult): void {
  sums.availableCO2Kg += row.availableCO2Kg;
  sums.usableCO2Kg += row.usableCO2Kg;
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

  const buckets: ReturnType<typeof emptyMonthSums>[] = Array.from({ length: 12 }, () => emptyMonthSums());

  for (const row of dailyResults) {
    const m = monthIndexForDayIndex(row.dayIndex);
    addDailyToSums(buckets[m]!, row);
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
    });
  }
  return out;
}

function sumDailyResults(dailyResults: readonly DailyResult[]): ReturnType<typeof emptyMonthSums> {
  const totals = emptyMonthSums();
  for (const row of dailyResults) {
    addDailyToSums(totals, row);
  }
  return totals;
}

/**
 * Annual KPIs from daily rows (spec F-013–F-018).
 */
export function aggregateAnnualFromDaily(dailyResults: readonly DailyResult[]): ScenarioSummary {
  const t = sumDailyResults(dailyResults);
  const annualMethaneProducedTons = t.methaneProducedKg / 1000;
  const annualCO2AvailableKg = t.availableCO2Kg;
  const annualCO2UtilizedKg = t.usableCO2Kg;
  const co2RecyclingRatePct =
    annualCO2AvailableKg > 0 ? (annualCO2UtilizedKg / annualCO2AvailableKg) * 100 : null;

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
  };
}
