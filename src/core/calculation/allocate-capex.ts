/**
 * Optional CAPEX: simple lifetime straight-line allocation to EUR/year then EUR/day (no discounting, no annuity).
 */
import type { EconomicsInput } from "@/core/domain/scenario";
import { SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";

export type CapexAllocation = {
  readonly annualCapexCostEur: number;
  readonly dailyAllocatedCapexEur: number;
};

/**
 * MVP CAPEX: simple lifetime allocation (no annuity, no discounting).
 */
export function allocateCapex(economics: EconomicsInput): CapexAllocation {
  if (!economics.includeCapex) {
    return { annualCapexCostEur: 0, dailyAllocatedCapexEur: 0 };
  }
  const life = economics.capexLifetimeYears;
  if (life === undefined || !Number.isFinite(life) || life <= 0) {
    throw new RangeError("capexLifetimeYears must be defined and > 0 when includeCapex is true");
  }
  const ez = economics.electrolyzerCapexEur ?? 0;
  const me = economics.methanationCapexEur ?? 0;
  if (!Number.isFinite(ez) || !Number.isFinite(me) || ez < 0 || me < 0) {
    throw new RangeError("CAPEX amounts must be finite and non-negative when includeCapex is true");
  }
  const annualCapexCostEur = (ez + me) / life;
  return {
    annualCapexCostEur,
    dailyAllocatedCapexEur: annualCapexCostEur / SCENARIO_PERIOD_DAYS,
  };
}
