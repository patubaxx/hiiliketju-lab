import type { CalculationResult } from "@/core/domain/result";

import { assertCalculationResultExportable } from "./assert-calculation-result-exportable";
import { buildScenarioExcelExportModel } from "./build-export-model";
import { assertExcelModelReady } from "./build-excel-model";
import { scenarioExcelWorkbookToBuffer } from "./build-excel-workbook";

/**
 * Node/browser-safe: returns an ArrayBuffer for HTTP responses or Blob downloads.
 * Uses canonical `CalculationResult` only (via `buildScenarioExcelExportModel`).
 */
export async function buildScenarioExcelArrayBuffer(result: CalculationResult): Promise<ArrayBuffer> {
  assertCalculationResultExportable(result);
  const model = assertExcelModelReady(buildScenarioExcelExportModel(result));
  return scenarioExcelWorkbookToBuffer(model);
}
