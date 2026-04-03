# Cursor Agent Prompt — Agent 2: Temporal Harmonization, Core Formulas & Scenario Calculation Engine

Your task is to implement the next calculation layer for the Hiiliketju project on top of the domain/types/schema foundation.

## Goal

Build the daily-first calculation engine for the MVP.

Your focus areas are:
1. temporal harmonization into canonical daily series
2. optional simple CAPEX allocation
3. stoichiometric methane-path formulas
4. hydrogen alternative revenue comparison
5. monthly aggregation
6. annual aggregation
7. top-level scenario calculation orchestration

This work must be production-usable and aligned with the updated project specification.

---

## Context

The project is a browser-based techno-economic calculator.

The application compares:
- **Path A:** `CO2 + H2 -> CH4`
- **Path B:** `CO2 released + H2 sold`

The architecture direction is already decided:
- Next.js + TypeScript
- calculation logic must stay outside UI
- one canonical calculation result structure must support UI, Excel, and PDF
- internal engine is **daily**
- input contracts are **daily/hourly capable**
- process model is **stoichiometric + literature-based defaults + business/customer inputs**
- assumptions must be explicitly traceable

Your work now is to build the actual MVP calculation engine skeleton using the now-locked formulas and calculation policy.

---

## Locked assumptions for this task

Use these assumptions as fixed.

### Calculation resolution
- internal engine = `daily`
- requested input may be `daily` or `hourly`
- hourly CO₂ must be harmonized to daily using `sum`
- hourly electricity price must be harmonized to daily using `arithmetic_mean`
- annual period = `365 days`

### CO₂ availability modes
- `flat_annual`
- `seasonal_daily`
- `time_series_daily`
- `time_series_hourly`

### Electricity price modes
- `constant`
- `daily_series`
- `hourly_series`
- `historical_market_data_imported`

### CAPEX
- CAPEX is optional
- CAPEX method in MVP = `simple_lifetime_allocation`
- formula:
  `annualCapexCost = (electrolyzerCapexEur + methanationCapexEur) / capexLifetimeYears`
- no annuity logic in MVP core
- no discount-rate-based annualization in MVP core

### Locked literature-based defaults
- `stoichiometricHydrogenDemandFactor = 0.1832 kg_H2/kg_CO2`
- `stoichiometricMethaneYieldFactor = 0.3645 kg_CH4/kg_CO2`
- `electrolyzerSpecificEnergyConsumption = 54 kWh/kg_H2`
- `electrolyzerSpecificEnergyConsumptionMWh = 0.054 MWh/kg_H2`
- `plantAvailabilityPct = 100`
- `processEfficiencyPct = 100`

These defaults must be traceable through assumptions metadata, not hidden magic numbers.

### Locked economic formulas
- `breakEvenMethanePrice = annualTotalCost / annualMethaneProduced`
- `priceAt10PctProfitability = annualTotalCost * 1.10 / annualMethaneProduced`
- `priceAt30PctProfitability = annualTotalCost * 1.30 / annualMethaneProduced`
- `hydrogenAlternativeRevenue = hydrogenNeeded * hydrogenPrice`

### Locked units
- internal CO₂ timestep = `kg/day`
- internal H₂ timestep = `kg/day`
- internal CH₄ timestep = `kg/day`
- internal electricity timestep = `MWh/day`
- methane annual business output = `t/year`
- methane pricing unit = `EUR/t_CH4`
- electricity price = `EUR/MWh`

---

## Main implementation objective

Create a calculation engine that supports this flow:

1. validate or safely consume validated scenario input
2. resolve CO₂ availability into canonical daily series
3. resolve electricity price into canonical daily series
4. compute daily methane-path process outputs
5. compute daily hydrogen alternative revenue
6. apply optional CAPEX allocation
7. aggregate daily results into monthly summary
8. aggregate monthly/daily totals into annual summary
9. return one canonical `CalculationResult`

This is no longer a zero-placeholder skeleton for the core formulas above. Implement the locked MVP formulas now.

---

## Deliverables

Implement the following.

### 1. Temporal harmonization layer

Create pure functions for harmonizing CO₂ and electricity inputs into canonical daily series.

#### CO₂ harmonization
Support:
- `flat_annual`
- `seasonal_daily`
- `time_series_daily`
- `time_series_hourly`

Rules:
- flat annual -> generate flat daily series
- seasonal daily -> generate daily series
- daily series -> validate and pass through
- hourly series -> aggregate to daily using **sum**

#### Electricity harmonization
Support:
- `constant`
- `daily_series`
- `hourly_series`
- `historical_market_data_imported`

Rules:
- constant -> generate flat daily price series
- daily series -> validate and pass through
- hourly series -> aggregate to daily using **arithmetic mean**
- imported historical data -> normalize into daily or hourly structure first, then harmonize

Keep harmonization separate from the actual process formulas.

### 2. Simple CAPEX allocation module

Create a pure CAPEX allocation module.

Expected behavior:
- if `includeCapex = false` -> `annualCapexCost = 0`
- if `includeCapex = true` ->
  `annualCapexCost = (electrolyzerCapexEur + methanationCapexEur) / capexLifetimeYears`
- invalid lifetime must fail clearly
- daily allocated CAPEX =
  `annualCapexCost / 365`

Do not implement annuity or discount-rate logic here.

### 3. Core daily formulas

Implement the locked MVP formulas as pure functions.

At minimum:

