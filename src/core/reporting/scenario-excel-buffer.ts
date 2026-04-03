import type { CalculationResult } from "@/core/domain/result";

import { buildScenarioExcelExportModel } from "./build-export-model";
import { assertExcelModelReady } from "./build-excel-model";
import { scenarioExcelWorkbookToBuffer } from "./build-excel-workbook";

/**
 * Server- and client-safe: returns an ArrayBuffer for HTTP responses or Blob downloads.
 * Uses canonical `CalculationResult` only (via `buildScenarioExcelExportModel`).
 */
export async function buildScenarioExcelArrayBuffer(result: CalculationResult): Promise<ArrayBuffer> {
  const model = assertExcelModelReady(buildScenarioExcelExportModel(result));
  return scenarioExcelWorkbookToBuffer(model);
}
