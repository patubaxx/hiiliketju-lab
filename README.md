# Hiiliketju Site

Browser-based **techno-economic scenario calculator** for biogenic CO₂ utilization: compare **Path A** (CO₂ + H₂ → CH₄) vs **Path B** (CO₂ released + H₂ sold). This repository is the **customer-deliverable** Next.js application (UI, calculation engine, assumptions layer, and Excel/PDF reporting).

## Architecture (four layers)

1. **UI** — `src/features/scenario/`, `src/app/` — forms, results presentation, i18n. No business formulas; displays `CalculationResult` only.
2. **Calculation engine** — `src/core/calculation/` — `calculateScenario`, daily rows, harmonization, aggregations, CAPEX allocation.
3. **Assumptions / parameters** — `src/core/domain/` (types, metadata), wired through Zod in `src/features/scenario/schemas/`.
4. **Reporting / export** — `src/core/reporting/` — maps canonical result to Excel/PDF; **no independent KPI math**. Readouts (economic verdict, assumptions-used summaries) **interpret** existing summary fields only; they do not add parallel KPI math.

**Canonical rule:** `calculateScenario(validated ScenarioInput) → CalculationResult` is the **only** source of business numbers for UI and exports.

## Folder map (high level)

| Area | Path | Role |
|------|------|------|
| App shell & API routes | `src/app/` | Pages, `layout`, **`api/export/excel`**, **`api/export/pdf`** |
| Scenario UI | `src/features/scenario/input-ui/`, `results-ui/` | Form state, validation UX, **sticky app navbar** (`scenario-app-navbar.tsx`) with flow **stepper**, **Run**, **Reset**, and **locale**; **Excel/PDF** actions live in the **Report** section of the outcome panel (not the navbar); optional **display units** (annual CO₂ kt/year; constant electricity EUR/MWh or c/kWh) convert in **`buildScenarioPayload`** to canonical wire; browser **CSV import** for time-series fills the same bulk `seriesText` path as paste; advanced process assumptions show active literature-based defaults with metadata and allow explicit user overrides (see [`docs/repository-invariants.md`](docs/repository-invariants.md)) |
| Wire validation | `src/features/scenario/schemas/` | Zod schemas aligned with `ScenarioInput` |
| Domain | `src/core/domain/` | Types, units, temporal constants, assumption shapes |
| Engine | `src/core/calculation/` | Harmonization, daily engine, monthly/annual roll-ups |
| Reporting | `src/core/reporting/` | Export models, workbook/PDF builders |
| Tests | `test/` | Vitest unit/integration tests |
| Human specs | `docs/` | Solution spec, calculation spec, index, invariants |
| Source data | `sources/` | Raw input data (e.g. `electricity_prices.csv` — quarter-hourly Finnish spot prices from porssisahko.net) |
| Data pipeline scripts | `scripts/` | Deterministic transform scripts that produce checked-in artifacts in `src/data/` |
| Generated data artifacts | `src/data/` | App-consumable data modules generated from `sources/` (e.g. `electricity-defaults-2025-fi.ts`) — do not edit manually |
| Agent rules | `AGENTS.md` (root) | Non-negotiable rules for humans and automation |
| Cursor policy | `.cursor/rules.md` | Cursor-specific copy of core policy |

## Calculation flow (high level)

1. User edits scenario; on run, the UI maps form state through **`buildScenarioPayload`** (display-unit conversion and series text as applicable), then validates with **`safeParseScenarioInput`** (same schema as exports).
2. **`mergeProcessAssumptionsInput`** fills omitted process fields with flagged MVP defaults.
3. **`calculateScenario`** runs: SEC resolution (and warnings) → CO₂/electricity **daily** series (365 points) → optional CAPEX → per-day rows → monthly and annual summaries.
4. UI renders **`CalculationResult`** (KPIs, series, assumptions, opaque `warnings: string[]`). The **sticky app navbar** runs validation + calculation, resets the form, switches locale, and hosts the **flow stepper** (Setup → Advanced settings (optional) → Results → Report). **Results** and **Report** stay locked in the stepper until a successful run; after a run, the view scrolls to the outcome region. **Excel/PDF** downloads are triggered from the **Report** section (buttons disabled until a result exists). This is **layout/UX only**; wire and export contracts are unchanged.

Hourly inputs are supported on the wire; the engine is **daily-first** (CO₂ hourly → daily **sum**; electricity hourly → daily **arithmetic mean**).

## Current product surface (WP22–WP27)

