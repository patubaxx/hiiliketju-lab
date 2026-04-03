# WP9 — Server-side export hardening (handoff)

**Scope:** Reliability and boundary safety for Excel/PDF exports only. No new product features, no calculation changes, no multi-scenario support.

---

## Preserved invariants (do not regress)

1. **`calculateScenario(input) → CalculationResult`** is the **only** numerical source for file bytes. Routes **never** accept a client-sent “result” object.
2. **Excel/PDF mappers** (`buildScenarioExcelExportModel`, `buildScenarioPdfReportModel`, workbook/PDF layout) **map and format** only; they do not re-harmonize series or re-derive KPIs.
3. **`warnings`** stay **`string[]`**, opaque end-to-end (UI, Excel, PDF, API error paths do not parse or classify them).
4. **Assumption metadata** is whatever exists on **`ScenarioInput.process`** after Zod + `mergeProcessAssumptionsInput`; exports do not fabricate metadata.
5. **MVP period** remains **365 daily rows**; export guards assume this structural contract.

---

## Hardening changes

### Server routes (Node runtime)

- **`POST /api/export/excel`** — JSON body `{ "scenario": <wire shape> }` → validate with **`safeParseScenarioInput`** → **`calculateScenario`** → **`buildScenarioExcelArrayBuffer`** → binary response with **`Content-Disposition`** and **`Cache-Control: no-store`**.
- **`POST /api/export/pdf`** — same pipeline through **`buildScenarioPdfBlobFromResult`**.
- **`export const runtime = "nodejs"`** so **ExcelJS** and **React-PDF** run in a compatible environment (not Edge).

### Request validation (`src/app/api/export/parse-export-body.ts`)

- Controlled failures: **`invalid_json`**, **`invalid_body`**, **`missing_scenario`**, **`validation_failed`** (includes Zod **`flatten()`** for debugging; UI still uses generic copy).
- **`mergeProcessAssumptionsInput`** applied after Zod success (same as `parseScenarioInput`).

### Export pipeline (`server-export-pipeline.ts`)

- **`calculateScenario`** wrapped: failures → **422** `calculation_failed` (generic message; details **logged server-side** only).
- Build failures → **500** `export_failed` (generic message; no stack in JSON).

### Reporting layer guards

- **`assertCalculationResultExportable`** — enforces **365** daily + resolved series lengths, **12** monthly rows, **string-only** warnings. Used before Excel buffer and PDF blob generation.
- **`assertExcelModelReady`** — enforces **string[]** warnings and full **process assumption** row count after mapping (catches mapper regressions).
- **`safeExportBasename`** moved to **`src/core/reporting/export-filename.ts`** (shared, deterministic server + client fallback).

### Client

- Export buttons call the **API** with **`JSON.stringify({ scenario: result.input })`** and trigger download from the response; **`attachmentFilenameFromHeader`** respects server **`Content-Disposition`** when present.

---

## Tests added or extended

| File | Coverage |
|------|-----------|
| `test/parse-export-body.test.ts` | JSON/body/scenario validation paths |
| `test/assert-calculation-result-exportable.test.ts` | Structural rejection of bad results |
| `test/export-api-routes.test.ts` | Excel/PDF routes: 400 on bad JSON, 200 + bytes + headers on valid scenario |
| `test/excel-export.test.ts` | **`ExcelExportModelInvariantError`** on corrupted warnings in model |
| `test/safe-export-basename.test.ts` | Import path → **`export-filename`** |
| `test/fixtures/export-minimal-scenario.ts` | Shared minimal valid wire scenario |

---

## Known remaining gaps (intentionally out of scope)

- **Auth / rate limits / abuse protection** on export routes.
- **Payload size** limits beyond platform defaults (very large pasted series).
- **Non-ASCII filenames** in `Content-Disposition` (ASCII-only `filename="..."`; no RFC 5987 `filename*`).
- **Idempotent caching** or **async job queue** for heavy exports.
- **Client-side offline export** fallback (removed in favor of server pipeline for consistency).
- **Automated E2E** in a browser (covered by route unit tests + `npm run build`).

---

## “Do not regress” checklist for future changes

- [ ] Do not add **`CalculationResult`** (or partial KPIs) to the export API body.
- [ ] Do not **`catch`** Zod/validation errors and silently substitute defaults that change business meaning.
- [ ] Do not move **harmonization or aggregation** into **`build-export-model`** or workbook builders.
- [ ] Keep **`runtime = "nodejs"`** for these routes unless you verify ExcelJS + React-PDF on the target runtime.
- [ ] Keep **warnings** as raw strings in every export surface.

---

## Cross-reference

- Layering: **`AGENTS.md`**, **`.cursor/rules.md`**
- Prior polish: **`docs/wp8-post-validation-handoff.md`**
- Post-check (read-only): **`docs/wp9-post-check-validation.md`**
- Release snapshot: **`docs/wp10-release-readiness-handoff.md`**
