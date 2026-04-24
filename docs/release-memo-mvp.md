# Hiiliketju — MVP Release Memo

**Date:** April 2026  
**Scope:** WP15–WP18 accepted baseline  
**Audience:** Internal team and customer handoff

---

## 1. What the tool now does

Hiiliketju is a browser-based techno-economic scenario calculator for biogenic CO₂ utilization. It compares two value-chain paths for a fixed 365-day annual period:

- **Path A — synthetic methane:** CO₂ + H₂ → CH₄ via electrolysis and methanation. The tool computes hydrogen demand, electricity consumption, full cost stack, and methane sales revenue.
- **Path B — hydrogen sales alternative:** CO₂ is released, the hydrogen is sold directly. The tool computes the corresponding annual revenue and compares it against Path A.

All numbers come from a single canonical calculation (`calculateScenario`) that runs a daily-resolution engine (365 timesteps per year). The UI and both export formats (Excel, PDF) consume the same result — no business logic is duplicated across layers.

---

## 2. Current user-visible capabilities

### Scenario inputs

| Input | Details |
|---|---|
| Annual CO₂ availability | kt/year (fixed unit); flat annual, seasonal monthly weights, daily time series (365 kg/day), or hourly time series (8 760 kg/h) |
| CO₂ utilization rate | % of available CO₂ actually processed |
| Electricity purchase price | Constant (EUR/MWh or c/kWh) or imported market data (Finland 2025, daily or hourly; user can override with own series) |
| Methane assumed sales price | EUR/t CH₄ — default 1 200 EUR/t CH₄ |
| Hydrogen assumed sales price | EUR/kg H₂ — default 4 EUR/kg H₂ |
| Other annual OPEX | EUR/year |
| CAPEX (optional) | Electrolyzer and methanation CAPEX (EUR) with lifetime (years); allocated linearly over 365 days |
| Advanced process assumptions | Five overridable parameters with explicit source/status/note metadata (see below) |

### Advanced process assumptions (overridable with metadata)

| Parameter | Default value | Source |
|---|---|---|
| Stoichiometric H₂ demand | 0.1832 kg H₂ / kg CO₂ | Literature-based, estimated |
| Stoichiometric CH₄ yield | 0.3645 kg CH₄ / kg CO₂ | Literature-based, estimated |
| Electrolyzer SEC | 54 kWh / kg H₂ | Literature-based, estimated |
| Plant availability | 100 % | Literature-based (neutral MVP default; not yet applied in engine — see caveats) |
| Process efficiency | 100 % | Literature-based (neutral MVP default; not yet applied in engine — see caveats) |

### Outputs

- **Annual KPIs:** CO₂ available and utilized, recycling rate, methane production, hydrogen demand, electricity consumption, variable cost, CAPEX allocation, total cost, methane revenue, hydrogen-sales alternative revenue
- **Derived profitability:** break-even methane sales price, methane price at 10 % and 30 % markup on cost
- **Path comparison:** annual revenue delta between Path A (methane) and Path B (hydrogen sales)
- **Time series:** daily charts for CO₂ availability, electricity purchase price, methane production, cost vs revenue
- **Tables:** annual summary, monthly aggregates, daily row preview
- **Exports:** Excel workbook and PDF report — both include all process assumption metadata (source, status, note)
- **Warnings:** engine warnings (e.g. literature-based defaults in use, SEC inconsistency) appear in results and exports

---

## 3. Important caveats and limitations

### 3.1 Imported electricity defaults include consumer VAT

`sources/electricity_prices.csv` (porssisahko.net) provides Finnish consumer-facing prices **including VAT** (25.5 % in 2025). The generated artifact `src/data/electricity-defaults-2025-fi.ts` inherits this. Industrial electricity procurement prices are typically ex-VAT and therefore ~20–25 % lower.

**User action required:** Replace the defaults with actual contracted procurement prices for any industrial scenario. The UI tooltip states "VAT included." A more prominent UI disclosure is planned for WP20.

### 3.2 Plant availability and process efficiency not yet applied

Both parameters are stored with assumption metadata, shown in advanced assumptions, and included in exports — but the MVP daily calculation engine does not apply them. Setting plant availability to 80 % has no effect on computed outputs. Both values are neutral at 100 % in the engine.

The UI displays an amber notice and the PDF export includes an explanatory paragraph. Activation is planned for WP23 after product-level semantics are agreed.

### 3.3 Commercial default prices need user verification

