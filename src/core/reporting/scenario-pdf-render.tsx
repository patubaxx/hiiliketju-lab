import { pdf } from "@react-pdf/renderer";

import type { CalculationResult } from "@/core/domain/result";

import { assertCalculationResultExportable } from "./assert-calculation-result-exportable";
import { buildScenarioPdfReportModel, type PdfReportModel } from "./build-pdf-report-model";
import { ScenarioPdfDocument } from "./scenario-pdf-document";

export async function renderScenarioPdfToBlob(model: PdfReportModel): Promise<Blob> {
  const instance = pdf(<ScenarioPdfDocument model={model} />);
  return instance.toBlob();
}

/**
 * Node/browser: builds the report model from canonical result, then renders PDF.
 * React-PDF stays in this module so App Router API routes and tests can import it on the server.
 */
export async function buildScenarioPdfBlobFromResult(result: CalculationResult): Promise<Blob> {
  assertCalculationResultExportable(result);
  const model = buildScenarioPdfReportModel(result);
  return renderScenarioPdfToBlob(model);
}
