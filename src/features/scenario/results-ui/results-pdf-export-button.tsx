"use client";

import { FileText } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CalculationResult } from "@/core/domain/result";

type TFn = (id: string, vars?: Record<string, string>) => string;

function safePdfBasename(name: string): string {
  const s = name.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return s.slice(0, 80) || "scenario";
}

export function ResultsPdfExportButton({
  result,
  t,
}: {
  readonly result: CalculationResult;
  readonly t: TFn;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { buildScenarioPdfBlobFromResult } = await import("@/core/reporting/scenario-pdf-render");
      const blob = await buildScenarioPdfBlobFromResult(result);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hiiliketju_${safePdfBasename(result.input.scenarioName)}.pdf`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(t("results.export.pdfError"));
    } finally {
      setBusy(false);
    }
  }, [result, t]);

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => void onClick()}
        className="gap-1.5"
      >
        <FileText className="size-3.5" aria-hidden />
        {busy ? t("results.export.pdfExporting") : t("results.export.downloadPdf")}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