Methane (1 200 EUR/t CH₄) and hydrogen (4 EUR/kg H₂) form defaults are starting-point estimates, not confirmed project values. Results change significantly with different prices; users should always verify these before reading conclusions.

### 3.4 Stoichiometric defaults are literature estimates

All five process defaults (stoichiometric factors, SEC) are literature-based and flagged as `estimated`. They appear in results and exports with explicit metadata. Override with project-specific values in the Advanced section when available.

### 3.5 Fixed 365-day non-leap-year period

The analysis period is always 365 days. Leap years and multi-year analyses are not supported.

### 3.6 No scenario persistence

All form state is held in browser memory. Refreshing the page resets the form. There is no save, load, or multi-scenario comparison feature. Scenario persistence is planned for WP22.

### 3.7 No authentication or rate limiting

The application has no user authentication. Export endpoints have no rate limiting or abuse protection beyond platform defaults.

### 3.8 Electricity data covers Finland 2025 only

The bundled default covers one market (Finland) and one year (2025). Users from other markets or wanting multi-year averages must supply their own series via paste or CSV import.

### 3.9 CSV time-series import is browser-side only

CSV import fills the existing series text field; it does not introduce new calculation modes or server-side ingest. Supported formats are defined in `parse-time-series-csv.ts`. Arbitrary spreadsheet dialects may not parse correctly.

### 3.10 ASCII-only export filenames

Content-Disposition uses `filename=` only (no RFC 5987 `filename*`). Non-ASCII characters in scenario names are sanitized in the download filename.

---

## 4. Assumptions users should verify before treating results as decision-ready

Before using results for project decisions, confirm the following:

1. **Electricity purchase price** — Is the entered price (or imported default) representative of your actual industrial procurement cost, ex-VAT?
2. **Methane assumed sales price** — Does 1 200 EUR/t CH₄ reflect your expected market or contracted price?
3. **Hydrogen assumed sales price** — Does 4 EUR/kg H₂ reflect your expected market or contracted price?
4. **CO₂ availability and utilization rate** — Do the entered values reflect your actual plant capacity and availability profile?
5. **Stoichiometric process parameters** — Are the literature defaults appropriate, or do you have project-specific electrolysis performance data?
6. **CAPEX** — If CAPEX is included, are the investment figures and lifetime representative of your project?
7. **Plant availability** — Note that the engine currently ignores this value; it is recorded for future use only.

---

## 5. Recommended next-step roadmap

The following improvements are planned after WP18, in priority order:

### WP19 — Homepage guidance enhancement (this release)
Improve hero text and add a "before interpreting results" callout on the front page. Produce this memo as a deliverable.

### WP20 — Imported electricity UX: VAT prominence + data summary statistics
Upgrade the VAT caveat from a small tooltip to a visible warning in the electricity section. Add inline summary statistics (mean, min, max) for the loaded Finland 2025 dataset.

### WP21 — Commercial assumption confirmation UX
Add a visible prompt when methane or hydrogen prices still match the form defaults, reminding users to verify project-specific values.

### WP22 — Scenario persistence (browser localStorage)
Allow users to save and reload named scenarios from browser local storage. Includes a schema-version guard for safe future evolution.

### WP23 — Plant availability and process efficiency activation
Wire both parameters into the daily calculation engine after the product semantics are formally agreed and documented.

### Later / strategic
- Multi-market and multi-year electricity defaults
- Scenario side-by-side comparison view
- Structured warnings with severity levels
- Richer Excel assumptions summary tab

---

## 6. Architecture and contract invariants (for maintainers)

The following must not regress across future work:

- `calculateScenario(validated ScenarioInput) → CalculationResult` is the **only** source of business numbers for UI and exports.
- Export routes (`POST /api/export/excel`, `POST /api/export/pdf`) accept `{ "scenario": <wire> }`, validate with Zod, merge process defaults, and recompute. They do **not** accept a client-sent result object as authoritative.
- Process assumption metadata (`assumptionSource`, `assumptionStatus`, `assumptionNote`) propagates from domain defaults or user overrides through calculation into exports without modification by mappers.
- Hidden wire modes (`daily_series`, `hourly_series`) remain valid in schema, domain, engine, and exports even though they are not visible in the UI selector.
- See [`docs/repository-invariants.md`](repository-invariants.md) for the full regression checklist.

---

*This memo reflects the accepted state as of April 2026 (WP15–WP18 baseline). For calculation contracts and formula details see [`docs/calculation-implementation-spec-v2.md`](calculation-implementation-spec-v2.md). For product scope and principles see [`docs/solution-spec-v2.md`](solution-spec-v2.md).*
