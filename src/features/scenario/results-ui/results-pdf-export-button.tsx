"use client";

import { FileText } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CalculationResult } from "@/core/domain/result";
import { safeExportBasename } from "@/core/reporting/export-filename";
import { cn } from "@/lib/utils";

import { attachmentFilenameFromHeader } from "./attachment-filename";

type TFn = (id: string, vars?: Record<string, string>) => string;

export function ResultsPdfExportButton({
  result,
  t,
  className,
  buttonClassName,
}: {
  readonly result: CalculationResult | null;
  readonly t: TFn;
  readonly className?: string;
  readonly buttonClassName?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const disabled = result === null;

  const onClick = useCallback(async () => {
    if (!result) return;
    setBusy(true);
    setError(null);
    try {
      const fallbackName = `hiiliketju_${safeExportBasename(result.input.scenarioName)}.pdf`;
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: result.input }),
      });
      if (!res.ok) {
        setError(t("results.export.pdfError"));
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
      setError(t("results.export.pdfError"));
    } finally {
      setBusy(false);
    }
  }, [result, t]);

  const ariaLabel =
    disabled ? `${t("results.export.downloadPdf")} — ${t("results.export.unavailableUntilRun")}` : busy ? t("results.export.pdfExporting") : t("results.export.downloadPdf");

  return (
    <div className={cn("flex flex-col items-stretch gap-1 sm:items-end", className)}>
      <Button
        type="button"
        variant="outline"
        size={buttonClassName ? "lg" : "sm"}
        disabled={disabled || busy}
        aria-busy={busy}
        aria-label={ariaLabel}
        onClick={() => void onClick()}
        className={cn("gap-1.5", buttonClassName)}
      >
        <FileText className={cn("shrink-0", buttonClassName ? "size-5" : "size-3.5")} aria-hidden />
        {busy ? t("results.export.pdfExporting") : t("results.export.downloadPdf")}
      </Button>
      <div role="status" aria-live="polite" className="min-h-[1rem]">
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
