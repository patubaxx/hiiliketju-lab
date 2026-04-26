"use client";

/**
 * Presentational phase indicator for WP-UX1. Navigation only — no business logic.
 */
import * as React from "react";

import { cn } from "@/lib/utils";

export type AppFlowStep = "setup" | "advanced" | "results" | "report";

type TFn = (id: string, vars?: Record<string, string>) => string;

export type AppFlowStepperProps = {
  readonly activeStep: AppFlowStep;
  readonly hasResult: boolean;
  readonly onStepChange: (step: AppFlowStep) => void;
  readonly t: TFn;
};

const STEPS: readonly AppFlowStep[] = ["setup", "advanced", "results", "report"] as const;

export function AppFlowStepper({ activeStep, hasResult, onStepChange, t }: AppFlowStepperProps) {
  return (
    <nav
      aria-label={t("app.shell.flow.stepperAriaLabel")}
      className="w-full"
      data-testid="app-flow-stepper"
    >
      <ol className="flex w-full min-w-0 list-none flex-row flex-wrap items-stretch gap-2 sm:gap-3 md:flex-nowrap md:justify-between">
        {STEPS.map((step, index) => {
          const isActive = activeStep === step;
          const isResultsPhase = step === "results" || step === "report";
          const locked = isResultsPhase && !hasResult;
          const labelId =
            step === "setup"
              ? "app.shell.flow.stepSetup"
              : step === "advanced"
                ? "app.shell.flow.stepRefine"
                : step === "results"
                  ? "app.shell.flow.stepResults"
                  : "app.shell.flow.stepReport";
          const hintId = `flow-step-hint-${step}`;

          return (
            <li key={step} className="min-w-0 flex-1 basis-[calc(50%-0.25rem)] md:basis-0">
              <button
                type="button"
                disabled={locked}
                aria-current={isActive ? "step" : undefined}
                aria-describedby={locked ? undefined : hintId}
                onClick={() => {
                  if (locked) return;
                  onStepChange(step);
                }}
                className={cn(
                  "flex h-full min-h-[2.75rem] w-full flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-2 text-center transition-colors sm:min-h-[3rem] sm:px-3 sm:py-2.5",
                  locked
                    ? "cursor-not-allowed border-border/50 bg-muted/25 text-muted-foreground/70 opacity-80"
                    : isActive
                      ? "border-structural/45 bg-consultancy-subtle/70 text-foreground shadow-sm ring-1 ring-structural/25"
                      : "border-border/70 bg-surface-inset text-muted-foreground hover:border-consultancy/35 hover:bg-consultancy-subtle/40 hover:text-foreground",
                )}
              >
                <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                  {index + 1}
                </span>
                <span className="text-xs font-semibold leading-tight sm:text-sm">{t(labelId)}</span>
                <span id={hintId} className="sr-only">
                  {t(
                    step === "setup"
                      ? "app.shell.flow.enterSetup"
                      : step === "advanced"
                        ? "app.shell.flow.refineAnalysis"
                        : step === "results"
                          ? "app.shell.flow.reviewResults"
                          : "app.shell.flow.exportReport",
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
