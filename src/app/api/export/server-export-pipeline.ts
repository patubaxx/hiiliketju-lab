import { NextResponse } from "next/server";

import { calculateScenario } from "@/core/calculation/calculate-scenario";
import type { ScenarioInput } from "@/core/domain/scenario";
import { safeExportBasename } from "@/core/reporting/export-filename";
import { buildScenarioExcelArrayBuffer } from "@/core/reporting/scenario-excel-buffer";
import { buildScenarioPdfBlobFromResult } from "@/core/reporting/scenario-pdf-render";

function calculationFailedResponse(): NextResponse {
  return NextResponse.json(
    { code: "calculation_failed", message: "Calculation could not complete for this scenario" },
    { status: 422 },
  );
}

function exportFailedResponse(kind: "excel" | "pdf"): NextResponse {
  return NextResponse.json(
    { code: "export_failed", message: kind === "excel" ? "Excel export failed" : "PDF export failed" },
    { status: 500 },
  );
}

/**
 * Runs `calculateScenario` then builds an Excel buffer. Single server entry for `/api/export/excel`.
 */
export async function buildExcelExportResponse(input: ScenarioInput): Promise<Response> {
  let result: ReturnType<typeof calculateScenario>;
  try {
    result = calculateScenario(input);
  } catch (err) {
    console.error("calculateScenario failed during export", err);
    return calculationFailedResponse();
  }

  try {
    const buffer = await buildScenarioExcelArrayBuffer(result);
    const base = safeExportBasename(result.input.scenarioName);
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="hiiliketju_${base}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Excel export pipeline failed", err);
    return exportFailedResponse("excel");
  }
}

/**
 * Runs `calculateScenario` then builds a PDF. Single server entry for `/api/export/pdf`.
 */
export async function buildPdfExportResponse(input: ScenarioInput): Promise<Response> {
  let result: ReturnType<typeof calculateScenario>;
  try {
    result = calculateScenario(input);
  } catch (err) {
    console.error("calculateScenario failed during export", err);
    return calculationFailedResponse();
  }

  try {
    const blob = await buildScenarioPdfBlobFromResult(result);
    const buf = await blob.arrayBuffer();
    const base = safeExportBasename(result.input.scenarioName);
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="hiiliketju_${base}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("PDF export pipeline failed", err);
    return exportFailedResponse("pdf");
  }
}
