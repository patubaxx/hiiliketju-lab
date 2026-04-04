# Repository invariants (calculation, UI, export)

**Purpose:** Single maintainer-facing checklist aligned with the **current** codebase. Supersedes scattered milestone handoff notes (polish, export hardening, release QA) as the place to verify behaviour and avoid regressions.

**Normative policy** remains in [`AGENTS.md`](../AGENTS.md) and [`.cursor/rules.md`](../.cursor/rules.md). Product intent in [`solution-spec-v2.md`](solution-spec-v2.md); calculation detail in [`calculation-implementation-spec-v2.md`](calculation-implementation-spec-v2.md).

---

## Canonical calculation flow

1. **`calculateScenario(validated ScenarioInput) → CalculationResult`** is the **only** numerical source of truth for KPIs, daily/monthly series, and summaries shown in the UI.
2. The interactive UI validates with **`safeParseScenarioInput`**, applies **`mergeProcessAssumptionsInput`**, then calls **`calculateScenario`** (`src/features/scenario/input-ui/scenario-input-app.tsx`). **`buildScenarioPayload`** maps form state to the wire shape first; optional display units for **annual CO₂** (kg/year vs kt/year) and **constant electricity purchase price** (c/kWh vs EUR/MWh) are converted there to canonical **kt/year** and **EUR/MWh**. **Primary actions** (run, reset, locale, jump to `#scenario-outcome`, Excel/PDF export) live in the **sticky navbar** (`scenario-app-navbar.tsx`); export controls are **disabled** when no result exists. A successful run **scrolls** to the outcome region; this is UX only and does not alter engine or export pipelines.
3. **Internal engine is daily-first** (365 days). Hourly CO₂ is harmonized with **sum** per day; hourly electricity **purchase** price (EUR/MWh) with **arithmetic mean** per day (see domain constants and `resolve-co2-series` / `resolve-electricity-price-series`).

---

## Export boundary

1. Shipped downloads use **`POST /api/export/excel`** and **`POST /api/export/pdf`** with body **`{ "scenario": <wire> }`**.
2. **`parseExportScenarioPostBody`** validates with the same Zod schema as the UI; **`mergeProcessAssumptionsInput`** is applied on success.
3. Handlers run **`calculateScenario(input)`** then **`buildScenarioExcelArrayBuffer`** / **`buildScenarioPdfBlobFromResult`** on **that** result. They must **not** treat a client-posted **`CalculationResult`** (or KPI partials) as authoritative.
4. Extra top-level JSON keys are **ignored**; they cannot override numbers because the server never reads a parallel result object.
5. **`runtime = "nodejs"`** on export routes is required for ExcelJS and React-PDF unless you verify another runtime.

**Primary code paths:** `src/app/api/export/parse-export-body.ts`, `server-export-pipeline.ts`, `excel/route.ts`, `pdf/route.ts`.

---

## Reporting layer (mappers)

1. **`build-export-model.ts`** (and dependents) **map and format** from `CalculationResult` / `ScenarioInput`; they do **not** re-harmonize temporal inputs or re-derive annual KPIs.
2. **`assertCalculationResultExportable`** and **`assertExcelModelReady`** are **throw-only** structural checks (lengths, `warnings` as `string[]`); they must not mutate results or substitute business defaults.

---

## Warnings

- **`CalculationResult.warnings`** is **`string[]`** end-to-end (engine, UI, exports). No structured severity or i18n keys in product code unless the contract is explicitly redesigned.

---

## Assumptions metadata

- Process assumptions on **`ScenarioInput.process`** carry **`AssumptionValue`** metadata. Exports reflect what is on the domain object; mappers do not invent sources or statuses.

---

## Do not regress (short checklist)

- [ ] No business formulas in React components, export mappers, or layout-only helpers.
- [ ] No **`calculationResult`** (or similar) as authoritative input on export APIs.
- [ ] No change of **`warnings`** from opaque **`string[]`** without an explicit product contract.
- [ ] No reintroduction of legacy MVP-only models: constant-only electricity, monthly-only CO₂ as the sole path, annuity CAPEX as default MVP.
- [ ] Keep export **`runtime = "nodejs"`** unless ExcelJS + React-PDF are verified elsewhere.

---

## Known intentional limitations (MVP)

- No auth, rate limiting, or export abuse protection beyond platform defaults.
- No strict body-size policy beyond platform limits; very large pasted series may be impractical.
- ASCII **`filename=`** in `Content-Disposition` only (no RFC 5987 `filename*`).
- Optional: extra HTTP route tests for every `parseExportScenarioPostBody` error code (parser is already unit-tested).

---

## Verification notes (tests)

- **`npm test`** (Vitest) covers parsing, exportable asserts, export route smoke tests, engine and schema behaviour. Run after substantive changes.

---

## Consolidation note

This file incorporates the substance of former per-milestone docs (`wp8` polish, `wp9` export hardening + post-check, `wp10` release readiness) into one current-state reference (April 2026 documentation pass).
