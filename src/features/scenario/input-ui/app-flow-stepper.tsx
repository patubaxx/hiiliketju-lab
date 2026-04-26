"use client";

/**
 * Presentational phase indicator for WP-UX1 / WP-UX2 / WP-UX2b. Navigation only — no business logic.
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
  const activeIndex = STEPS.indexOf(activeStep);

  return (
    <nav
      aria-label={t("app.shell.flow.stepperAriaLabel")}
      className="w-full"
      data-testid="app-flow-stepper"
    >
      <ol className="flex w-full min-w-0 list-none flex-row flex-wrap items-stretch gap-1.5 sm:gap-2 md:flex-nowrap md:justify-between md:gap-3">
        {STEPS.map((step, index) => {
          const isActive = activeStep === step;
          const isResultsPhase = step === "results" || step === "report";
          const locked = isResultsPhase && !hasResult;
          const isCompleted = !locked && !isActive && index < activeIndex;
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
                  "flex h-full min-h-[2.5rem] w-full flex-col items-center justify-center gap-0.5 rounded-lg border px-1.5 py-1.5 text-center transition-[color,background-color,border-color,box-shadow] sm:min-h-[2.75rem] sm:px-2.5 sm:py-2",
                  locked &&
                    "cursor-not-allowed border-dashed border-muted-foreground/35 bg-muted/10 text-muted-foreground/50",
                  !locked &&
                    isActive &&
                    "border-structural/45 bg-surface-shell shadow-[var(--shadow-tile)] ring-2 ring-structural/28 ring-offset-2 ring-offset-background dark:bg-surface-shell/80",
                  !locked &&
                    !isActive &&
                    isCompleted &&
                    "border-structural/30 bg-consultancy-subtle/40 text-foreground shadow-[var(--shadow-tile)] hover:bg-consultancy-subtle/55 dark:bg-consultancy-subtle/25",
                  !locked &&
                    !isActive &&
                    !isCompleted &&
                    "border-border/50 bg-muted/20 text-muted-foreground shadow-[var(--shadow-tile)] hover:border-border/70 hover:bg-muted/35 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "text-[0.6rem] font-semibold uppercase tracking-wide sm:text-[0.65rem]",
                    isActive ? "text-structural dark:text-structural-muted" : "text-muted-foreground",
                    isCompleted && !isActive && "text-structural dark:text-structural-muted",
                    locked && "text-muted-foreground/55",
                  )}
                  aria-hidden
                >
                  {isCompleted && !isActive ? "✓" : index + 1}
                </span>
                <span
                  className={cn(
                    "text-[0.7rem] font-semibold leading-tight sm:text-xs md:text-sm",
                    locked && "text-muted-foreground/55",
                  )}
                >
                  {t(labelId)}
                </span>
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