- **Default language:** the UI first-paints in **Finnish** when no stored locale exists; **English** and **Swedish** are available via the locale control in the **sticky navbar** (grouped separately from Run/Reset on desktop). A stored `localStorage` preference still wins after the client effect (no hydration skew).
- **App-like flow:** the **sticky navbar** includes a persistent **stepper** for **Setup** → **Advanced settings (optional)** → **Results** → **Report**; **Run** and **Reset** are primary actions in the same bar. **Excel/PDF** export controls sit in the **Report** section after a successful run, not in the navbar.
- **Simple-first setup:** the main flow shows **Basic inputs** only — **annual CO₂** (`kt/year`), **utilization rate**, and **electricity purchase price** (`constant` or `historical_market_data_imported`). **Scenario name** and full CO₂/economics/process controls live under **Advanced setup**.
- **Default CO₂ mode:** new scenarios start in **`seasonal_daily`** with a **winter-weighted** default monthly profile (relative weights, normalized in-engine); **`flat_annual`**, **daily / hourly** time-series, and other modes remain in Advanced. Month names are **localized** where shown.
- **Assumptions policy (WP23+):** user-facing process inputs and “assumptions used” surfaces list only **calculation-active** process parameters (stoichiometric factors, SEC, and derived SEC (MWh) where shown). **`plantAvailabilityPct`** and **`processEfficiencyPct`** stay on the canonical wire for possible future use but are **not** user-facing active inputs and **not** shown in result or export assumption summaries.
- **Results (WP25):** a qualitative **economic verdict** and an **assumptions used in this calculation** block (grouped: scenario, CO₂, electricity, economics, CAPEX, process) appear on screen; the same readouts are reflected in **Excel** and **PDF** exports, alongside existing KPI/series content.
- **Presentation (WP26):** browser charts use axis labels and units, compact display units, and at most two decimal places in typical labels/tooltips; PDF charts use improved margins/domain padding. **Excel** data sheets keep numeric cells (number formats for display where used).
- **Home hero (WP27):** partner marks **Business Finland** and **LAB** load from static URLs **`/business-finland-logo.svg`** and **`/lab-logo.svg`** (place files in **`public/`**); they sit in the hero’s right column without a separate card, with alt text from i18n.

The visible electricity selector still offers only `constant` and `historical_market_data_imported`; retained internal support for `daily_series` and `hourly_series` still exists in schema, domain, engine, and export paths. Imported market defaults use deterministic repository-local **Finland 2025** datasets (VAT in source; see invariants / release memo). The setup UI initializes methane and hydrogen assumed sales prices to **`1200 EUR/t_CH4`** and **`4 EUR/kg_H2`**.

Further detail and regression guardrails: **[`docs/repository-invariants.md`](docs/repository-invariants.md)**.

## Export flow (high level)

1. From the **Report** section (export buttons in the outcome panel), the client POSTs **`{ "scenario": <wire> }`** to **`/api/export/excel`** or **`/api/export/pdf`** (see `src/app/api/export/parse-export-body.ts`), typically with the same wire as the last successful form run.
2. Server validates with Zod, merges process defaults, runs **`calculateScenario`**, then builds bytes from that result only.
3. The API does **not** accept a client-sent `CalculationResult` or KPI snapshot as authoritative. Extra JSON keys are ignored.

Details and regression checklist: **[`docs/repository-invariants.md`](docs/repository-invariants.md)**.

## Run the project

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build and production server

```bash
npm run build
npm start
```

## Tests and lint

```bash
npm test    # Vitest
npm run lint
```

## Where specs and policies live

| Document | Purpose |
|----------|---------|
| **[`docs/index.md`](docs/index.md)** | Documentation hub and navigation |
| **[`docs/solution-spec-v2.md`](docs/solution-spec-v2.md)** | Product scope, UX intent, MVP decisions |
| **[`docs/calculation-implementation-spec-v2.md`](docs/calculation-implementation-spec-v2.md)** | Formulas, units, result shape, calculation contracts |
| **[`docs/repository-invariants.md`](docs/repository-invariants.md)** | Export boundary, “do not regress”, known gaps |
| **[`AGENTS.md`](AGENTS.md)** | Mandatory rules for implementation (including agents) |
| **[`.cursor/rules.md`](.cursor/rules.md)** | Same policy, Cursor workspace entry |

## Agent and automation files

- **`AGENTS.md`** (repository root) — primary; keep discoverable for tools and humans.
- **`.cursor/rules.md`** — Cursor reads this path by convention; do not remove without updating team workflow.
- **`cursor_agents/`** — optional **internal** prompts and notes (legacy Cursor task splits, audits). **Not required** to run or build the app. See **[`cursor_agents/README.md`](cursor_agents/README.md)**.

## License / meta

`package.json` declares this package as private. Extend this section if the customer contract requires explicit license text.
