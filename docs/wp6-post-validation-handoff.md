# Post-validation handoff — WP6 Results UI (first slice)

**Status date:** Manual validation completed after Agent 5 / WP6 first slice.  
**Audience:** Agent 6 / WP7 (Excel export), later Agent 7 / WP7 (PDF export), and maintainers.  
**Source of truth:** `AGENTS.md`, `.cursor/rules.md`, `docs/solution-spec-v2.md`.

---

## 1. Executive verdict

**Accepted with constraints.**

- The **WP6 Results UI first slice** is **validated** as an acceptable read-only presentation layer on top of the **canonical calculation result**.
- It is **not** the final end-state for all product workflows: **multi-scenario comparison**, **structured warnings**, and **full assumption surfacing across every input dimension** are **out of scope** for this slice and remain **follow-ups**.
- It is **safe to proceed** with **Excel and PDF export work** **provided** exports consume the same **`CalculationResult`** (and embedded `ScenarioInput`) as the UI, with **no parallel business formulas** and **opaque handling of warnings**.

---

## 2. What is now validated

The following behaviors and properties are **confirmed** in the current codebase:

- **Dedicated results presentation layer** exists at `src/features/scenario/results-ui/` (e.g. `ResultsPanel`, KPI grid, charts, tables, assumptions block, warnings block, formatting helpers).
- **`ResultsPanel`** replaces the previous inline results markup inside `src/features/scenario/input-ui/scenario-input-app.tsx`.
- **Result state** remains **local React state** on the input app (`useState<CalculationResult | null>`); **no** global store, **no** multi-scenario routing, **no** comparison architecture was added.
- **UI reads only canonical outputs:** `annualSummary`, `monthlySummary`, `dailyResults`, `resolvedDailyCo2`, `resolvedDailyElectricityPrice`, plus **`result.input`** for assumptions snapshot and scenario metadata. **No** recomputation of KPIs, harmonization, or profitability logic in React for display.
- **KPIs, charts, tables, assumptions, and warnings** are **read-only** presentations of that data.
- **i18n:** New user-authored UI strings live under nested **`results.*`** keys in `src/i18n/messages/en.ts`, `fi.ts`, and `sv.ts` (via existing `translate` / `useLocale`).
- **No business formulas** were added to React components beyond **presentation** (formatting, unit display such as kg→t in table columns, slicing a **preview** of daily rows).
- **Tests and production build** were reported passing at validation time; regressions should be caught by the existing suite plus `next build`.

---

## 3. Constraints the next agent must respect

1. **`warnings: readonly string[]`** remain **opaque**. Do not assign severity, codes, or categories; do not parse or translate engine text by content matching.
2. **Single scenario:** Only **one** `CalculationResult` exists in UI state at a time. Exports target **that** result unless product later defines multi-run storage explicitly.
3. **Assumptions in the UI** are **strongest for `result.input.process`** (`AssumptionValue` + `assumptionMeta`). Economics, CO₂ mode, and electricity mode are present on **`ScenarioInput`** but are **not** uniformly modeled as `AssumptionValue` rows in the results UI; exports should **serialize what exists on `ScenarioInput` honestly** without inventing metadata.
4. **Exports are reporting layer consumers:** Excel and PDF must **not** introduce a second source of business truth. They must **read** `CalculationResult` / `ScenarioInput` and **layout** or **format**, not **re-derive** annual totals, break-even prices, harmonized series, or recycling rates independently.
5. **Plant availability / process efficiency:** Still carried on input with literature/assumption metadata; **daily engine does not apply them as multipliers** in the current MVP path (see comments in calculation code). Do not imply in export copy that they affected numerical outputs unless the engine contract changes.

---

## 4. Safe scope for Agent 6 / WP7 (Excel, and shared foundations for PDF)

**Safe** activities, aligned with `docs/solution-spec-v2.md` §14 and `AGENTS.md`:

- Add a **reporting** module (e.g. under `src/core/reporting/` as **recommended** in the solution spec) that builds a **tabular / sheet-oriented view model** from **`CalculationResult`** only.
- **Export sheets or sections** that mirror canonical data, for example:
  - **Inputs snapshot:** `result.input` (scenario name, period, CO₂, electricity, economics, `assumptionsMeta`).
  - **Process assumptions and flags:** `result.input.process` with `assumptionSource`, `assumptionStatus`, `assumptionNote` per field.
  - **Annual summary:** `result.annualSummary`.
  - **Monthly summary:** `result.monthlySummary`.
  - **Daily results:** `result.dailyResults`.
  - **Resolved series:** `result.resolvedDailyCo2`, `result.resolvedDailyElectricityPrice`.
  - **Warnings:** `result.warnings` as **raw strings** (one column or one row per string).
