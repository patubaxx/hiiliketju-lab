/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ScenarioAppNavbar } from "@/features/scenario/input-ui/scenario-app-navbar";

function stubT(id: string): string {
  const keys: Record<string, string> = {
    "app.shell.toolbarAriaLabel": "Scenario actions",
    "scenarioForm.runCalculation": "Run",
    "scenarioForm.reset": "Reset",
    "locale.label": "Language",
    "app.shell.flow.stepperAriaLabel": "Phases",
    "app.shell.flow.stepSetup": "Setup",
    "app.shell.flow.stepRefine": "Advanced settings (optional)",
    "app.shell.flow.stepResults": "Results",
    "app.shell.flow.stepReport": "Report",
    "app.shell.flow.enterSetup": "Enter setup",
    "app.shell.flow.refineAnalysis": "Refine",
    "app.shell.flow.reviewResults": "Review",
    "app.shell.flow.exportReport": "Export report",
  };
  return keys[id] ?? id;
}

describe("ScenarioAppNavbar", () => {
  const flow = {
    activeStep: "setup" as const,
    hasResult: false,
    onStepChange: vi.fn(),
    hint: "Hint",
  };

  it("renders stepper, run, reset, and locale; no export downloads or jump control", () => {
    render(
      <ScenarioAppNavbar
        locale="en"
        setLocale={vi.fn()}
        onRun={vi.fn()}
        onReset={vi.fn()}
        flow={flow}
        t={stubT}
      />,
    );

    expect(screen.getByTestId("app-flow-stepper")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Language" })).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /Download Excel/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Download PDF/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Jump to outcome/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /Jump to outcome/i })).toBeNull();
  });
});
