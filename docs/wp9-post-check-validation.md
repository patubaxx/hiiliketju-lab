# WP9 post-check validation

**Scope:** Read-only verification of the WP9 export-hardening slice against a fixed architectural checklist (April 2026). No product expansion; confirms **actual** code behavior, not intent.

**Verdict:** **GO** — all seven checks **PASS** or **PASS WITH NOTE** (notes are narrow, documented caveats; no **FAIL**).

---

## Checklist outcome

| # | Check | Status | Evidence (where to look) | Fix needed? |
|---|--------|--------|---------------------------|-------------|
| 1 | API input contract | **PASS WITH NOTE** | `parse-export-body.ts`: only reads `scenario` from parsed JSON; `safeParseScenarioInput` before any calculation. Extra top-level keys (e.g. a bogus `calculationResult`) are **ignored**, not read — server never uses client-sent results. | No |
| 2 | Canonical server recomputation | **PASS** | `server-export-pipeline.ts`: `calculateScenario(input)` then `buildScenarioExcelArrayBuffer` / `buildScenarioPdfBlobFromResult` on **that** result. UI only calls `fetch` to `/api/export/*`. | No |
| 3 | Mapper purity | **PASS** | `build-export-model.ts`: copies from `CalculationResult` / `ScenarioInput`, stringifies snapshot KVs, labels/units; no `resolveCo2`, `aggregate`, or KPI formulas. Warnings copied as `warnings: [...result.warnings]`. PDF downsampling in `build-pdf-report-model.ts` subsets existing series for layout only. | No |
| 4 | Filename helper placement | **PASS** | `src/core/reporting/export-filename.ts` (`safeExportBasename`). Used by `server-export-pipeline.ts` and both export buttons (fallback name). Deterministic regex + truncation across Excel/PDF. | No |
| 5 | Guard/assert safety | **PASS** | `assert-calculation-result-exportable.ts` and `assertExcelModelReady` in `build-excel-model.ts`: **throw** on structural violation; **no mutation**, no default substitution, no warning reinterpretation. | No |
| 6 | Client export path | **PASS** | `results-excel-export-button.tsx` / `results-pdf-export-button.tsx`: `fetch` + `res.blob()` only; no `buildScenarioExcelArrayBuffer` / `buildScenarioPdfBlobFromResult` in `src/` outside API pipeline and reporting modules. | No |
| 7 | Test realism | **PASS WITH NOTE** | `parse-export-body.test.ts`: invalid JSON, missing `scenario`, Zod failure, happy path. `export-api-routes.test.ts`: invalid JSON + Excel/PDF 200 + headers/bytes. `assert-calculation-result-exportable.test.ts` + `excel-export.test.ts` (model invariant). **Note:** Full HTTP **route** is not re-tested for `validation_failed` (same parser as unit-tested `parseExportScenarioPostBody`). | No |

---

## Confirmed invariants

- **`calculateScenario(validated ScenarioInput) → CalculationResult`** is the **only** numerical source for bytes returned by `/api/export/excel` and `/api/export/pdf`.
- Export mappers **do not** re-harmonize temporal inputs or re-derive annual KPIs; they **read** canonical outputs.
- **`warnings`** remain **`string[]`**; guards only enforce `typeof string`, no parsing or localization.
- Assumption rows in exports come from **`result.input.process`** metadata already on the domain object; mappers do not invent metadata.

---

## Caveats (PASS WITH NOTE details)

1. **Outer JSON body** is not enforced as strictly `{ scenario }` only: additional properties are allowed by the parser but **unused**. A client cannot drive numbers via a parallel `calculationResult` property because the server never reads it.
2. **Route tests** rely on **`parseExportScenarioPostBody` tests** for invalid-scenario **400** behavior; adding a duplicate route-level test would be optional hardening, not required to satisfy the invariant.

---

## Fixes made in this validation pass

**None.** `No code changes were required in this validation pass.`

---

## Remaining limitations (out of scope)

- Auth, rate limits, body size policy, RFC 5987 filenames — unchanged from WP9 handoff.
- Programmatic callers could still invoke `buildScenarioExcelArrayBuffer` in Node/tests; the **shipped UI path** is server-only for file generation.

---

## Do not regress

- Do not add **`calculationResult`** (or similar) to the export API as an authoritative input.
- Do not bypass **`parseExportScenarioPostBody` + `calculateScenario`** in route handlers.
- Do not add business formulas to **`build-export-model`** or workbook/PDF layout code.
- Keep **`assertCalculationResultExportable`** / **`assertExcelModelReady`** as **throw-only** structural checks.

---

## Cross-reference

- Implementation narrative: `docs/wp9-export-hardening-handoff.md`
- Project rules: `AGENTS.md`, `.cursor/rules.md`
- Release readiness snapshot: `docs/wp10-release-readiness-handoff.md`
