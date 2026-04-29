# AGENTS.md

## Documentation map

- **[`README.md`](README.md)** — Project entry: architecture summary, folder map, run/test commands, export flow.
- **[`docs/index.md`](docs/index.md)** — Index of all human-facing specs and maintainer docs.
- **[`docs/solution-spec-v2.md`](docs/solution-spec-v2.md)** — Product / MVP scope and principles.
- **[`docs/calculation-implementation-spec-v2.md`](docs/calculation-implementation-spec-v2.md)** — Calculation contracts, units, formulas.
- **[`docs/repository-invariants.md`](docs/repository-invariants.md)** — Current export boundary and regression checklist (consolidated from former milestone handoffs).
- **[`docs/internal-memo-fi.md`](docs/internal-memo-fi.md)** — Finnish memo of project Hiiliketju general functionalities intended for human use; not to be used as source or guidance for agents.
- **[`docs/release-memo-mvp.md`](docs/release-memo-mvp.md)** — English handoff memo (updated with **WP22–WP28**); human-facing; not an automation spec.
- **[`.cursor/rules.md`](.cursor/rules.md)** — Cursor workspace copy of core policy (keep for tool discoverability).
- **[`cursor_agents/README.md`](cursor_agents/README.md)** — Optional legacy prompts; not required for runtime.

---

## Project Context

This repository implements the Hiiliketju techno-economic calculation application.

The project goal is to evaluate and compare:
- **Path A:** `CO2 + H2 -> CH4`
- **Path B:** `CO2 released + H2 sold`

The architecture is intentionally layered:
- UI layer
- calculation engine
- assumptions / parameter layer
- reporting / export layer

Do not collapse these layers together.

---

## Accepted input UX (WP1–WP3 and WP22–WP28, current product)

These are **documentation anchors** for behaviour already shipped; they do not relax calculation or wire contracts. **Source of detail:** [`docs/repository-invariants.md`](docs/repository-invariants.md).

- **Copy:** electricity is framed as **purchase / procurement price**; methane and hydrogen economics as **assumed sales prices**; profitability KPIs that depend on costs remain **derived** from **`calculateScenario`**. Wire field names were not renamed for wording.
- **Display units:** the form shows **annual CO₂** as `kt/year` (fixed, no unit selector) and **constant** electricity purchase price as `EUR/MWh` or `c/kWh` (user-selectable). Convert in **`buildScenarioPayload`** (or shared domain helpers), not scattered in presentational components. **Canonical wire** stays `kt/year` / `EUR/MWh` for those fields; **time-series** and **exports** stay canonical. (Internal conversion helpers for `kg/year` remain in domain code to preserve future flexibility; they are not exposed in the visible UI.)
- **Visible vs retained electricity modes:** the visible scenario form offers only **`constant`** and **`historical_market_data_imported`**. Internal schema / domain / engine / export support for **`daily_series`** and **`hourly_series`** remains intact.
- **Imported market defaults:** `historical_market_data_imported` initializes from deterministic repository-local Finland 2025 data. Hourly defaults come from the delivered source material; daily defaults are derived from those hourly prices by arithmetic mean per calendar date.
- **Current commercial setup defaults:** methane assumed sales price initializes to `1200 EUR/t_CH4`; hydrogen assumed sales price initializes to `4 EUR/kg_H2`.
- **CSV import:** browser-only parsing into the existing bulk **`seriesText`** path for CO₂ and electricity time-series where the UI offers it; **no** new calculation modes and **no** new `ScenarioInput` shapes.
- **Default UI language (WP22):** **Finnish** first paint when no `localStorage` locale; **en** / **sv** available; stored preference applies after mount.
- **Simple-first (WP22):** main path shows **annual CO₂**, **utilization**, **electricity purchase price**; **Advanced** holds scenario name, full CO₂ modes, economics, CAPEX, and **engine-active** process overrides only.
- **Default CO₂ mode (WP24):** new scenarios start **`seasonal_daily`** with **winter-weighted** default monthly **relative** weights (see invariants for numbers).
- **Active process policy (WP23):** user-facing Advanced and “assumptions used” / export surfaces list **only** parameters the **engine** uses (stoichiometric factors, SEC, derived MWh where applicable). **`plantAvailabilityPct` / `processEfficiencyPct`:** retained on `ScenarioInput` for possible future work — **not** user-facing active inputs, **not** in used-assumption summaries as active levers.
- **Results readout (WP25):** **economic verdict** + **assumptions used** — reporting interpretation from existing summary fields, **not** new KPI math; **not** investment advice. Excel/PDF include consistent readout material.
- **Presentation (WP26):** axis labels, compact units, two-decimal display in typical UI/PDF labels; PDF chart robustness; Excel keeps numeric cells.
- **Home hero (WP27):** optional partner SVGs from **`/business-finland-logo.svg`**, **`/lab-logo.svg`** (`public/`); i18n alts.
- **App shell (accepted UX):** **sticky navbar** with **flow stepper** (**Setup** → **Advanced settings (optional)** → **Results** → **Report**), **Run**, **Reset**, and **locale**; **Excel/PDF** download actions live in the **Report** section after a successful run (not duplicated in the navbar). **Export authority unchanged:** server validates **`scenario`**, runs **`calculateScenario`**, builds files.
- **WP28 capacity / market CO₂:** optional daily plant caps are **`plant.electrolyzerMaxH2KgPerDay`** (`kg H₂/day`) and **`plant.methanationMaxCh4KgPerDay`** (`kg CH₄/day`); missing / `null` means unbounded. Optional **`co2.marketPurchase`** buys market CO₂ only to fill a finite plant capacity when side-stream CO₂ is insufficient. Results and exports must keep **total process CO₂ feed** separate from **side-stream CO₂ used** and **purchased CO₂**. **Side-stream recycling rate excludes purchased CO₂.** This is not dispatch optimization, storage, equipment sizing economics, or CAPEX logic.

