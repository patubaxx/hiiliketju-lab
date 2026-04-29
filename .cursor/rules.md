# Hiiliketju Repository Rules

**Navigation:** Human onboarding and commands live in **[`README.md`](../README.md)**; full doc listing in **[`docs/index.md`](../docs/index.md)**. Canonical automation rules are **[`AGENTS.md`](../AGENTS.md)** (repo root). This file mirrors core policy for Cursor.

---

## 1. Architectural intent

This repository implements a layered techno-economic scenario calculator.

Always preserve the separation between:
- UI
- calculation engine
- assumptions/parameter layer
- reporting/export layer

Never move formula logic into UI components.

---

## 2. MVP calculation policy

The current MVP policy is:

- internal engine = `daily`
- input contract = `daily | hourly`
- hourly CO₂ input is harmonized to daily using `sum`
- hourly electricity price is harmonized to daily using `arithmetic_mean`
- CO₂ and electricity are both mode-based inputs
- CAPEX is optional
- CAPEX method = `simple_lifetime_allocation`
- profitability price formula = `markup_on_cost`

Do not revert to:
- constant-only electricity input
- monthly-weighted-only availability logic
- annuity CAPEX as default MVP behavior

---

## 3. Supported input modes

### CO₂ availability
Supported modes:
- `flat_annual`
- `seasonal_daily`
- `time_series_daily`
- `time_series_hourly`

### Electricity price
Supported modes:
- `constant`
- `daily_series`
- `hourly_series`
- `historical_market_data_imported`

Any new code must respect these modes.

### Form conveniences (current product, WP1–WP3, WP22+)

- **Copy** distinguishes electricity **purchase** price, methane/hydrogen **sales price** inputs, and **derived** profitability outputs; do not rename wire fields for wording.
- **Default locale:** **Finnish** when no stored preference; **en** / **sv** available. **Simple-first** main form: annual CO₂ (`kt/year` only in the visible form), utilization, constant or imported electricity price; **Advanced** for scenario name, full CO₂ profile modes, economics, optional CAPEX, and **engine-active** process fields only.
- **Display units** in the scenario form: annual CO₂ is **`kt/year` only** (no selector); **constant** electricity purchase price may use **`EUR/MWh` or `c/kWh`**, converted in **`buildScenarioPayload`**. **Time-series** bulk entry does not add alternate display units in MVP.
- **Browser CSV import** for CO₂ / electricity time-series fills the same bulk text path as manual entry; it is **not** a new `ScenarioInput` mode or server ingest contract.
- **`plantAvailabilityPct` / `processEfficiencyPct`:** on the wire for future work; **not** user-facing active inputs in the current product (see [`docs/repository-invariants.md`](../docs/repository-invariants.md)).
- **WP28 capacity / market CO₂:** optional daily plant caps are `plant.electrolyzerMaxH2KgPerDay` (`kg H₂/day`) and `plant.methanationMaxCh4KgPerDay` (`kg CH₄/day`); missing / `null` means unbounded. Market CO₂ purchase fills only finite capacity when side-stream CO₂ is insufficient. Keep total process CO₂ feed, side-stream CO₂ used, and purchased CO₂ separate; side-stream recycling rate excludes purchased CO₂.

---

## 4. Assumption transparency rule

All non-user-provided assumptions must be explicit and inspectable.

Every assumption-like value must carry metadata or be traceable to metadata with:
- source
- status
- note

Allowed source values:
- `customer_provided`
- `product_locked`
- `literature_based`
- `placeholder`
- `derived`

Allowed status values:
- `confirmed`
- `estimated`
- `pending_customer_confirmation`
- `placeholder_only`

---

## 5. Literature-based values rule

Any stoichiometric, SEC, or literature-estimated process value must be flagged with:
- `assumptionSource = "literature_based"`
- `assumptionStatus = "estimated"` or `pending_customer_confirmation`

This includes at minimum the **user-facing engine-active** parameters:
- stoichiometricHydrogenDemandFactor
- stoichiometricMethaneYieldFactor
- electrolyzerSpecificEnergyConsumption
- (plus any other parameter surfaced as an active Advanced input)

**Note:** `plantAvailabilityPct` / `processEfficiencyPct` defaults remain in domain merge logic for **future** engine use; do **not** treat them as currently user-facing active Advanced fields in new UI. Any future literature-estimated process modifier must follow the same flagging rules.

Never hide these as plain constants without metadata.

---

## 6. Locked MVP defaults

Use these defaults unless explicitly changed by the user/spec:

- `stoichiometricHydrogenDemandFactor = 0.1832 kg_H2/kg_CO2`
- `stoichiometricMethaneYieldFactor = 0.3645 kg_CH4/kg_CO2`
- `electrolyzerSpecificEnergyConsumption = 54 kWh/kg_H2`
- `electrolyzerSpecificEnergyConsumptionMWh = 0.054 MWh/kg_H2`
- `plantAvailabilityPct = 100`
- `processEfficiencyPct = 100`
- `methanePriceUnit = EUR/t_CH4`

Remember:
these are valid MVP defaults, but still literature-based estimated values unless separately customer-confirmed.

---

## 7. Formula implementation rules

Implement formulas as pure, named functions.

Required formula groups:
- temporal harmonization
- stoichiometric hydrogen demand
- stoichiometric methane production
- electricity consumption
- electricity cost
- optional CAPEX allocation
- break-even methane price
- profitability prices
- hydrogen alternative revenue

No duplicated formulas across files unless there is a strong reason.

---

## 8. UI and export rules

UI must:
- render inputs (Simple-first; full detail in Advanced)
- show warnings
- render results from canonical output
- visibly distinguish literature-based and placeholder assumptions for **active** process fields
- not present internal future-only wire fields (e.g. plant availability / process efficiency) as **active** user inputs unless product re-opens them

Excel/PDF exports must:
- include assumptions and **verdict / used assumptions** readouts consistent with the UI reporting layer
- include flags/metadata for literature-based **active** assumptions
- not create their own independent **calculation** logic (readout text may interpret existing summary fields)

Shipped HTTP exports (`/api/export/excel`, `/api/export/pdf`) must validate `scenario` on the server, run `calculateScenario`, then map that result. The request body must not treat a client-provided `CalculationResult` (or partial KPIs) as authoritative.

---

## 9. Placeholder policy

Placeholders are allowed only when clearly marked.

Use placeholders for:
- unfinished customer values
- unfinished future features
- temporary technical scaffolding

Never present placeholders as real analysis values.

Preferred labels:
- `TODO(customer-confirmation)`
- `TODO(future)`
- `TODO(implementation)`
- `development_only`

---

## 10. Implementation preference

Prefer:
- explicit types
- pure functions
- deterministic outputs
- unit-aware naming
- narrow, composable modules

Avoid:
- hidden magic numbers
- mixed UI/domain responsibilities
- speculative abstractions with no current use
- silent fallbacks that change business meaning
