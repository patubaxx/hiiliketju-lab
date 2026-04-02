# Solution Specification v1
**Project:** Hiiliketju – browser-based techno-economic calculator  
**Implementation model:** Next.js + TypeScript + Cursor-guided delivery  

---

## 1. Goal

Build a browser-based application that allows users to evaluate the techno-economic feasibility of CO₂, hydrogen, and methane value chains under different scenarios.

The application is intended to serve as:
- a research tool
- a decision-support tool
- a discussion tool with industrial stakeholders

The primary MVP outputs are:
- **unit cost**
- methane-path results
- comparison against selling hydrogen as-is
- clear reporting with charts and Excel/PDF exports

---

## 2. MVP scope

### 2.1 Included in MVP
- annual CO₂ amount input
- CO₂ utilization rate
- constant electricity price
- detailed availability profile at annual level using monthly weighting
- daily calculation across 365 days
- methane production calculation
- hydrogen demand calculation
- electricity consumption calculation
- OPEX calculation
- annuitized CAPEX
- unit-cost calculation
- comparison calculation: hydrogen sold as-is
- result visualization
- Excel export
- visually clean, brandable PDF export

### 2.2 Excluded from MVP
- user accounts and login
- persistent scenario storage
- time-series electricity price profile
- raw daily or hourly input series from the user
- CSV import
- multiple parallel process chains
- extended investment-analysis metrics such as NPV / IRR / payback
- free-form process diagram editor

---

## 3. Core design principles

### 3.1 Layered architecture
The solution is divided into four clear layers:
1. UI
2. calculation engine
3. assumptions and parameter layer
4. reporting and exports

### 3.2 No calculation logic in UI
React components must not contain business logic or formulas.  
All calculations live in a separate TypeScript domain layer.

### 3.3 One canonical result structure
UI, Excel, and PDF must use the same calculation result.  
Exports must not run parallel business logic.

### 3.4 Future extensibility
Although MVP uses annual totals plus monthly-weighted profile logic, the architecture must support future extensions such as:
- daily input series
- hourly profile sources
- time-series electricity price profiles

---

## 4. Users and main use cases

### 4.1 User groups
- researcher / expert
- industrial company representative
- internal project analyst

### 4.2 Main use cases

#### UC1: Build a scenario
The user enters input values, reviews assumptions, and runs the calculation.

#### UC2: Review results
The user sees summary results, time-series outputs, and comparison against hydrogen sales.

#### UC3: Export results
The user exports the result as Excel for further analysis or as PDF for presentation-quality reporting.

---

## 5. Agreed assumptions for MVP

### 5.1 Locked assumptions
- CAPEX is treated as **annuitized**
- the main profitability metric is **unit cost**
- electricity price is a single user-provided constant in MVP
- CO₂ availability is modeled using annual total + monthly weights
- calculation period is always **365 days**
- no login
- no persistent storage
- PDF must be clean and brandable

### 5.2 Working assumptions at this phase
- units are explicitly defined in the domain model
- formulas and default parameters will be provided separately
- the first version is single-language
- PDF starts with a neutral but easily brandable layout

---

## 6. Units and measurement conventions

Suggested MVP unit conventions:
- CO₂: **t/year**
- H₂: **kg**
- methane: to be finalized based on formulas, but outputs must be business-readable
- energy: **MWh**
- electricity price: **€/MWh**
- hydrogen price: **€/kg**
- other costs: **€/year**
- CAPEX: **€**

Every input and output field must display units explicitly.

---

## 7. Functional view structure

### 7.1 Inputs view

The user provides:
- scenario name
- annual CO₂ amount
- utilization rate
- electricity price
- hydrogen price / alternative sales assumptions
- methane value assumptions
- other operating costs
- CAPEX values
- monthly profile weights

#### Functions
- field validation
- loading defaults
- live profile preview
- Run calculation action

---

### 7.2 Advanced assumptions section

The user can inspect or adjust:
- conversion factors
- hydrogen demand assumptions
- electricity consumption assumptions
- plant availability / operating assumptions
- annualization parameters
- assumptions metadata version

This should be implemented as an accordion or drawer rather than a heavy standalone page.

---

### 7.3 Results view

Must show at minimum:

#### KPI summary
- unit cost
- annual methane production
- annual hydrogen demand
- annual electricity consumption
- annual OPEX
- annualized CAPEX
- annual total cost
- hydrogen-sales alternative result
- delta vs comparison path

#### Visualizations
- CO₂ availability over time
- methane production over time
- cost breakdown
- methane path vs hydrogen sales comparison

#### Tables
- annual summary
- monthly or aggregated summary
- optional daily preview

---

### 7.4 Export functions

#### Excel
Must include at minimum:
- inputs
- assumptions
- profile
- daily results
- annual summary
- comparison scenario

