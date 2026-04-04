/**
 * Export POST bodies are `{ "scenario": <wire> }`. This parser validates with the same Zod schema as the UI,
 * merges default process assumptions, and returns a `ScenarioInput` suitable for `calculateScenario`.
 * Extra JSON keys (e.g. a spoofed calculation result) are ignored — the server always recomputes.
 */
import { mergeProcessAssumptionsInput, type ScenarioInput } from "@/core/domain/scenario";
import { safeParseScenarioInput } from "@/features/scenario/schemas/scenario-schema";

export type ExportErrorPayload = {
  readonly code: string;
  readonly message: string;
  readonly issues?: unknown;
};

export type ParseExportScenarioBodyResult =
  | { readonly ok: true; readonly input: ScenarioInput }
  | { readonly ok: false; readonly status: number; readonly payload: ExportErrorPayload };

/** Parses POST JSON for `/api/export/excel` and `/api/export/pdf` (see file-level contract). */
export function parseExportScenarioPostBody(rawText: string): ParseExportScenarioBodyResult {
  let json: unknown;
  try {
    json = JSON.parse(rawText) as unknown;
  } catch {
    return {
      ok: false,
      status: 400,
      payload: { code: "invalid_json", message: "Request body must be valid JSON" },
    };
  }

  if (!json || typeof json !== "object") {
    return {
      ok: false,
      status: 400,
      payload: { code: "invalid_body", message: "JSON object expected" },
    };
  }

  const scenario = (json as Record<string, unknown>).scenario;
  if (scenario === undefined) {
    return {
      ok: false,
      status: 400,
      payload: { code: "missing_scenario", message: 'JSON must include a "scenario" object' },
    };
  }

  const parsed = safeParseScenarioInput(scenario);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      payload: {
        code: "validation_failed",
        message: "Scenario validation failed",
        issues: parsed.error.flatten(),
      },
    };
  }

  const input: ScenarioInput = {
    ...parsed.data,
    process: mergeProcessAssumptionsInput(parsed.data.process),
  };

  return { ok: true, input };
}
