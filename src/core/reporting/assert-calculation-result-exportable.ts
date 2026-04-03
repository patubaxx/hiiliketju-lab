import type { CalculationResult } from "@/core/domain/result";
import { SCENARIO_PERIOD_DAYS } from "@/core/domain/temporal";

/** Thrown when a value is not structurally safe to map into export workbooks/reports. */
export class CalculationResultNotExportableError extends Error {
  override readonly name = "CalculationResultNotExportableError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * Guards export mappers against malformed or truncated canonical results.
 * Does not validate business correctness beyond structural coherence required for tabular export.
 */
export function assertCalculationResultExportable(result: CalculationResult): void {
  if (!Array.isArray(result.warnings)) {
    throw new CalculationResultNotExportableError("Export requires warnings to be an array");
  }
  for (const w of result.warnings) {
    if (typeof w !== "string") {
      throw new CalculationResultNotExportableError("Export requires warnings to be raw strings only");
    }
  }
  const n = result.dailyResults.length;
  if (n !== SCENARIO_PERIOD_DAYS) {
    throw new CalculationResultNotExportableError(
      `Export requires dailyResults.length === ${SCENARIO_PERIOD_DAYS}, got ${n}`,
    );
  }
  if (result.resolvedDailyCo2.length !== SCENARIO_PERIOD_DAYS) {
    throw new CalculationResultNotExportableError(
      `Export requires resolvedDailyCo2.length === ${SCENARIO_PERIOD_DAYS}`,
    );
  }
  if (result.resolvedDailyElectricityPrice.length !== SCENARIO_PERIOD_DAYS) {
    throw new CalculationResultNotExportableError(
      `Export requires resolvedDailyElectricityPrice.length === ${SCENARIO_PERIOD_DAYS}`,
    );
  }
  if (result.monthlySummary.length !== 12) {
    throw new CalculationResultNotExportableError("Export requires twelve monthlySummary rows");
  }
}
