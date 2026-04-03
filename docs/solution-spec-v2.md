# Solution Specification v2
**Project:** Hiiliketju – browser-based techno-economic calculation application  
**Implementation model:** Next.js + TypeScript + Cursor-agent guided implementation  
**Status:** Updated after revised tender requirements  
**Language of UI:** English  
**Core principle:** daily-first engine, hourly-capable input contract

---

## 1. Goal

Build a browser-based application that allows users to evaluate the techno-economic viability of biogenic CO₂ utilization pathways in alternative value-chain scenarios.

The application must support at least two comparison paths:

- **Path A:** `CO2 + H2 -> CH4`
- **Path B:** `CO2 released + H2 sold`

The application is intended to serve as:
- a research and scenario analysis tool
- a decision-support tool
- a discussion tool for industrial stakeholders

The MVP must produce, at minimum:
- annual methane production
- annual hydrogen demand
- annual electricity consumption
- annual cost summary
- methane sales revenue estimate
- break-even methane price
- target-profitability methane prices
- comparison to the alternative path where hydrogen is sold instead of converted to methane

---

## 2. MVP Scope

### Included in MVP
- temporally resolved calculation using **daily internal resolution**
- support for CO₂ availability input modes:
  - `flat_annual`
  - `seasonal_daily`
  - `time_series_daily`
  - `time_series_hourly`
- support for electricity price input modes:
  - `constant`
  - `daily_series`
  - `hourly_series`
  - `historical_market_data_imported`
- hourly input harmonization into daily internal resolution
- stoichiometric methane path calculation
- hydrogen alternative path comparison
- optional simple CAPEX module
- KPI summary
- charts
- Excel export
- PDF export
- assumptions metadata and assumptions flags

### Explicitly out of scope in MVP
- native hourly internal calculation engine
- dispatch/load optimization
- storage dynamics
- full investment analysis metrics such as NPV / IRR / payback
- user authentication
- persistent saved scenarios
- multi-path process editor
- advanced process simulation beyond stoichiometric core + assumption modifiers

---

## 3. Core Design Principles

### 3.1 Layered architecture
The application is divided into four clear layers:
1. UI layer
2. calculation engine
3. assumptions / parameter layer
4. reporting / export layer

### 3.2 No business logic in UI
React components must not contain calculation formulas or domain logic.

### 3.3 One canonical result model
UI, Excel, and PDF must all consume the same canonical calculation result.

### 3.4 Daily-first, hourly-capable
The MVP internal engine operates on daily timesteps, but input contracts must support both daily and hourly temporal data.

### 3.5 Explicit assumption transparency
Every non-user-provided assumption must have explicit metadata.

Allowed assumption source flags:
- `customer_provided`
- `product_locked`
- `literature_based`
- `placeholder`
- `derived`

### 3.6 Literature-based values must be clearly flagged
All stoichiometric factors, literature-derived SEC values, and other literature-estimated process assumptions must be explicitly marked with a clear flag in both data structures and exports.

**Required flag fields:**
- `assumptionSource`
- `assumptionStatus`
- `assumptionNote`

Minimum expected example:
- `assumptionSource = "literature_based"`
- `assumptionStatus = "estimated"`
- `assumptionNote = "Literature-based default used in MVP; customer confirmation recommended if project-specific data becomes available."`

---

## 4. Users and Primary Use Cases

### User groups
- researcher / analyst
- industrial stakeholder
- internal project expert

### Primary use cases

#### UC1: Build scenario
User defines CO₂ input, temporal availability, electricity pricing assumptions, economic assumptions, and optional CAPEX inputs.

#### UC2: Compare pathways
User compares methane pathway against hydrogen sales alternative.

#### UC3: Review results
User reviews KPI summary, time series outputs, and annual summaries.

#### UC4: Export results
User exports scenario results and assumptions to Excel and PDF.

---

## 5. Locked MVP Decisions

The following are locked for MVP:

- internal calculation resolution = `daily`
- supported CO₂ modes = `flat_annual | seasonal_daily | time_series_daily | time_series_hourly`
- supported electricity price modes = `constant | daily_series | hourly_series | historical_market_data_imported`
- CAPEX handling = `optional simple lifetime allocation`
- comparison paths = Path A methane vs Path B hydrogen sold
- CO₂ UI default unit = `kt/year`
- internal CO₂ unit = `kg/day`
- H₂ unit = `kg`
- CH₄ annual business unit = `t/year`
- CH₄ price unit = `EUR/t_CH4`
- electricity unit = `MWh`
- electricity price unit = `EUR/MWh`
- target profitability formula = `markup_on_cost`
- hourly CO₂ to daily aggregation = `sum`
- hourly electricity price to daily aggregation = `arithmetic_mean`

---

## 6. Process Model Basis

### 6.1 Base process model
The base process model is:
- **stoichiometric**
- deterministic
- transparent
- parameterized through assumptions metadata