#### PDF
Must include at minimum:
- cover/header section
- scenario basics
- key assumptions
- KPI summary
- key charts
- comparison result
- short summary
- optional assumptions appendix

---

## 8. Logical calculation structure

### 8.1 Input groups

#### A. CO₂ inputs
- annual CO₂ amount
- utilization rate
- availability profile

#### B. Energy
- electricity price

#### C. Process
- methane conversion parameters
- hydrogen demand parameters
- electricity consumption parameters
- plant availability

#### D. Economics
- hydrogen value / sales price
- methane value / sales price
- other annual operating costs
- CAPEX
- lifetime
- discount / annuity parameters

#### E. Calculation settings
- number of days
- assumptions version
- report metadata

---

### 8.2 Availability profile logic

MVP model:

1. The user provides annual CO₂ amount.
2. The user provides 12 monthly weights.
3. The weights are normalized.
4. The annual total is distributed across months using the normalized weights.
5. Monthly CO₂ is distributed across days by the number of days in each month.
6. The daily series is passed into the calculation engine.

#### Design note
This allows future profile sources to be added later without rewriting the whole calculation engine, as long as the profile generator returns the same daily interface.

---

### 8.3 Daily calculation

For each day, calculate at least:
- available CO₂
- usable CO₂
- hydrogen needed
- methane produced
- electricity consumed
- variable cost
- CAPEX allocation
- total cost
- methane-path revenue
- hydrogen-alternative revenue

These are aggregated to:
- monthly level
- annual level

---

### 8.4 Comparison logic

At minimum, calculate two paths:

#### Path A: CO₂ + H₂ → methane
Produces:
- methane amount
- hydrogen demand
- electricity consumption
- costs
- revenues
- unit cost

#### Path B: hydrogen sold as-is
Produces:
- hydrogen amount
- alternative sales revenue
- comparison result versus methane path

#### Key comparisons
- absolute results
- euro delta
- unit-cost delta
- business-readable interpretation for reporting

---

### 8.5 CAPEX logic

CAPEX is treated as annuitized.

MVP assumption:
- CAPEX is converted to annual cost using annuity logic
- annualized CAPEX is added to annual total cost
- unit cost is calculated against annual output

This keeps the base model extensible for later investment-analysis metrics.

---

## 9. Domain models

Recommended logical data model:

    type AvailabilityProfileInput = {
      mode: "monthly_weighted"
      monthlyWeights: [
        number, number, number, number, number, number,
        number, number, number, number, number, number
      ]
    }

    type ScenarioInput = {
      scenarioName: string
      periodDays: 365

      co2: {
        annualAmountTons: number
        utilizationRatePct: number
        availabilityProfile: AvailabilityProfileInput
      }

      energy: {
        electricityPriceEurPerMWh: number
      }

      economics: {
        methanePrice: number
        hydrogenPrice: number
        otherOpexEurPerYear: number
        capexEur: number
        capexLifetimeYears: number
        discountRatePct: number
        capexAnnualizationMethod: "annuity"
      }

      process: {
        methaneConversionParams: Record<string, number>
        hydrogenDemandParams: Record<string, number>
        energyConsumptionParams: Record<string, number>
        plantAvailabilityPct?: number
      }

      assumptionsMeta: {
        assumptionsVersion: string
        notes?: string
      }
    }

    type DailyResult = {
      dayIndex: number
      dateLabel: string
      availableCO2: number
      usableCO2: number
      hydrogenNeeded: number
      methaneProduced: number
      electricityConsumed: number
      variableCost: number
      allocatedCapexCost: number
      totalCost: number
      methaneRevenue: number
      hydrogenAlternativeRevenue: number
    }

    type ScenarioSummary = {
      annualMethaneProduced: number
      annualHydrogenNeeded: number
      annualElectricityConsumed: number
      annualVariableCost: number
      annualCapexCost: number
      annualTotalCost: number
      methaneRevenue: number
      hydrogenSalesAlternativeRevenue: number
      unitCostMethane: number
      deltaVsHydrogenSale: number
    }

    type CalculationResult = {
      input: ScenarioInput
      dailyResults: DailyResult[]
      monthlySummary: unknown[]
      annualSummary: ScenarioSummary
    }

---

## 10. Calculation I/O contract

### 10.1 Input
The calculation engine accepts one `ScenarioInput` object.

### 10.2 Output
The calculation engine returns one `CalculationResult` object.

### 10.3 Contract principles
- input is validated before calculation
- calculation does not fetch external data
- calculation is deterministic
- the same input always produces the same output
- output contains everything needed by UI and exports

---

## 11. Validation and error handling

### 11.1 Input validation
- required fields are checked
- invalid negative values are blocked where appropriate
- percentage fields are range-limited
- profile weights must be valid
- annuity parameters must be validated

