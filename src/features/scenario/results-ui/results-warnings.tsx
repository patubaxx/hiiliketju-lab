import type { CalculationResult } from "@/core/domain/result";

import { cn } from "@/lib/utils";

type TFn = (id: string, vars?: Record<string, string>) => string;

/**
 * Canonical English text emitted by the engine as `WARNING_LITERATURE_ESTIMATED_PROCESS_DEFAULTS` in
 * `calculate-scenario.ts`. Intentionally duplicated here (not imported) so client components do not pull
 * calculation/server code into the browser bundle. If the engine string changes, update this literal and the
 * match in `displayWarning`. Unknown `result.warnings` entries are shown unchanged. Excel/PDF use server
 * `CalculationResult` as today (canonical strings unless reporting is changed separately).
 */
const LITERATURE_PROCESS_WARNING_EN =
  "Literature-based estimated process defaults are in use; confirm or replace with project-specific data where applicable.";

function displayWarning(w: string, t: TFn): string {
  return w === LITERATURE_PROCESS_WARNING_EN ? t("results.warnings.literatureBasedProcessDefaults") : w;
}

export function ResultsWarnings({ result, t }: { result: CalculationResult; t: TFn }) {
  const items = result.warnings;
  const hasItems = items.length > 0;

  return (
    <section
      className={cn(
        "rounded-lg border bg-card/85 shadow-[var(--shadow-tile)] dark:bg-card/45",
        hasItems
          ? "border-amber-500/40 border-l-[3px] border-l-amber-600/55 px-5 py-5"
          : "border-border/60 px-4 py-3",
      )}
      aria-labelledby="results-warnings-heading"
    >
      <h3
        id="results-warnings-heading"
        className={cn("font-semibold tracking-tight text-foreground", hasItems ? "text-base" : "text-sm")}
      >
        {t("results.section.warnings")}
      </h3>
      {hasItems ? (
        <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-foreground/90">
          {items.map((w, i) => (
            <li key={i} className="marker:text-muted-foreground">
              {displayWarning(w, t)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("results.warnings.empty")}</p>
      )}
    </section>
  );
}
