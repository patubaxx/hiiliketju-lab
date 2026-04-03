import { PROCESS_ASSUMPTION_EXPORT_ORDER, type ScenarioExcelExportModel } from "./build-export-model";

/**
 * Excel workbook source model for WP7 slice 1.
 * Currently identical to `ScenarioExcelExportModel`; keep this module if Excel-specific
 * reshaping (column sets, split tables) diverges from other export targets later.
 */
export type ExcelWorkbookSourceModel = ScenarioExcelExportModel;

export class ExcelExportModelInvariantError extends Error {
  override readonly name = "ExcelExportModelInvariantError";
  constructor(message: string) {
    super(message);
  }
}

/** Last-line structural check after mapping from canonical result (catches mapper regressions). */
export function assertExcelModelReady(model: ScenarioExcelExportModel): ExcelWorkbookSourceModel {
  if (!Array.isArray(model.warnings) || !model.warnings.every((w) => typeof w === "string")) {
    throw new ExcelExportModelInvariantError("Excel model: warnings must be string[]");
  }
  if (model.processAssumptions.length !== PROCESS_ASSUMPTION_EXPORT_ORDER.length) {
    throw new ExcelExportModelInvariantError("Excel model: process assumption row count mismatch");
  }
  return model;
}
