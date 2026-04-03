# Hiiliketju Repository Rules

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

This includes at minimum:
- stoichiometricHydrogenDemandFactor
- stoichiometricMethaneYieldFactor
- electrolyzerSpecificEnergyConsumption
- plantAvailabilityPct default
- processEfficiencyPct default
- any future literature-estimated process modifier

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
- render inputs
- show warnings
- render results from canonical output
- visibly distinguish literature-based and placeholder assumptions

Excel/PDF exports must:
- include assumptions
- include flags/metadata for literature-based assumptions
- not create their own independent calculation logic

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
````