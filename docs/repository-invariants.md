# Repository invariants (calculation, UI, export)

**Purpose:** Single maintainer-facing checklist aligned with the **current** codebase. Supersedes scattered milestone handoff notes (polish, export hardening, release QA) as the place to verify behaviour and avoid regressions.

**Normative policy** remains in [`AGENTS.md`](../AGENTS.md) and [`.cursor/rules.md`](../.cursor/rules.md). Product intent in [`solution-spec-v2.md`](solution-spec-v2.md); calculation detail in [`calculation-implementation-spec-v2.md`](calculation-implementation-spec-v2.md).

---

## Canonical calculation flow

1. **`calculateScenario(validated ScenarioInput) → CalculationResult`** is the **only** numerical source of truth for KPIs, daily/monthly series, and summaries shown in the UI.
2. The interactive UI validates with **`safeParseScenarioInput`**, applies **`mergeProcessAssumptionsInput`**, then calls **`calculateScenario`** (`src/features/scenario/input-ui/scenario-input-app.tsx`). **`buildScenarioPayload`** maps form state to the wire shape first; the display unit for **annual CO₂** is fixed as `kt/year` in the visible UI (no unit selector; internal `kg/year` conversion helpers remain in domain code); **constant electricity purchase price** may be entered as `c/kWh` or `EUR/MWh` and is converted to canonical **EUR/MWh**. Advanced process assumptions display active canonical defaults (value + unit + assumption metadata) before any overrides; user overrides are explicit and untouched fields remain omitted so defaults stay canonical in merge logic. **CSV import** for CO₂ and electricity **time-series** modes is browser-only: it parses a file into the same **`seriesText`** bulk field as manual entry, then the existing payload + Zod path applies. **Primary actions** (run, reset, locale, jump to `#scenario-outcome`, Excel/PDF export) live in the **sticky navbar** (`scenario-app-navbar.tsx`); export controls are **disabled** when no result exists. A successful run **scrolls** to the outcome region; this is UX only and does not alter engine or export pipelines.
3. **Internal engine is daily-first** (365 days). Hourly CO₂ is harmonized with **sum** per day; hourly electricity **purchase** price (EUR/MWh) with **arithmetic mean** per day (see domain constants and `resolve-co2-series` / `resolve-electricity-price-series`).

---

## Terminology (UI / export copy)

- **Electricity** is framed as **purchase / procurement price** where relevant (constant, series, and historical import paths).
- **Methane and hydrogen economics** are framed as **assumed sales prices** (inputs), distinct from **derived** profitability indicators (e.g. break-even methane price) that come from the canonical **`CalculationResult`**.
- **Wire / domain field names** were not renamed for this wording pass; copy and validation messages align with the above intent.

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

## Default electricity data pipeline (WP16)

- **Source:** `sources/electricity_prices.csv` — porssisahko.net quarter-hourly Finnish spot prices, `snt/kWh` with VAT.
- **Script:** `scripts/generate-electricity-defaults-2025-fi.js` — deterministic Node.js transform; run to regenerate the artifact.
- **Artifact:** `src/data/electricity-defaults-2025-fi.ts` — checked-in, app-consumable module; **do not edit manually**.
- **Unit conversion:** `snt/kWh × 10 = EUR/MWh` (exact; 1 snt/kWh = 0.01 EUR/kWh = 10 EUR/MWh).
- **Hourly defaults (8 760 values):** arithmetic mean of 4 consecutive quarter-hourly values per clock hour, sequential within each calendar date. DST: spring-forward day 2025-03-30 yields 23 hourly values; fall-back day 2025-10-26 yields 25 hourly values (total = 8 760).
- **Daily defaults (365 values):** arithmetic mean of all hourly values per calendar date (23, 24, or 25 values depending on DST).
- **App integration:** `historical_market_data_imported` mode initialises and resolution-switches with the corresponding 2025 default dataset. Users can paste or import their own series to override.

---

## Known intentional limitations (MVP)

- No auth, rate limiting, or export abuse protection beyond platform defaults.
- No strict body-size policy beyond platform limits; very large pasted or imported series may be impractical.
- **CSV time-series import** is **browser-side only**; it does not add a server ingest mode or a new `ScenarioInput` shape—only fills **`seriesText`** for the existing daily/hourly bulk paths. Supported layouts and error cases are those implemented by **`parse-time-series-csv`** (not arbitrary spreadsheet dialects).
- **Display-unit switching** applies only to **constant electricity purchase price** in the form (`EUR/MWh` ↔ `c/kWh`); **annual CO₂** is fixed to `kt/year` (no unit selector visible). **Time-series** bulk entry and **exports** stay on **canonical** wire units (`kt/year`, `EUR/MWh`, and series semantics as today).
- **Default electricity data** includes Finnish VAT (25.5 % in 2025) because the source (porssisahko.net) provides consumer-facing prices. Industrial procurement prices are typically ex-VAT; users should override with their actual contract price.
- ASCII **`filename=`** in `Content-Disposition` only (no RFC 5987 `filename*`).
- Optional: extra HTTP route tests for every `parseExportScenarioPostBody` error code (parser is already unit-tested).

---

## Verification notes (tests)

- **`npm test`** (Vitest) covers parsing, exportable asserts, export route smoke tests, engine and schema behaviour. Run after substantive changes.

---

## Consolidation note

This file incorporates the substance of former per-milestone docs (`wp8` polish, `wp9` export hardening + post-check, `wp10` release readiness) into one current-state reference. The April 2026 pass also records accepted **WP1–WP3** behaviour (terminology, optional display units before canonical payload, CSV → `seriesText`) without changing calculation or wire contracts.