#### Utilized CO₂
`usableCO2Kg_day = availableCO2Kg_day * (utilizationRatePct / 100)`

#### Hydrogen demand
`hydrogenNeededKg_day = usableCO2Kg_day * stoichiometricHydrogenDemandFactor`

#### Methane production
`methaneProducedKg_day = usableCO2Kg_day * stoichiometricMethaneYieldFactor`

#### Electricity consumption
`electricityConsumedMWh_day = hydrogenNeededKg_day * electrolyzerSpecificEnergyConsumptionMWh`

#### Electricity cost
`electricityCostEur_day = electricityConsumedMWh_day * electricityPriceEurPerMWh_day`

#### Other OPEX allocation
`otherOpexAllocatedEur_day = otherOpexEurPerYear / 365`

#### Variable cost
`variableCostEur_day = electricityCostEur_day + otherOpexAllocatedEur_day`

#### Total cost
`totalCostEur_day = variableCostEur_day + allocatedCapexCostEur_day`

#### Methane revenue
`methaneRevenueEur_day = (methaneProducedKg_day / 1000) * methanePriceEurPerTon`

#### Hydrogen alternative revenue
`hydrogenAlternativeRevenueEur_day = hydrogenNeededKg_day * hydrogenPriceEurPerKg`

### 4. Daily calculation pipeline

Create a pure daily calculation layer that consumes:
- canonical daily CO₂ series
- canonical daily electricity price series
- scenario input
- annual CAPEX allocation result
- assumptions/defaults metadata

and returns `DailyResult[]`.

### 5. Aggregation functions

Implement reusable pure functions for:
- monthly aggregation
- annual aggregation

Monthly aggregation must:
- group by month
- preserve month ordering
- aggregate all core numeric result fields

Annual aggregation must compute at least:
- annual CO₂ available
- annual CO₂ utilized
- CO₂ recycling rate
- annual methane produced in tons
- annual hydrogen needed
- annual electricity consumed
- annual variable cost
- annual CAPEX cost
- annual total cost
- annual methane revenue
- hydrogen alternative revenue
- break-even methane price
- methane price at 10% profitability
- methane price at 30% profitability
- delta vs hydrogen sale

Handle zero-denominator cases explicitly and non-misleadingly.
Recommended: return `null` for not-computable methane-price KPIs when annual methane produced is zero.

### 6. Scenario calculation orchestrator

Implement a top-level pure function such as:

```ts
calculateScenario(input: ScenarioInput): CalculationResult
````

This function should:

1. resolve daily CO₂ availability
2. resolve daily electricity price
3. resolve CAPEX allocation
4. compute daily results
5. aggregate monthly summary
6. aggregate annual summary
7. return canonical result object including assumptions metadata and warnings where appropriate

### 7. Assumption flag propagation

The calculation result must preserve or expose enough metadata so later UI and export layers can show:

* literature-based defaults in use
* customer confirmation pending where relevant
* warnings for business-critical estimated assumptions

At minimum, ensure assumption metadata is not lost between input/default resolution and final result.

---

## Functional requirements

### Canonical engine inputs

Before the daily loop, the engine should operate on:

* resolved daily CO₂ series in `kg/day`
* resolved daily electricity price series in `EUR/MWh`

### Monthly summary

`MonthlySummary` must support at least:

* month index or month label
* aggregated available CO₂
* aggregated usable CO₂
* aggregated hydrogen needed
* aggregated methane produced
* aggregated electricity consumed
* aggregated electricity cost
* aggregated variable cost
* aggregated allocated CAPEX
* aggregated total cost
* aggregated methane revenue
* aggregated hydrogen alternative revenue

### Annual summary

`ScenarioSummary` must support all locked MVP KPIs.

---

## Non-functional requirements

### Code quality

* strict TypeScript style
* small pure functions where useful
* readable naming
* no duplicated aggregation logic
* avoid unnecessary abstraction layers

### Architecture

* harmonization logic independent from core formulas
* CAPEX logic independent from harmonization logic
* aggregation independent from UI/export formatting
* top-level scenario orchestration thin and readable

### Maintainability

* later formula tuning should require updating formula functions, not rewriting orchestration
* no speculative abstractions with no current need

---

## Important constraints

Do **not** do these:

* do not create React components
* do not add charts
* do not add Excel/PDF code
* do not add database, API, or persistence logic
* do not reintroduce annuity CAPEX logic to MVP core
* do not reintroduce constant-only electricity assumptions
* do not reintroduce monthly-weighted-only product assumptions

---

## Recommended file/module structure

```txt
src/
  core/
    calculation/
      resolve-co2-series.ts
      resolve-electricity-price-series.ts
      allocate-capex.ts
      calculate-daily-results.ts
      aggregate-results.ts
      calculate-scenario.ts
```

You may adjust filenames slightly if needed, but keep the structure logically equivalent and clean.

---

## Output format

When you finish, provide:

1. a short summary of what you implemented
2. the created/modified file list
3. any assumptions you made
4. any open issues or recommendations for Agent 3

---

## Definition of done

This task is done when:

* temporal harmonization exists for CO₂ and electricity
* simple optional CAPEX allocation exists
* locked stoichiometric + SEC formulas are implemented
* daily result pipeline works
* monthly aggregation works
* annual aggregation works
* profitability KPIs work
* the top-level scenario calculation returns a canonical result
* assumption metadata is not lost
* the structure is aligned with the updated documentation and requires no major refactor before testing/UI work
