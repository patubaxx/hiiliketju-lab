/**
 * MVP calculation orchestration entry: one validated `ScenarioInput` in, one `CalculationResult` out.
 *
 * Pipeline order:
 * 1. Resolve electrolyzer SEC (MWh/kg_H2 authoritative; may append kWh/MWh consistency warnings).
 * 2. Optionally append a single literature-based process-defaults warning (assumption transparency).
 * 3. Harmonize CO₂ and electricity to daily series (365 rows each).
 * 4. Allocate optional CAPEX to a flat daily EUR amount.
 * 5. Run the daily row engine, then monthly and annual aggregations.
 *
 * Warnings are non-fatal strings only; they must not change numeric outputs. UI and exports surface the same
 * `warnings` array from this result (exports recompute on the server and must not trust client-sent outputs).
 */
import { allocateCapex } from "@/core/calculation/allocate-capex";
import { aggregateAnnualFromDaily, aggregateMonthlyFromDaily } from "@/core/calculation/aggregate-results";
import { calculateDailyResults } from "@/core/calculation/calculate-daily-results";
import { resolveCo2Series } from "@/core/calculation/resolve-co2-series";
import { resolveElectricityPriceSeries } from "@/core/calculation/resolve-electricity-price-series";
import { resolveElectrolyzerSecMwhPerKgH2 } from "@/core/calculation/validate-sec-consistency";
import type { AssumptionValue, ProcessAssumptionsInput } from "@/core/domain/assumptions";
import type { CalculationResult } from "@/core/domain/result";
import type { ScenarioInput } from "@/core/domain/scenario";

/** Single soft warning when any active process assumption is literature-based and not customer-confirmed. */
export const WARNING_LITERATURE_ESTIMATED_PROCESS_DEFAULTS =
  "Literature-based estimated process defaults are in use; confirm or replace with project-specific data where applicable.";

function isLiteratureEstimated(av: AssumptionValue<number>): boolean {
  const m = av.assumptionMeta;
  return (
    m.assumptionSource === "literature_based" &&
    (m.assumptionStatus === "estimated" || m.assumptionStatus === "pending_customer_confirmation")
  );
}

/**
 * Returns one umbrella warning if merged process inputs still include literature-based estimated values
 * (stoichiometry, SEC, plant availability, process efficiency, etc.).
 */
export function literatureEstimatedProcessWarning(process: ProcessAssumptionsInput): string | undefined {
  const candidates: readonly AssumptionValue<number>[] = [
    process.stoichiometricHydrogenDemandFactorKgH2PerKgCo2,
    process.stoichiometricMethaneYieldFactorKgCh4PerKgCo2,
    process.electrolyzerSpecificEnergyConsumptionKwhPerKgH2,
    process.electrolyzerSpecificEnergyConsumptionMwhPerKgH2,
    process.plantAvailabilityPct,
    process.processEfficiencyPct,
  ];
  return candidates.some(isLiteratureEstimated) ? WARNING_LITERATURE_ESTIMATED_PROCESS_DEFAULTS : undefined;
}

/** End-to-end MVP scenario calculation (see file-level doc for pipeline and warning sources). */
export function calculateScenario(input: ScenarioInput): CalculationResult {
  const warnings: string[] = [];

  const sec = resolveElectrolyzerSecMwhPerKgH2(input.process);
  warnings.push(...sec.warnings);

  const literatureWarning = literatureEstimatedProcessWarning(input.process);
  if (literatureWarning !== undefined) {
    warnings.push(literatureWarning);
  }

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
