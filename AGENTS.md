# AGENTS.md

## Documentation map

- **[`README.md`](README.md)** — Project entry: architecture summary, folder map, run/test commands, export flow.
- **[`docs/index.md`](docs/index.md)** — Index of all human-facing specs and maintainer docs.
- **[`docs/solution-spec-v2.md`](docs/solution-spec-v2.md)** — Product / MVP scope and principles.
- **[`docs/calculation-implementation-spec-v2.md`](docs/calculation-implementation-spec-v2.md)** — Calculation contracts, units, formulas.
- **[`docs/repository-invariants.md`](docs/repository-invariants.md)** — Current export boundary and regression checklist (consolidated from former milestone handoffs).
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

## Accepted input UX (WP1–WP3, current product)

These are **documentation anchors** for behaviour already shipped; they do not relax calculation or wire contracts.

- **Copy:** electricity is framed as **purchase / procurement price**; methane and hydrogen economics as **assumed sales prices**; profitability KPIs that depend on costs remain **derived** from **`calculateScenario`**. Wire field names were not renamed for wording.
- **Display units:** the form may show **annual CO₂** as `kt/year` or `kg/year` and **constant** electricity purchase price as `EUR/MWh` or `c/kWh`. Convert in **`buildScenarioPayload`** (or shared domain helpers), not scattered in presentational components. **Canonical wire** stays `kt/year` / `EUR/MWh` for those fields; **time-series** and **exports** stay canonical.
- **CSV import:** browser-only parsing into the existing bulk **`seriesText`** path for CO₂ and electricity time-series where the UI offers it; **no** new calculation modes and **no** new `ScenarioInput` shapes.

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
* supported electricity price modes:

  * `constant`
  * `daily_series`
  * `hourly_series`
  * `historical_market_data_imported`
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
* Display literature-based assumptions clearly in advanced assumptions and exports.
* Show warnings if customer confirmation is still pending.

### Reporting layer

* Export layers consume canonical result only (map and format; no independent KPI or harmonization math).
* Shipped Excel/PDF downloads use server routes that validate a wire `scenario`, run `calculateScenario`, then build bytes from that result. Do not accept a client-sent result object as authoritative input on the export API.
* Excel and PDF must include assumptions metadata.
* Literature-based defaults must be visible in exports.

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
