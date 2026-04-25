import type { ProcessAssumptionsInput } from "./assumptions";

/**
 * Process assumption keys the current engine actually uses (WP23 policy).
 * `plantAvailabilityPct` and `processEfficiencyPct` remain on `ProcessAssumptionsInput` for future use
 * but are not shown as active user-facing inputs or in user-facing result/export assumption summaries.
 */
export const USER_FACING_ACTIVE_PROCESS_ASSUMPTION_KEYS: readonly (keyof ProcessAssumptionsInput)[] = [
  "stoichiometricHydrogenDemandFactorKgH2PerKgCo2",
  "stoichiometricMethaneYieldFactorKgCh4PerKgCo2",
  "electrolyzerSpecificEnergyConsumptionKwhPerKgH2",
] as const;

/**
 * Assumption rows in results and Excel/PDF: active keys plus the derived **SEC (MWh)** value (not an Advanced input).
 */
export const USER_FACING_EXPORT_PROCESS_ASSUMPTION_KEYS: readonly (keyof ProcessAssumptionsInput)[] = [
  ...USER_FACING_ACTIVE_PROCESS_ASSUMPTION_KEYS,
  "electrolyzerSpecificEnergyConsumptionMwhPerKgH2",
] as const;

/** `true` for the three process fields shown in Advanced setup (excludes plant/process efficiency; excludes derived SEC MWh). */
export function isUserFacingActiveProcessAssumptionKey(key: keyof ProcessAssumptionsInput): boolean {
  return (USER_FACING_ACTIVE_PROCESS_ASSUMPTION_KEYS as readonly string[]).includes(key);
}
