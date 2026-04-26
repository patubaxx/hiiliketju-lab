"use client";

/**
 * Sticky primary action bar: run/reset, jump to outcome, locale, exports. Presentational only — handlers and `result` come from `ScenarioInputApp`.
 */
import { Button } from "@/components/ui/button";
import type { CalculationResult } from "@/core/domain/result";
import type { Locale } from "@/i18n/messages";
import { ResultsExcelExportButton } from "@/features/scenario/results-ui/results-excel-export-button";
import { ResultsPdfExportButton } from "@/features/scenario/results-ui/results-pdf-export-button";

import { FieldLabel, selectClassName } from "./form-primitives";

type TFn = (id: string, vars?: Record<string, string>) => string;

export type ScenarioAppNavbarProps = {
  readonly locale: Locale;
  readonly setLocale: (locale: Locale) => void;
  readonly onRun: () => void;
  readonly onReset: () => void;
  readonly result: CalculationResult | null;
  /** When set, replaces the `#scenario-outcome` anchor with an accessible button (WP-UX1). */
  readonly onJumpToOutcome?: () => void;
  readonly t: TFn;
};

export function ScenarioAppNavbar({
  locale,
  setLocale,
  onRun,
  onReset,
  result,
  onJumpToOutcome,
  t,
}: ScenarioAppNavbarProps) {
  return (
    <header
      role="banner"
      aria-label={t("app.shell.toolbarAriaLabel")}
      className="sticky top-0 z-40 border-b border-border/55 bg-surface-shell/92 shadow-[var(--shadow-tile)] backdrop-blur-md supports-[backdrop-filter]:bg-surface-shell/85 dark:border-border/40"
    >
      <div className="mx-auto flex w-full max-w-[min(94rem,100%)] flex-col gap-3 px-4 py-2.5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-3 sm:gap-y-2 sm:px-6 xl:px-10">
        <div className="flex w-full flex-col gap-2 rounded-lg border border-border/50 bg-muted/20 p-1.5 shadow-[var(--shadow-tile)] sm:w-auto sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-2 sm:p-2 dark:border-border/45 dark:bg-muted/15">
          <Button type="button" onClick={onRun} className="min-h-10 w-full font-semibold shadow-sm sm:w-auto">
            {t("scenarioForm.runCalculation")}
          </Button>
          <Button type="button" variant="outline" onClick={onReset} className="min-h-10 w-full sm:w-auto">
            {t("scenarioForm.reset")}
          </Button>
          {onJumpToOutcome ? (
            <Button
              type="button"
              variant="outline"
              disabled={!result}
              onClick={() => {
                if (result) onJumpToOutcome();
              }}
              className="min-h-10 w-full sm:w-auto"
            >
              {t("app.shell.jumpToOutcome")}
            </Button>
          ) : (
            <Button type="button" variant="outline" asChild className="min-h-10 w-full sm:w-auto">
              <a href="#scenario-outcome">{t("app.shell.jumpToOutcome")}</a>
            </Button>
          )}
        </div>

        <div
          role="group"
          className="flex w-full flex-none flex-row flex-nowrap items-center justify-center gap-2 sm:min-w-0 sm:flex-1 sm:basis-[min(100%,16rem)] sm:items-end"
          aria-label={t("app.shell.exportGroupLabel")}
        >
          <ResultsExcelExportButton result={result} t={t} />
          <ResultsPdfExportButton result={result} t={t} />
        </div>

        <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto sm:shrink-0">
          <FieldLabel htmlFor="navbar-locale-select">{t("locale.label")}</FieldLabel>
          <select
            id="navbar-locale-select"
            className={selectClassName + " min-h-10 w-full min-w-[9rem] sm:w-44"}
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            <option value="en">EN</option>
            <option value="fi">FI</option>
            <option value="sv">SV</option>
          </select>
        </div>
      </div>
    </header>
  );
}
