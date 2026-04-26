# Hiiliketju — MVP Release Memo

**Date:** April 2026  
**Scope:** Accepted product after **WP22–WP27** customer-delivery tranche (on top of earlier MVP foundations)  
**Audience:** Internal team and customer handoff

---

## 1. What the tool does

Hiiliketju is a browser-based techno-economic scenario calculator for biogenic CO₂ utilization. It compares two value-chain paths for a fixed **365-day** annual period:

- **Path A — synthetic methane:** CO₂ + H₂ → CH₄ via electrolysis and methanation. The tool computes hydrogen demand, electricity consumption, full cost stack, and methane sales revenue.
- **Path B — hydrogen sales alternative:** CO₂ is released; hydrogen is sold directly. The tool computes the corresponding annual revenue and compares it against Path A.

All business numbers come from a single canonical calculation: **`calculateScenario(validated ScenarioInput) → CalculationResult`**. The UI and both export formats consume that result — formulas are not duplicated across layers.

---

## 2. Current user-visible capabilities

### Locale and setup (WP22)

- **Default language:** the app **first-paints in Finnish** when no stored preference exists; **English** and **Swedish** are selectable. A stored browser preference still applies after hydration.
- **Simple-first:** the main screen shows **Basic inputs** — annual **CO₂** (`kt/year`), **utilization rate**, and **electricity purchase price** (constant or imported market data). **Scenario name** and full configuration live under **Advanced setup**.

### Scenario inputs (summary)

| Area | Details |
|------|---------|
| Annual CO₂ | `kt/year` in the form; default **seasonal** mode (**WP24**) with **winter-weighted** monthly **relative** weights (normalized to the annual total in-engine). **`flat_annual`**, **daily / hourly** time series, etc., remain in Advanced. |
| CO₂ utilization | % of available CO₂ processed |
| Electricity | **Purchase** price: **constant** (`EUR/MWh` or `c/kWh` in the form → canonical `EUR/MWh`) or **imported market data** (Finland 2025 bundled defaults; user can paste/import own series). |
| Economics | Methane and hydrogen **assumed sales** prices (defaults **1 200 EUR/t CH₄**, **4 EUR/kg H₂** — verify for your case), other OPEX |
| CAPEX | Optional; simple linear allocation over the selected lifetime |
| Advanced process | **Engine-active** parameters only (**WP23**): stoichiometric H₂ demand, stoichiometric CH₄ yield, electrolyzer SEC (+ derived MWh where shown). **`plantAvailabilityPct`** and **`processEfficiencyPct`** exist on the wire for **future** use; they are **not** user-facing active inputs and **not** shown in “assumptions used” or export assumption summaries. |

### Outputs and readouts

- **KPIs, charts, tables** as before (annual, monthly, daily preview; time series charts).
- **Economic verdict (WP25):** small, color-coded band (favourable / mixed / unfavourable / not computable) — **interpretive only**, from existing annual summary fields; **not** an investment recommendation.
- **Assumptions used in this calculation (WP25):** grouped list (scenario, CO₂, electricity, economics, CAPEX, process), including Simple defaults. Excludes internal future-only fields not surfaced as active (e.g. plant availability / process efficiency in user-facing lists).

### Presentation (WP26)

- Charts: **axis labels and units**; compact units (EUR / kEUR / MEUR, mass, energy) where helpful; **≤ 2 decimals** in typical ticks/tooltips/tables. **One** lower caption per chart (duplicate in-SVG X label removed in follow-up). **Cost vs. revenue** uses clearly distinct line colours.
- **PDF:** improved chart margins, y-domain padding, clamped plot coordinates, compact ticks, larger fonts.
- **Excel:** numeric data cells preserved; **number formats** for display where appropriate (not wholesale string replacement).

### Home hero (WP27)

- Optional **Business Finland** and **LAB** marks: static URLs **`/business-finland-logo.svg`** and **`/lab-logo.svg`** (files in **`public/`**). **i18n alt** text; **no** visible “Partners / Kumppanit / Samarbetspartners” label; logos are **not** in a separate card (follow-up).

### Exports

- **Excel** and **PDF** include material consistent with the **verdict** and **used assumptions** readouts, alongside inputs, series, and summaries.  
- **UX (accepted 2026):** the app uses an **app-like phased flow** with a **sticky stepper** in the navbar (**Setup** → **Advanced settings (optional)** → **Results** → **Report**). **Excel/PDF** download buttons sit in the **Report** section (not the navbar) and stay disabled until a run succeeds. This is **presentation/navigation only**.
- **Export API:** `POST` with **`{ "scenario": <wire> }`** only; server validates, merges defaults, runs **`calculateScenario`**, builds bytes — **no** authoritative client-sent **`CalculationResult`** (unchanged).

