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
  readonly t: TFn;
};

export function ScenarioAppNavbar({
  locale,
  setLocale,
  onRun,
  onReset,
  result,
  t,
}: ScenarioAppNavbarProps) {
  return (
    <header
      role="banner"
      aria-label={t("app.shell.toolbarAriaLabel")}
      className="sticky top-0 z-40 border-b border-border/80 bg-background/92 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md supports-[backdrop-filter]:bg-background/88"
    >
      <div className="mx-auto flex w-full max-w-[min(94rem,100%)] flex-col gap-3 px-4 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-2 sm:px-6 xl:px-10">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button type="button" onClick={onRun} className="min-h-9">
            {t("scenarioForm.runCalculation")}
          </Button>
          <Button type="button" variant="outline" onClick={onReset} className="min-h-9">
            {t("scenarioForm.reset")}
          </Button>
          <Button type="button" variant="outline" asChild className="min-h-9">
            <a href="#scenario-outcome">{t("app.shell.jumpToOutcome")}</a>
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-3 sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <FieldLabel htmlFor="navbar-locale-select">{t("locale.label")}</FieldLabel>
            <select
              id="navbar-locale-select"
              className={selectClassName + " min-h-9 w-full min-w-[9rem] sm:w-44"}
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
            >
              <option value="en">{t("locale.en")}</option>
              <option value="fi">{t("locale.fi")}</option>
              <option value="sv">{t("locale.sv")}</option>
            </select>
          </div>

          <div
            role="group"
            className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 sm:border-t-0 sm:pt-0"
            aria-label={t("app.shell.exportGroupLabel")}
          >
            <ResultsExcelExportButton result={result} t={t} />
            <ResultsPdfExportButton result={result} t={t} />
          </div>
        </div>
      </div>
    </header>
  );
}
