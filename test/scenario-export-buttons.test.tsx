/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResultsExcelExportButton } from "@/features/scenario/results-ui/results-excel-export-button";
import { ResultsPdfExportButton } from "@/features/scenario/results-ui/results-pdf-export-button";

function stubT(id: string): string {
  const map: Record<string, string> = {
    "results.export.downloadExcel": "Download Excel",
    "results.export.exporting": "Exporting…",
    "results.export.error": "Excel export failed.",
    "results.export.downloadPdf": "Download PDF",
    "results.export.pdfExporting": "Preparing PDF…",
    "results.export.pdfError": "PDF export failed.",
    "results.export.unavailableUntilRun": "Run calculation first.",
  };
  return map[id] ?? id;
}

describe("Export action buttons (Excel/PDF)", () => {
  it("disables Excel export when result is null", () => {
    render(<ResultsExcelExportButton result={null} t={stubT} />);
    const btn = screen.getByRole("button", { name: /Download Excel/ });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("disables PDF export when result is null", () => {
    render(<ResultsPdfExportButton result={null} t={stubT} />);
    const btn = screen.getByRole("button", { name: /Download PDF/ });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});
