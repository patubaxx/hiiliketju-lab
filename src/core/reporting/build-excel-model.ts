import { PROCESS_ASSUMPTION_EXPORT_ORDER, type ScenarioExcelExportModel } from "./build-export-model";

/**
 * Excel-specific typing and structural invariants on top of `ScenarioExcelExportModel`.
 * Currently identical to that model; this module is the hook if Excel layout later diverges from PDF.
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