- Use **`exceljs`** (already a project dependency per `package.json`) for workbook generation.
- **Reuse or mirror** presentation formatting patterns from `src/features/scenario/results-ui/format-result-values.ts` **only** as formatting helpers for export cells—**not** as a place to add new business rules.
- **Single-scenario “comparison” in Excel** is safe **only** as **layout of fields already on the canonical result** (e.g. methane revenue vs hydrogen alternative vs delta), **not** as multi-run side-by-side unless upstream state exists.

---

## 5. Unsafe scope for Agent 6 / WP7

Do **not**:

- **Classify, filter, or localize** `warnings` by parsing English text or heuristics.
- **Recompute** harmonized daily series, annual KPIs, break-even or profitability prices, or deltas **in the export builder** instead of reading **`CalculationResult`**.
- **Fabricate** assumption metadata for economics or temporal inputs where the domain object does not provide it.
- **Ship multi-scenario comparison workbooks** (multiple runs, diff sheets) **without** an explicit persisted or passed **collection** of results agreed in product/architecture.
- **Move calculation** into Excel formulas as the **authoritative** business path for MVP (optional non-authoritative checks are out of scope unless product explicitly asks).

---

## 6. Recommended next-step architecture note

- Treat **`calculateScenario(input): CalculationResult`** (`src/core/calculation/calculate-scenario.ts`) as the **only** entrypoint for **numerical** scenario outputs used by UI and exports.
- Introduce **`buildExportModel(result: CalculationResult)`**-style pure functions (naming flexible) that **map** canonical data to **rows/columns/sheet names** with **no formulas** beyond optional Excel display formatting.
- Keep **formatting** (dates, currency, percent display) **separate** from **calculation**; share small pure formatters where sensible.
- **PDF (later):** Same rule—build a **report model** from **`CalculationResult`**, then render HTML/PDF; do not duplicate engine logic in templates.

---

## 7. File and contract awareness

**Inspect these before implementing exports:**

| Area | Path / module |
|------|----------------|
| **Canonical result contract** | `src/core/domain/result.ts` — `CalculationResult`, `DailyResult`, `MonthlySummary`, `ScenarioSummary` |
| **Input + assumptions shapes** | `src/core/domain/scenario.ts`, `src/core/domain/assumptions.ts` |
| **Calculation entrypoint** | `src/core/calculation/calculate-scenario.ts` |
| **Aggregation** | `src/core/calculation/aggregate-results.ts` |
| **Daily rows + engine notes** | `src/core/calculation/calculate-daily-results.ts` |
| **Resolved series** | `src/core/calculation/resolve-co2-series.ts`, `resolve-electricity-price-series.ts`; types in `src/core/domain/temporal.ts` |
| **Validated input schema** | `src/features/scenario/schemas/scenario-schema.ts` |
| **Results UI (reference consumer)** | `src/features/scenario/results-ui/results-panel.tsx` and siblings |
| **Payload build (form → domain)** | `src/features/scenario/input-ui/build-scenario-payload.ts` |
| **i18n** | `src/i18n/messages/en.ts`, `fi.ts`, `sv.ts`; `src/i18n/messages/index.ts` |

**Gap vs solution spec diagram:** `docs/solution-spec-v2.md` §13.2 shows `src/core/reporting/` with `build-export-model.ts` etc. That folder **does not exist yet** in the repository; Agent 6 is expected to **add** it (or equivalent) without breaking layering rules.

**Dependency note:** `exceljs` is present in `package.json`; PDF stack is **not** wired yet (per spec: template/HTML-to-PDF later).

---

## 8. Risks / follow-up items

- **Richer assumptions in exports:** Economics and temporal modes may need **explicit serialization tables** (modes, series lengths, key scalars) even though they are not shown as `AssumptionValue` rows in the current results UI.
- **Multi-scenario comparison:** Requires **explicit** client/server state or persistence design before comparison exports make sense.
- **Structured warning contract:** If product needs severity or localization, that is a **domain/API change** to `CalculationResult.warnings`, not an export-layer guess.
- **Unit strings in UI:** Some KPI labels use fixed unit abbreviations; **full locale-aware unit labeling** is a future i18n improvement.
- **Export UX:** Trigger placement (button on input page vs dedicated route) should follow product choice; **`api/export`** in the spec is **not** implemented yet.

---

## Cross-reference

- Layering and non-negotiables: **`AGENTS.md`**
- Export product intent (sheets, PDF content): **`docs/solution-spec-v2.md`** §14
- Calculation details: **`docs/calculation-implementation-spec-v2.md`**
