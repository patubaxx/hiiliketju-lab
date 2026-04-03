import { allocateCapex } from "@/core/calculation/allocate-capex";
import { aggregateAnnualFromDaily, aggregateMonthlyFromDaily } from "@/core/calculation/aggregate-results";
import { calculateDailyResults } from "@/core/calculation/calculate-daily-results";
import { resolveCo2Series } from "@/core/calculation/resolve-co2-series";
import { resolveElectricityPriceSeries } from "@/core/calculation/resolve-electricity-price-series";
import { resolveElectrolyzerSecMwhPerKgH2 } from "@/core/calculation/validate-sec-consistency";
import type { CalculationResult } from "@/core/domain/result";
import type { ScenarioInput } from "@/core/domain/scenario";

/**
 * End-to-end MVP scenario calculation: harmonize inputs, daily engine, aggregations.
 */
export function calculateScenario(input: ScenarioInput): CalculationResult {
  const warnings: string[] = [];

  const sec = resolveElectrolyzerSecMwhPerKgH2(input.process);
  warnings.push(...sec.warnings);

  const resolvedDailyCo2 = resolveCo2Series(input.co2);
  const resolvedDailyElectricityPrice = resolveElectricityPriceSeries(input.electricity);
  const capex = allocateCapex(input.economics);

  const dailyResults = calculateDailyResults({
    resolvedCo2: resolvedDailyCo2,
    resolvedElectricityPrice: resolvedDailyElectricityPrice,
    economics: input.economics,
    process: input.process,
    electrolyzerSecMwhPerKgH2: sec.electrolyzerSecMwhPerKgH2,
    dailyAllocatedCapexEur: capex.dailyAllocatedCapexEur,
    utilizationRatePct: input.co2.utilizationRatePct,
  });

  const monthlySummary = aggregateMonthlyFromDaily(dailyResults);
  const annualSummary = aggregateAnnualFromDaily(dailyResults);

  return {
    input,
    resolvedDailyCo2,
    resolvedDailyElectricityPrice,
    dailyResults,
    monthlySummary,
    annualSummary,
    warnings,
  };
}