---

## 3. Important caveats and limitations (MVP)

### 3.1 Imported electricity defaults include consumer VAT

Bundled Finland 2025 data (`sources/electricity_prices.csv` → generated artifact) reflects consumer-facing prices **including VAT** (25.5 % in 2025). Industrial procurement is often ex-VAT.

**User action:** Replace with your actual contract or procurement prices when the case requires it. The UI surfaces visible disclosure on the imported path.

### 3.2 Plant availability and process efficiency

Both fields remain on **`ScenarioInput`** with neutral **100 %** defaults in merge logic. The **shipped daily engine does not apply them as multipliers.** They are **not** offered as active user-facing Advanced inputs and **not** listed in user-facing “assumptions used” summaries (**WP23**). Future engine wiring would be a **separate scoped** change.

### 3.3 Commercial default prices

Methane and hydrogen form defaults are **starting points**, not confirmed project values.

### 3.4 Stoichiometric / SEC literature defaults

Active process defaults (H₂ demand, CH₄ yield, SEC) are **literature-based** and flagged; override in Advanced when you have project data.

### 3.5 Fixed 365-day period

Non-leap year; no multi-year model in MVP.

### 3.6 No scenario persistence

Form state is **browser memory** only (refresh clears). **No** save/load in MVP. *(Earlier internal roadmaps may have named “WP22” for persistence — that naming is **obsolete**; **WP22** in the **accepted** codebase is default Finnish + Simple-first.)*

### 3.7 No authentication or rate limiting

As before.

### 3.8 Electricity bundled data: Finland 2025

Users from other markets need their own series.

### 3.9 CSV import is browser-side

Fills the existing bulk series path; not a new server ingest contract.

### 3.10 ASCII-only export filenames

As before.

### 3.11 Non-goals (unchanged)

No dispatch optimization, storage dynamics, **NPV/IRR/payback**, or full investment suite in MVP.

---

## 4. Assumptions to verify before decision use

1. **Electricity purchase price** — Representative of your real procurement (note VAT on bundled defaults).  
2. **Methane / hydrogen assumed sales prices** — Match your market or contract expectations.  
3. **CO₂ and utilization** — Match plant/data reality.  
4. **Stoichiometric / SEC** — Replace literature defaults if you have better data.  
5. **CAPEX** — If included, check amounts and lifetime.  
6. **Plant availability / process efficiency** — **Not** applied in the engine today; do not treat UI/export as if they were active levers.

---

## 5. Architecture invariants (maintainers)

- **`calculateScenario` → `CalculationResult`** is the **only** source of business numbers for UI and exports.  
- **Export routes** accept **`{ "scenario": <wire> }`**, Zod-validate, **`mergeProcessAssumptionsInput`**, recompute, then build — **no** client result object as authority.  
- **Hidden wire modes** (`daily_series` / `hourly_series` for electricity, etc.) stay valid in schema/engine/exports where applicable; visible selector remains narrower.  
- Full checklist: **[`docs/repository-invariants.md`](repository-invariants.md)**.

---

## 6. Historical internal roadmap (pre-WP22 naming)

The following items appeared in an **earlier** internal memo (WP15–WP18 era) as **planned** follow-ups. **They are not commitment dates.** Some ideas shipped under **different** WP numbers (e.g. VAT prominence and assumption nudges were absorbed into later UX; **“WP22 = persistence”** is **not** the accepted meaning of **WP22** in the current codebase — see **§2** above).

- Homepage / hero / electricity disclosure refinements  
- Optional future: browser **localStorage** scenario persistence (not in current MVP)  
- Optional future: engine activation of **plant availability / process efficiency** after agreed semantics  
- Broader: multi-market defaults, side-by-side scenarios, structured warning severities

For the **original WP1–WP10 build sequence** and the **separate WP22–WP27 list**, see **[`docs/solution-spec-v2.md`](solution-spec-v2.md) §16**.

---

*This memo reflects the **April 2026** accepted state after **WP22–WP27**. For formulas and contracts see [`docs/calculation-implementation-spec-v2.md`](calculation-implementation-spec-v2.md). For product scope see [`docs/solution-spec-v2.md`](solution-spec-v2.md). Not a source file for automated agents — see [`AGENTS.md`](../AGENTS.md).*
