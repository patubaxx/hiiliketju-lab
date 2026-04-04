"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { csvImportErrorToMessage } from "@/features/scenario/input-ui/csv-import-error-message";
import {
  parseTimeSeriesCsv,
  type TimeSeriesCsvResolution,
} from "@/features/scenario/input-ui/parse-time-series-csv";

type TFn = (id: string, vars?: Record<string, string>) => string;

function stringifyVars(vars?: Record<string, string | number>): Record<string, string> | undefined {
  if (!vars) return undefined;
  return Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, String(v)]));
}

export function SeriesCsvImportControl({
  resolution,
  expectedCount,
  onImported,
  t,
  inputId,
  disabled,
}: {
  readonly resolution: TimeSeriesCsvResolution;
  readonly expectedCount: number;
  readonly onImported: (seriesText: string) => void;
  readonly t: TFn;
  readonly inputId: string;
  readonly disabled?: boolean;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [message, setMessage] = React.useState<{ text: string; isError: boolean } | null>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const result = parseTimeSeriesCsv(text, { resolution, expectedCount });
      if (result.ok) {
        setMessage({
          text: t("csvImport.success", { count: String(result.values.length) }),
          isError: false,
        });
        onImported(result.seriesText);
      } else {
        const { key, vars } = csvImportErrorToMessage(result.error);
        setMessage({ text: t(key, stringifyVars(vars)), isError: true });
      }
    };
    reader.onerror = () => {
      setMessage({ text: t("csvImport.errors.readFailed"), isError: true });
    };
    reader.readAsText(file, "UTF-8");
  };

  return (
    <div className="flex flex-col gap-1">
      <input
        id={inputId}
        ref={fileRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="sr-only"
        onChange={onFile}
        disabled={disabled}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => fileRef.current?.click()}
      >
        {t("csvImport.button")}
      </Button>
      {message ? (
        <p
          role="status"
          className={
            message.isError ? "text-xs text-destructive" : "text-xs text-muted-foreground"
          }
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
