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

/**
 * Parses POST JSON `{ "scenario": <ScenarioInput wire shape> }` for server-side exports.
 * Validates with the same Zod schema as the interactive form; does not trust client-sent numbers without validation.
 */
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
