# Cursor Agent Prompt — Agent 1: Domain, Schemas & Temporal Input Foundation

Your task is to build the domain foundation for the Hiiliketju project as the first technical implementation layer.

## Goal

Create a strong, extensible, implementation-ready domain layer for the calculator.

Your focus areas are:
1. TypeScript domain types
2. Zod validation schemas
3. assumption metadata / flags
4. temporal input contracts for CO₂ and electricity
5. temporal harmonization-ready profile structures
6. clean module boundaries that support later formula implementation

Do **not** build React components or export logic.
Do **not** implement full business UI behavior.
Do **not** hardcode business logic into the UI layer.

---

## Context

This is a browser-based techno-economic calculator where the application must compare:

- **Path A:** `CO2 + H2 -> CH4`
- **Path B:** `CO2 released + H2 sold`

The architecture direction is already decided:
- Next.js + TypeScript
- calculation logic must be separated from UI
- one canonical calculation result structure must later serve UI, Excel, and PDF
- the internal MVP engine is **daily-first**
- the input contract must support **daily and hourly** source data
- the process model is **stoichiometric + literature-based defaults + customer/business inputs**
- assumptions must be explicitly traceable and inspectable

The implementation should be production-oriented, minimal, and maintainable.

---

## Locked assumptions for this task

Use these assumptions as fixed:

- project working language: **English**
- MVP UI language: **UI is multilingual-ready; MVP primary language is English, with Finnish and Swedish supported incrementally.**
- internal calculation resolution = **daily**
- input contract may support **daily** and **hourly**
- annual calculation period is always **365 days**
- no persistence/database logic
- no export logic
- no UI business logic
- no annuity CAPEX logic in MVP core
- CO₂ availability must be mode-based
- electricity price must be mode-based
- all literature-estimated stoichiometric / SEC / process defaults must be explicitly flagged

### Locked CO₂ modes
- `flat_annual`
- `seasonal_daily`
- `time_series_daily`
- `time_series_hourly`

### Locked electricity price modes
- `constant`
- `daily_series`
- `hourly_series`
- `historical_market_data_imported`

### Locked units
- CO₂ user-facing default = `kt/year`
- internal CO₂ = `kg/day`
- H₂ = `kg`
- CH₄ annual business unit = `t/year`
- methane price = `EUR/t_CH4`
- electricity = `MWh`
- electricity price = `EUR/MWh`

### Locked literature-based defaults that must be representable in the domain model
- `stoichiometricHydrogenDemandFactor = 0.1832 kg_H2/kg_CO2`
- `stoichiometricMethaneYieldFactor = 0.3645 kg_CH4/kg_CO2`
- `electrolyzerSpecificEnergyConsumption = 54 kWh/kg_H2`
- `electrolyzerSpecificEnergyConsumptionMWh = 0.054 MWh/kg_H2`
- `plantAvailabilityPct = 100`
- `processEfficiencyPct = 100`

These values must not exist as anonymous magic numbers. They must be representable with explicit assumption metadata.

---

## Deliverables

Implement the following.

### 1. Domain types

Create clean TypeScript types for at least:

- `AssumptionSource`
- `AssumptionStatus`
- `AssumptionMeta`
- `AvailabilityProfileInput`
- `ElectricityPriceInput`
- `ScenarioInput`
- `DailyProfilePoint`
- `ResolvedDailyElectricityPricePoint` or equivalent
- `DailyResult`
- `MonthlySummary`
- `ScenarioSummary`
- `CalculationResult`
- minimal unit-related types that make future unit expansion possible

Design principles:
- units should not exist only in field names
- use a lightweight model
- keep types readable and practical
- avoid building a huge quantity framework

### 2. Assumption metadata model

Create an explicit assumption metadata structure.

Minimum direction:

```ts
type AssumptionSource =
  | "customer_provided"
  | "product_locked"
  | "literature_based"
  | "placeholder"
  | "derived"

type AssumptionStatus =
  | "confirmed"
  | "estimated"
  | "pending_customer_confirmation"
  | "placeholder_only"

type AssumptionMeta = {
  assumptionSource: AssumptionSource
  assumptionStatus: AssumptionStatus
  assumptionNote?: string
}
````

This must be reusable across process assumptions, economic assumptions, and future export/UI inspection.

### 3. Validation schemas

Create Zod schemas for the main input structures.

Validation must cover at least:

* required fields
* numeric type checks
* non-negative values where appropriate
* utilization rate range 0–100
* scenario name required
* valid CO₂ amount
* valid methane price
* valid hydrogen price
* valid optional CAPEX inputs
* valid lifetime input when CAPEX is included
* mode-specific structural validation for CO₂ and electricity inputs
* daily vs hourly structure validation where appropriate

Important:

* validation messages should be clear and developer-friendly
* do not overcomplicate error abstraction
* schema logic must stay separate from calculation logic

### 4. Temporal input structures

Implement input structures for CO₂ and electricity.

#### CO₂ input

Support:

* `flat_annual`
* `seasonal_daily`
* `time_series_daily`
* `time_series_hourly`

#### Electricity input

Support:

* `constant`
* `daily_series`
* `hourly_series`
* `historical_market_data_imported`

Do not collapse these into one weakly typed bag.

### 5. Daily profile / harmonization-ready structures

Create the structures needed so later agents can harmonize inputs into canonical daily series.

At minimum, daily profile point should include:

* `dayIndex`
* `dateLabel`
* `monthIndex`
* `dayOfMonth`
* `availableCO2Kg`

For electricity, create an equivalent daily resolved structure that later agents can consume.

### 6. Seasonal daily CO₂ generator

Implement a pure function that can generate a 365-row daily CO₂ availability profile from:

* annual CO₂ amount
* a seasonal daily profile definition

Recommended direction:

* use a 12-month seasonal weighting model as the MVP implementation behind `seasonal_daily`
* return a 365-row daily series for a fixed non-leap year
* preserve annual total with a documented rounding/reconciliation strategy

Important:

* this function is part of temporal input handling, not legacy product logic
* do not name the public domain contract `monthly_weighted`
* `seasonal_daily` is the externally intended mode name

### 7. Placeholder-ready process/economics assumptions structures

Create minimal but extensible structures for:

* process assumptions
* economics assumptions
* optional CAPEX assumptions
* assumptions metadata

Do **not** invent customer-specific constants.
Do **not** implement final methane, hydrogen, electricity, or comparison formulas yet.

---

## Functional requirements

### Availability profile

The domain model must support:

* flat annual profile
* seasonal daily profile
* daily time series
* hourly time series

### Electricity price input

The domain model must support:

* constant electricity price
* daily series
* hourly series
* imported historical market series

### Scenario input groups

The scenario input should support at least these logical groups:

* scenario metadata
* CO₂ input
* electricity input
* economics input
* optional CAPEX input
* process assumptions
* assumptions metadata / version

### Daily result structure

At minimum, `DailyResult` should support:

* `dayIndex`
* `dateLabel`
* `availableCO2Kg`
* `usableCO2Kg`
* `hydrogenNeededKg`
* `methaneProducedKg`
* `electricityConsumedMWh`
* `electricityCostEur`
* `variableCostEur`
* `allocatedCapexCostEur`
* `totalCostEur`
* `methaneRevenueEur`
* `hydrogenAlternativeRevenueEur`

It is acceptable if some fields are initially placeholder-oriented, but the structure must exist now.

---

## Non-functional requirements

### Code quality

* strict TypeScript style
* readable naming
* small pure functions where useful
* no duplicated logic
* avoid premature abstraction

### Architecture

* no calculation logic inside schemas
* no UI dependencies in core logic
* domain types must remain reusable across UI, tests, and exports

### Maintainability

* leave clear extension points for later formula implementation
* avoid tight coupling between temporal harmonization and later process logic

---

## Important constraints

Do **not** do these:

* do not implement final methane production formulas
* do not implement final hydrogen demand formulas
* do not implement final electricity consumption formulas
* do not implement comparison formulas
* do not implement CAPEX allocation formulas yet beyond structures
* do not create React components
* do not add charts
* do not add Excel/PDF code
* do not add database or API logic
* do not reintroduce legacy `monthly_weighted only` product assumptions

---

## Recommended file/module structure

```txt
src/
  core/
    domain/
      assumptions.ts
      scenario.ts
      result.ts
      units.ts
      temporal.ts
    calculation/
      build-seasonal-daily-co2-profile.ts
  features/
    scenario/
      schemas/
        scenario-schema.ts
```

You may adjust filenames slightly if needed, but keep the structure logically equivalent and clean.

---

## Output format

When you finish, provide:

1. a short summary of what you implemented
2. the created/modified file list
3. any assumptions you made
4. any open issues or recommendations for Agent 2

---

## Definition of done

This task is done when:

* domain types exist and are coherent
* assumption metadata / flags are modeled explicitly
* zod schemas validate the scenario input structure
* temporal input modes for CO₂ and electricity are modeled cleanly
* seasonal daily CO₂ generation works for a 365-day year
* the structure supports later harmonization and formula implementation without refactoring
* the model is aligned with daily-first internal resolution and hourly-capable input contracts

