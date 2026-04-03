import type { ScenarioExcelExportModel } from "./build-export-model";

/**
 * Excel workbook source model for WP7 slice 1.
 * Currently identical to `ScenarioExcelExportModel`; keep this module if Excel-specific
 * reshaping (column sets, split tables) diverges from other export targets later.
 */
export type ExcelWorkbookSourceModel = ScenarioExcelExportModel;

export function assertExcelModelReady(model: ScenarioExcelExportModel): ExcelWorkbookSourceModel {
  return model;
}
