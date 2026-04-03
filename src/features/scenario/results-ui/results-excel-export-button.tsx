"use client";

import { Download } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CalculationResult } from "@/core/domain/result";
import { safeExportBasename } from "@/core/reporting/export-filename";

import { attachmentFilenameFromHeader } from "./attachment-filename";

type TFn = (id: string, vars?: Record<string, string>) => string;

export function ResultsExcelExportButton({
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
      const fallbackName = `hiiliketju_${safeExportBasename(result.input.scenarioName)}.xlsx`;
      const res = await fetch("/api/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: result.input }),
      });
      if (!res.ok) {
        setError(t("results.export.error"));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachmentFilenameFromHeader(res.headers.get("Content-Disposition"), fallbackName);
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(t("results.export.error"));
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
        aria-busy={busy}
        aria-label={busy ? t("results.export.exporting") : t("results.export.downloadExcel")}
        onClick={() => void onClick()}
        className="gap-1.5"
      >
        <Download className="size-3.5 shrink-0" aria-hidden />
        {busy ? t("results.export.exporting") : t("results.export.downloadExcel")}
      </Button>
      <div role="status" aria-live="polite" className="min-h-[1rem]">
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