### 6.2 Core process reactions
- electrolysis: `2 H2O -> 2 H2 + O2`
- methanation: `CO2 + 4 H2 -> CH4 + 2 H2O`

### 6.3 Locked literature-based defaults for MVP
The following defaults are locked for MVP and must be flagged as `literature_based`:

- `stoichiometricHydrogenDemandFactor = 0.1832 kg_H2 / kg_CO2`
- `stoichiometricMethaneYieldFactor = 0.3645 kg_CH4 / kg_CO2`
- `electrolyzerSpecificEnergyConsumption = 54 kWh/kg_H2`
- `electrolyzerSpecificEnergyConsumptionMWh = 0.054 MWh/kg_H2`
- `plantAvailabilityPct = 100`
- `processEfficiencyPct = 100`

### 6.4 Modifier policy
Availability and efficiency modifiers may exist in advanced assumptions, but the stoichiometric core must remain visible and separable from modifier effects.

---

## 7. Functional View Structure

### 7.1 Inputs view
User can define:
- scenario name
- annual CO₂ amount
- utilization rate
- CO₂ availability mode
- temporal input data or seasonal parameters
- electricity price mode
- electricity price values or price series
- methane price
- hydrogen price
- other OPEX
- optional CAPEX inputs
- advanced assumptions

### 7.2 Advanced assumptions
Advanced assumptions may include:
- stoichiometric factors
- SEC defaults
- plant availability
- process efficiency
- future extension fields

All non-customer-provided values must display their source flag.

### 7.3 Results view

#### KPI summary
At minimum:
- annual CO₂ available
- annual CO₂ utilized
- CO₂ recycling rate
- annual methane produced
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
- delta vs hydrogen sales alternative

#### Visualizations
At minimum:
- CO₂ availability over time
- electricity price over time
- methane production over time
- cost vs revenue
- methane path vs hydrogen sales comparison

### 7.4 Export functions

#### Excel
Must include:
- inputs
- assumptions
- flags for literature-based assumptions
- time series results
- annual summary
- comparison summary

#### PDF
Must include:
- scenario overview
- key assumptions
- visible literature-based flags for estimated values
- KPI summary
- charts
- comparison conclusion

---

## 8. Logical Calculation Structure

### 8.1 Input groups

#### A. CO₂
- annual amount
- utilization rate
- availability mode
- temporal availability data

#### B. Electricity
- price mode
- price series or constant value

#### C. Process assumptions
- stoichiometric factors
- SEC
- plant availability
- process efficiency

#### D. Economics
- methane price
- hydrogen price
- other OPEX

#### E. Optional CAPEX
- includeCapex
- electrolyzerCapexEur
- methanationCapexEur
- capexLifetimeYears

#### F. Calculation settings
- timeResolution input contract
- internalCalculationResolution
- assumptionsVersion

### 8.2 Temporal resolution policy
- input may be daily or hourly
- internal MVP engine uses daily timesteps
- hourly CO₂ is aggregated to daily by sum
- hourly electricity price is aggregated to daily by arithmetic mean

### 8.3 Comparison logic
- **Path A:** methane pathway
- **Path B:** hydrogen sold alternative

### 8.4 CAPEX logic
If `includeCapex = true`, then:
`annualCapexCost = (electrolyzerCapexEur + methanationCapexEur) / capexLifetimeYears`

If `includeCapex = false`, then:
`annualCapexCost = 0`

### 8.5 Profitability logic
- `breakEvenMethanePrice = annualTotalCost / annualMethaneProduced`
- `priceAt10PctProfitability = annualTotalCost * 1.10 / annualMethaneProduced`
- `priceAt30PctProfitability = annualTotalCost * 1.30 / annualMethaneProduced`

---

## 9. Domain Model Direction

The domain model must support:
- multiple temporal input modes
- explicit assumption flags
- assumptions versioning
- canonical time series
- daily internal calculation outputs
- annual business outputs

---

## 10. Definition of Done for MVP

The MVP is done when:
- user can define all required scenario inputs
- mode-based CO₂ input works
- mode-based electricity input works
- daily-first calculation engine works
- methane path works using stoichiometric + literature-based defaults
- hydrogen alternative comparison works
- optional simple CAPEX works
- KPI summary renders correctly
- literature-based assumptions are explicitly flagged in UI and exports
- Excel export works
- PDF export works
- validation and shape tests pass

---

## 11. Assumptions Used in This Specification

- The tender requirement is the stronger source of truth versus older internal MVP assumptions.
- Daily internal resolution is sufficient for MVP if hourly input remains supported at the contract level.
- Literature-based defaults are acceptable for MVP when clearly marked and separated from customer-confirmed values.
- Profitability prices are interpreted as markup on cost in MVP.
- Methane is priced in `EUR/t_CH4` in MVP.