### 11.2 Error cases
- missing inputs
- invalid numeric values
- calculation does not produce valid output
- zero output causes invalid unit-cost division

The UI must show user-friendly errors, not technical exceptions.

---

## 12. Non-functional requirements

### 12.1 Usability
- clear and expert-oriented
- no heavy multi-step navigation
- quick to use with defaults

### 12.2 Performance
- a single calculation should complete effectively instantly in a normal browser
- 365-day series calculation must not create visible lag

### 12.3 Maintainability
- calculation separated from UI
- units are explicit in code
- all formulas are centralized in the domain layer

### 12.4 Testability
- calculation is covered by unit tests
- UI validation is tested separately
- regression tests exist for known scenarios

---

## 13. Technical architecture

### 13.1 Recommended stack
- Next.js App Router
- TypeScript
- Tailwind
- shadcn/ui
- react-hook-form
- zod
- Recharts
- ExcelJS

PDF generation should be template-based and server-side or server-compatible.

### 13.2 Recommended code structure

    src/
      app/
        page.tsx
        results/
        api/
          export/
      core/
        domain/
          scenario.ts
          result.ts
          units.ts
        calculation/
          build-daily-profile.ts
          calculate-scenario.ts
          calculate-methane-path.ts
          calculate-hydrogen-alternative.ts
          annualize-capex.ts
          aggregate-results.ts
        reporting/
          build-export-model.ts
          build-pdf-model.ts
          build-excel-model.ts
      features/
        scenario/
          components/
          forms/
          hooks/
          schemas/
      components/
        charts/
        layout/
        ui/
      lib/
        formatters/
        constants/

### 13.3 Interface principles
- UI calls one clear `calculateScenario()` function
- exports call `buildExportModel()`-style helpers
- formulas do not leak into component code
- presentation formatting is separated from calculation

---

## 14. Export architecture

### 14.1 Excel
Excel is built from a structured export view model.

Suggested sheets:
- `Inputs`
- `Assumptions`
- `Profile`
- `Daily Results`
- `Annual Summary`
- `Comparison`

### 14.2 PDF
PDF is built from a dedicated report model containing:
- report header
- formatted KPIs
- chart-ready data
- assumptions summary
- summary text blocks

The first version should use a neutral visual style that is easy to brand later.

---

## 15. Testing strategy

### 15.1 Calculation tests
- profile normalization
- correctness of day allocation
- annuitized CAPEX calculation
- unit-cost calculation
- hydrogen-sales comparison path
- monthly and annual aggregation

### 15.2 Validation tests
- required fields
- range limits
- error messages

### 15.3 UI tests
- form behavior
- results rendering
- export action triggers

### 15.4 Golden scenario tests
Once final formulas and parameters are available, lock 2–5 reference scenarios to prevent regressions.

---

## 16. Delivery order

### WP1 — solution refinement
- this solution specification
- input/output field lock
- receive formula material

### WP2 — calculation implementation spec
- formulas
- units
- parameters
- assumptions versions
- reference tests

### WP3 — domain foundation
- TypeScript types
- zod schemas
- formatters
- profile logic

### WP4 — calculation engine
- daily calculation
- methane path
- hydrogen-sales alternative
- annuitized CAPEX
- aggregations

### WP5 — input UI
- form view
- advanced assumptions
- profile editor
- validation

### WP6 — results UI
- KPIs
- charts
- comparisons
- tables

### WP7 — exports
- Excel
- PDF

### WP8 — polish + QA
- error states
- documentation
- final polish

---

## 17. Cursor agent work split

### Agent 1 — Domain & schemas
Responsible for:
- types
- zod validation
- unit models
- profile input structure

### Agent 2 — Calculation engine
Responsible for:
- pure calculation logic
- annuity
- aggregation
- comparison logic

### Agent 3 — Testing
Responsible for:
- unit tests
- golden scenario tests
- edge cases

### Agent 4 — Inputs UI
Responsible for:
- forms
- validation
- profile editor
- UX

### Agent 5 — Results UI
Responsible for:
- KPI cards
- charts
- comparison layout
- responsive behavior

### Agent 6 — Excel export
Responsible for:
- workbook structure
- sheets
- numeric formatting

### Agent 7 — PDF export
Responsible for:
- report template
- layout
- brand-ready styling

---

## 18. Definition of done for MVP

MVP is done when:
- the user can enter all required inputs
- the profile can be defined with monthly weights
- calculation works across 365 days
- methane-path results are produced correctly
- hydrogen-sales comparison works
- annuitized CAPEX is included in calculation
- unit cost is shown correctly
- results are presented clearly in UI
- Excel export works
- PDF export works with a clean report layout
- reference tests pass

