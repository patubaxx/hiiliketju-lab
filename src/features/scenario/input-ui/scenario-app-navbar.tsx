"use client";

/**
 * Sticky primary action bar: flow stepper, run/reset, locale (exports live in Report).
 * Presentational only — handlers and flow state come from `ScenarioInputApp`.
 */
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/messages";

import { AppFlowStepper, type AppFlowStep } from "./app-flow-stepper";
import { FieldLabel, selectClassName } from "./form-primitives";

type TFn = (id: string, vars?: Record<string, string>) => string;

export type ScenarioAppNavbarFlowProps = {
  readonly activeStep: AppFlowStep;
  readonly hasResult: boolean;
  readonly onStepChange: (step: AppFlowStep) => void;
  readonly hint: string;
};

export type ScenarioAppNavbarProps = {
  readonly locale: Locale;
  readonly setLocale: (locale: Locale) => void;
  readonly onRun: () => void;
  readonly onReset: () => void;
  readonly flow: ScenarioAppNavbarFlowProps;
  readonly t: TFn;
};

export function ScenarioAppNavbar({
  locale,
  setLocale,
  onRun,
  onReset,
  flow,
  t,
}: ScenarioAppNavbarProps) {
  return (
    <header
      role="banner"
      aria-label={t("app.shell.toolbarAriaLabel")}
      className="sticky top-0 z-40 border-b border-border/55 bg-surface-shell/92 shadow-[var(--shadow-tile)] backdrop-blur-md supports-[backdrop-filter]:bg-surface-shell/85 dark:border-border/40"
    >
      <div className="mx-auto flex w-full max-w-[min(94rem,100%)] flex-col gap-2.5 px-4 py-2 sm:gap-3 sm:px-6 sm:py-2.5 xl:px-10">
        <div className="rounded-lg border border-border/50 bg-surface-inset/35 px-2 py-2 shadow-[var(--shadow-tile)] sm:px-3 sm:py-2.5 dark:border-border/45 dark:bg-surface-inset/18">
          <div className="min-w-0 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:thin] sm:overflow-x-visible [&::-webkit-scrollbar]:h-1">
            <AppFlowStepper
              activeStep={flow.activeStep}
              hasResult={flow.hasResult}
              onStepChange={flow.onStepChange}
              t={t}
            />
          </div>
          <p className="mt-2 max-w-4xl text-xs leading-relaxed text-muted-foreground sm:text-sm">{flow.hint}</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-x-4 sm:gap-y-2">
          <div className="flex w-full flex-col gap-2 rounded-lg border border-border/50 bg-muted/20 p-1.5 shadow-[var(--shadow-tile)] sm:w-auto sm:max-w-none sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-2 sm:p-2 dark:border-border/45 dark:bg-muted/15">
            <Button type="button" onClick={onRun} className="min-h-10 w-full font-semibold shadow-sm sm:w-auto">
              {t("scenarioForm.runCalculation")}
            </Button>
            <Button type="button" variant="outline" onClick={onReset} className="min-h-10 w-full sm:w-auto">
              {t("scenarioForm.reset")}
            </Button>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-1 border-border/50 sm:w-auto sm:shrink-0 sm:border-l sm:pl-4 dark:sm:border-border/40">
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
      </div>
    </header>
  );
}
