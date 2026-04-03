import { pdf } from "@react-pdf/renderer";

import type { CalculationResult } from "@/core/domain/result";

import { buildScenarioPdfReportModel, type PdfReportModel } from "./build-pdf-report-model";
import { ScenarioPdfDocument } from "./scenario-pdf-document";

export async function renderScenarioPdfToBlob(model: PdfReportModel): Promise<Blob> {
  const instance = pdf(<ScenarioPdfDocument model={model} />);
  return instance.toBlob();
}

/**
 * Client- or server-side: builds the report model from canonical result, then renders PDF.
 * Keeps React-PDF imports in this module so callers can dynamic-import it from the UI bundle.
 */
export async function buildScenarioPdfBlobFromResult(result: CalculationResult): Promise<Blob> {
  const model = buildScenarioPdfReportModel(result);
  return renderScenarioPdfToBlob(model);
}
