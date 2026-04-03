# WP10 — MVP release readiness / final QA + docs alignment

**Scope:** Narrow consistency pass after WP9 export hardening. No new product features, no calculation or KPI semantics changes, no multi-scenario work.

**Status date:** April 2026.

**Audience:** Maintainers, release reviewers, and the next work package owner.

---

## Executive verdict

**GO** — for **MVP release readiness of the current slice**: implementation matches the locked architecture (canonical `calculateScenario` output, server-side export pipeline, opaque `string[]` warnings, mode-based CO₂ and electricity inputs, daily-first engine). Documentation and handoff cross-references are aligned with that implementation. Full test suite passes (`npm test`).

---

## Preserved invariants (do not regress)

1. **`calculateScenario(validatedInput) → CalculationResult`** is the only numerical source of truth for business outputs.
2. **UI** runs `calculateScenario` after validation and renders from **`CalculationResult`** only (no duplicate formulas for KPIs or series).
3. **Excel/PDF file downloads** use **`POST /api/export/excel`** and **`POST /api/export/pdf`**: validate wire **`scenario`**, run **`calculateScenario`**, then map that result. The API must **not** accept a client-sent result object as authoritative.
4. **Mappers** (`build-export-model`, workbook/PDF layout) **map and format** only; they do not re-harmonize temporal inputs or re-derive annual KPIs.
5. **`warnings`** remain **`string[]`**, opaque end-to-end (no structured contract, no parsing for severity or i18n keys in product code).
6. **Assumption metadata** is explicit on domain inputs (especially **`ScenarioInput.process`** after merge); exports reflect existing metadata, they do not invent it.
7. **Internal engine** remains **daily-first**; hourly inputs are harmonized per locked aggregation rules (`sum` for hourly CO₂ mass, **arithmetic mean** for hourly electricity price).
8. **Input contracts** remain mode-based for CO₂ and electricity per **`AGENTS.md`** / **`.cursor/rules.md`**.
9. **Legacy MVP assumptions stay out:** not constant-only electricity, not monthly-weighted-only CO₂ as the only path, not annuity CAPEX as default MVP behavior.

---

## Docs aligned (this pass)

| Item | Change |
|------|--------|
| **`AGENTS.md`** | Reporting layer clarifies server export path and “map only” rule. |
| **`.cursor/rules.md`** | UI/export rules extended with shipped HTTP export contract. |
| **`docs/solution-spec-v2.md`** | §3.3 canonical result + server recompute; typo “witn” → “with”; delivery order adds WP9/WP10. |
| **`docs/calculation-implementation-spec-v2.md`** | §13 notes HTTP export uses validated `scenario` + fresh `calculateScenario`. |
| **`docs/wp8-post-validation-handoff.md`** | Source-of-truth line and cross-references point to WP9/WP10 (removed stale WP6 file reference). |
| **`docs/wp9-export-hardening-handoff.md`** | Cross-reference fixes: drop deleted `wp6` doc; link post-check + WP10. |
| **`docs/wp9-post-check-validation.md`** | Link to this document. |

---

## QA summary (repository inspection)

- **Canonical flow:** `scenario-input-app.tsx` calls `calculateScenario` on validated input; result drives UI.
- **Export path:** `excel/route.ts` and `pdf/route.ts` → `parseExportScenarioPostBody` → `buildExcelExportResponse` / `buildPdfExportResponse` → `calculateScenario` → buffer/blob builders.
- **Warnings:** `CalculationResult.warnings` is `string[]`; engine pushes string messages only.
- **Assumptions:** Process assumptions carry metadata; literature umbrella warning is a plain string.
- **Tests:** 104 tests passed across 10 files (`vitest run`); includes export body parsing, exportable asserts, and API route smoke tests per WP9.

No code or formula changes were required during this pass; findings were documentation and cross-reference drift only.

---

## Tiny fixes made (WP10)

- Corrected **obsolete cross-references** to a deleted `docs/wp6-post-validation-handoff.md`.
- **Aligned** repo rules and specs with the **already-shipped** server-side export pipeline (previously implied only “consume canonical result” without stating server recompute from `scenario`).
- **Typo** in `solution-spec-v2.md` (“witn” → “with”).
- **Delivery order** in solution spec updated to include WP9 and WP10 labels for traceability.

---

## Remaining limitations (intentionally not solved in MVP)

- **Auth, rate limiting, abuse protection** on export routes.
- **Payload / body size** policy beyond platform defaults.
- **Non-ASCII filenames** in `Content-Disposition` (ASCII `filename=` only; no RFC 5987 `filename*`).
- **Structured warnings** (severity, translation keys) — still future product decision; contract remains `string[]`.
- **Full locale-aware unit strings** everywhere in UI (mixed translated labels and fixed abbreviations).
- **Richer assumption surfacing** for economics/temporal modes in results UI (still weighted toward process assumptions).
- **Multi-scenario comparison, persistence, golden customer scenarios** — out of MVP scope.
- **Root `README.md`** is still the default Next.js template; project onboarding could point to `AGENTS.md` and `docs/solution-spec-v2.md` in a future housekeeping pass (out of scope for WP10 semantics freeze).
- **Optional:** duplicate HTTP route-level test for every `parseExportScenarioPostBody` error code (unit tests already cover parser; see WP9 post-check note).

---

## “Do not regress” checklist

- [ ] Do not put **business formulas** in React components, export mappers, or workbook layout helpers.
- [ ] Do not add **`calculationResult`** (or KPI partials) to the export API as authoritative input.
- [ ] Do not **change `warnings`** from opaque **`string[]`** without an explicit product contract change.
- [ ] Do not revert to **constant-only** electricity, **monthly-only** CO₂ as sole model, or **annuity** CAPEX as MVP default.
- [ ] Keep **`runtime = "nodejs"`** on export routes unless ExcelJS + React-PDF are verified on another runtime.
- [ ] Keep **`assertCalculationResultExportable`** / **`assertExcelModelReady`** as **throw-only** structural checks without business defaults.

---

## Recommended next work package (single, narrow)

**WP11 — Product README + deploy/runbook + optional export route test coverage**

Ground the repository for external readers: replace or wrap the generic `README.md` with Hiiliketju context (link to `AGENTS.md`, how to run tests/build, environment notes), and optionally add one route-level test for `validation_failed` if the team wants symmetric HTTP coverage. No calculation or UX expansion.

---

## Cross-reference

- Rules: `AGENTS.md`, `.cursor/rules.md`
- Specs: `docs/solution-spec-v2.md`, `docs/calculation-implementation-spec-v2.md`
- Prior slices: `docs/wp8-post-validation-handoff.md`, `docs/wp9-export-hardening-handoff.md`, `docs/wp9-post-check-validation.md`