---

## Non-Negotiable Rules

1. **Do not put calculation logic into React components.**
2. **Do not duplicate calculation formulas across UI, Excel, and PDF.**
3. **All outputs must come from one canonical calculation result.**
4. **The internal MVP engine is daily-first.**
5. **Input contracts must remain compatible with daily and hourly source data.**
6. **Do not reintroduce legacy assumptions that were removed from MVP:**
   - constant electricity price only
   - monthly-weighted-only CO₂ model
   - annuity CAPEX as default MVP logic
7. **Keep all units explicit in code.**
8. **Any non-user-provided value must have explicit assumption metadata.**
9. **All literature-estimated stoichiometric or process values must be clearly flagged.**
10. **Never present placeholder or literature-based defaults as customer-confirmed facts.**

---

## Assumption Flag Standard

Any assumption-like parameter must support explicit metadata.

Minimum structure:

```ts
type AssumptionMeta = {
  assumptionSource:
    | "customer_provided"
    | "product_locked"
    | "literature_based"
    | "placeholder"
    | "derived"
  assumptionStatus:
    | "confirmed"
    | "estimated"
    | "pending_customer_confirmation"
    | "placeholder_only"
  assumptionNote?: string
}
```

### Mandatory usage

Use `literature_based` for:

* stoichiometric hydrogen demand factor
* stoichiometric methane yield factor
* electrolyzer SEC defaults
* any literature-derived plant availability / efficiency defaults
* any other literature-estimated techno-economic assumption

---

## Locked MVP Decisions

These are locked unless the user explicitly changes them:

* internalCalculationResolution = `daily`
* supported CO₂ modes:

  * `flat_annual`
  * `seasonal_daily`
  * `time_series_daily`
  * `time_series_hourly`
* supported electricity price modes (internal contracts — all four remain valid for schema, engine, and exports):

  * `constant`
  * `daily_series`
  * `hourly_series`
  * `historical_market_data_imported`

  **Visible UI selector (WP15+):** only `constant` and `historical_market_data_imported` are selectable in the scenario form. `daily_series` and `hourly_series` remain supported internally.
* hourly CO₂ to daily aggregation = `sum`
* hourly electricity price to daily aggregation = `arithmetic_mean`
* CAPEX is optional
* CAPEX method = `simple_lifetime_allocation`
* methane pricing unit = `EUR/t_CH4`
* profitability prices use `markup_on_cost`

---

## Formula Direction

Base process model:

* electrolysis: `2 H2O -> 2 H2 + O2`
* methanation: `CO2 + 4 H2 -> CH4 + 2 H2O`

Locked MVP defaults:

* stoichiometricHydrogenDemandFactor = `0.1832 kg_H2/kg_CO2`
* stoichiometricMethaneYieldFactor = `0.3645 kg_CH4/kg_CO2`
* electrolyzerSpecificEnergyConsumption = `54 kWh/kg_H2`
* electrolyzerSpecificEnergyConsumptionMWh = `0.054 MWh/kg_H2` (derived from electrolyzerSpecificEnergyConsumption)
* plantAvailabilityPct = `100`
* processEfficiencyPct = `100`

These defaults must be implemented as clearly flagged assumptions, not hard-coded anonymous magic numbers.

---

## Coding Rules

### Domain layer

* Keep domain types explicit and unit-aware.
* Prefer descriptive names over short names.
* Never hide unit transformations inside presentational UI helpers; map display units to wire in **`buildScenarioPayload`** (or domain conversion helpers it calls).
* Separate user-facing units from internal canonical units.

### Calculation layer

* Use small pure functions.
* Keep harmonization logic separate from core formulas.
* Validate input before calculation.
* Return deterministic results.
* Avoid side effects.

### UI layer

* UI may format and visualize results, but must not recalculate business outputs.
* Display **engine-active** literature-based assumptions clearly in **Advanced** and in results/exports. Do **not** present **`plantAvailabilityPct` / `processEfficiencyPct`** as user-facing active inputs until product requires it.
* Show warnings if customer confirmation is still pending.

### Reporting layer

* Export layers consume **canonical `CalculationResult` only** (map and format; no independent KPI or harmonization **math**). **Verdict** and **used assumptions** are allowed as **readout/interpretation** from existing summary fields, not as substitute engine output.
* Shipped Excel/PDF downloads use server routes that validate a wire `scenario`, run `calculateScenario`, then build bytes from that result. Do not accept a client-sent result object as authoritative input on the export API.
* Excel and PDF must include **assumptions metadata** for **active** fields and align **verdict / used assumptions** with the UI readout layer.
* Literature-based defaults for **active** process parameters must be visible where those parameters are user-facing.

---

## Testing Rules

At minimum, protect:

* temporal harmonization
* CAPEX include/exclude behavior
* stoichiometric formulas
* profitability formulas
* assumption flag propagation
* result shape integrity

Before golden scenarios exist, prioritize:

* shape tests
* harmonization tests
* formula unit tests
* edge case tests

---

## When In Doubt

Prefer:

* explicitness over convenience
* visible assumptions over hidden defaults
* deterministic domain logic over UI-derived calculations
* simple MVP-compatible solutions over speculative future complexity
