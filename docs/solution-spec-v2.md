# Solution Specification v2
**Project:** Hiiliketju – browser-based techno-economic calculation application  
**Implementation model:** Next.js + TypeScript + Cursor-agent guided implementation  
**Status:** Updated after revised tender requirements  
**Language of UI:** UI is multilingual-ready; MVP primary language is English, with Finnish and Swedish supported incrementally with i18n.
**Core principle:** daily-first engine, hourly-capable input contract

**Related:** [`docs/index.md`](index.md) · [`repository-invariants.md`](repository-invariants.md) · [`AGENTS.md`](../AGENTS.md) · root [`README.md`](../README.md)

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

### 2.1 Included in MVP
- temporally resolved calculation using **daily internal resolution**
- support for CO₂ availability input modes:
  - `flat_annual`
  - `seasonal_daily`
  - `time_series_daily`
  - `time_series_hourly`
- support for electricity price input modes (all four remain supported in schema, engine, and exports):
  - `constant`
  - `daily_series`
  - `hourly_series`
  - `historical_market_data_imported`
  - **Visible UI selector:** only `constant` and `historical_market_data_imported` are offered; `daily_series` and `hourly_series` remain as internal contracts.
  - **`historical_market_data_imported` defaults:** pre-loaded with deterministic 2025 Finnish spot-market prices derived from `sources/electricity_prices.csv` (porssisahko.net, VAT included). Daily defaults = arithmetic mean of 24 hourly prices per calendar date; both resolutions available. Users may override by pasting or importing their own EUR/MWh series.
- hourly input harmonization into daily internal resolution
- stoichiometric methane path calculation
- hydrogen alternative path comparison
- optional simple CAPEX module
- KPI summary
- charts
- Excel export
- PDF export
- assumptions metadata and assumptions flags

### 2.2 Explicitly out of scope in MVP
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

For shipped file downloads, the server recomputes that result from a validated `scenario` payload (`calculateScenario`); export mappers must not re-derive business numbers and must not accept a client-sent result object as authoritative input on the export API.

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

### 4.1 User groups
- researcher / analyst
- industrial stakeholder
- internal project expert

### 4.2 Primary use cases

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
- electricity purchase price unit = `EUR/MWh` (canonical wire; constant mode may be entered as `c/kWh` in the UI and converted)
- target profitability formula = `markup_on_cost`
- hourly CO₂ to daily aggregation = `sum`
- hourly electricity price to daily aggregation = `arithmetic_mean`

**UI conveniences (do not change wire or engine contracts):**

- **Annual CO₂** is shown fixed as **`kt/year`** in the scenario form (no unit selector; internal `kg/year` conversion helpers remain in domain code for future use). **Constant** electricity **purchase** price may be entered as **`EUR/MWh` or `c/kWh`**; values are converted in **`buildScenarioPayload`** so the validated **`ScenarioInput`** remains canonical (**`kt/year`**, **`EUR/MWh`** for those fields). Time-series bulk entry does **not** gain alternate display units in MVP.
- **Browser CSV import** for CO₂ and electricity **time-series** fills the same bulk text / builder path as paste; it is not a separate calculation mode or input contract.

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
Plant availability and process efficiency are schema- and assumption-ready MVP fields. They may be displayed and versioned before they are applied as active multipliers in the first engine iteration.

---

## 7. Functional View Structure

### 7.1 Inputs view
User can define:
- scenario name
- annual CO₂ amount
- utilization rate
- CO₂ availability mode
- temporal input data or seasonal parameters (including optional browser **CSV import** into the same bulk series path as manual entry, where the UI exposes time-series modes)
- electricity **purchase** price mode
- electricity **purchase** price values or price series
- methane **assumed sales** price
- hydrogen **assumed sales** price
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

#### Tables
At minimum:
- annual summary
- monthly or aggregated summary
- optional daily preview

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
- requestedTimeResolution input contract
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

## 9. Units and Measurement Conventions

### 9.1 User-facing default units
- CO₂: `kt/year` (default); the form may also **display** annual CO₂ as `kg/year` before conversion to canonical wire
- H₂: `kg`
- CH₄: `t/year`
- methane price: `EUR/t_CH4`
- electricity: `MWh`
- electricity price: `EUR/MWh` (default); the form may **display** **constant** purchase price as `c/kWh` before conversion to canonical wire
- other OPEX: `EUR/year`
- CAPEX: `EUR`

### 9.2 Internal canonical units
- CO₂ timestep value: `kg/day`
- H₂ timestep value: `kg/day`
- CH₄ timestep value: `kg/day`
- electricity timestep value: `MWh/day`
- money timestep value: `EUR/day`

### 9.3 Unit principles
- every input and output field must display units explicitly
- internal units and user-facing units must be kept distinct where needed
- **exports and the canonical wire `ScenarioInput` use canonical business units** (`kt/year`, `EUR/MWh`, etc.); optional alternate **form display** units for annual CO₂ and constant electricity are converted **before** validation and do not change export column semantics
- unit transformations must live in calculation/domain helpers and the **payload builder** (`buildScenarioPayload`), not ad hoc in presentational UI components

---

## 10. Domain Model Direction and Calculation I/O Contract

### 10.1 Domain model direction
The domain model must support:
- multiple temporal input modes
- explicit assumption flags
- assumptions versioning
- canonical time series
- daily internal calculation outputs
- annual business outputs

### 10.2 Input contract
The calculation engine accepts one validated scenario input object containing:
- scenario metadata
- CO₂ input data
- electricity price input data
- economic inputs
- optional CAPEX inputs
- assumptions metadata

### 10.3 Output contract
The calculation engine returns one canonical calculation result containing:
- raw input snapshot
- resolved daily time series
- assumptions metadata including source flags
- annual summary
- warnings array
- export-ready formatted sections or export-ready mapping inputs

### 10.4 Contract principles
- input is validated before calculation
- calculation does not fetch external data
- calculation is deterministic
- the same input always produces the same output
- output contains everything needed by UI and exports
- calculation consumes canonical resolved temporal series rather than raw UI-specific source formats (bulk paste or CSV-imported text is normalized into the same series builder / validation path before **`ScenarioInput`** is accepted)

---

## 11. Validation and Error Handling

### 11.1 Input validation
- required fields are checked
- invalid negative values are blocked where appropriate
- percentage fields are range-limited
- profile mode and profile data must match
- electricity price mode and price data must match
- temporal series length must be valid for the selected mode
- optional CAPEX inputs must be complete if CAPEX is enabled
- CAPEX lifetime must be greater than zero if CAPEX is enabled

### 11.2 Error cases
- missing inputs
- invalid numeric values
- unsupported mode/data combination
- inconsistent temporal series
- calculation does not produce valid output
- zero methane output causes invalid profitability price division

### 11.3 Soft warnings
Warnings may be emitted for:
- literature-based defaults in use
- customer confirmation still pending for business-critical values
- imported historical data gaps that required filling
- plant availability or process efficiency still using neutral defaults

### 11.4 Error handling principle
The UI must show user-friendly errors, not technical exceptions.

---

## 12. Non-Functional Requirements

### 12.1 Usability
- clear and expert-oriented
- no heavy multi-step navigation
- quick to use with defaults
- advanced assumptions should be available without overwhelming the main workflow
- primary chrome is a **sticky top bar**: run, reset, language, jump to outcome, and Excel/PDF export (exports disabled until a successful run exists); a successful run **scrolls** to the outcome section (`#scenario-outcome`); this is layout/UX only and does not change calculation or export contracts

### 12.2 Performance
- a single scenario calculation should complete effectively instantly in a normal browser
- daily temporal calculation must not create visible lag
- hourly input harmonization must remain lightweight enough for normal interactive use

### 12.3 Maintainability
- calculation is separated from UI
- units are explicit in code
- formulas are centralized in the domain/calculation layer
- temporal source harmonization is separated from core scenario calculation
- assumptions metadata is explicit and traceable

### 12.4 Testability
- calculation logic is covered by unit tests
- UI validation is tested separately
- harmonization logic is tested separately from business formulas
- golden scenario infrastructure exists even before final customer-confirmed business values

---

## 13. Technical Architecture

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
- Note that this structure is the intended architectural direction; exact filenames/modules may vary as long as the same layering and responsibility boundaries are preserved.

```txt
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
      assumptions.ts
    calculation/
      resolve-co2-profile.ts
      resolve-electricity-price.ts
      harmonize-time-series.ts
      allocate-capex.ts
      calculate-scenario.ts
      calculate-methane-path.ts
      calculate-hydrogen-alternative.ts
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
test/
```

### 13.3 Interface principles

* UI calls one clear `calculateScenario()` function
* exports call `buildExportModel()`-style helpers
* formulas do not leak into component code
* presentation formatting is separated from calculation
* temporal source resolution is separated from core scenario calculation

---

## 14. Export Architecture

### 14.1 Excel

Excel is built from a structured export view model.

Suggested sheets:

* `Inputs`
* `Assumptions`
* `CO2 Profile`
* `Electricity Price`
* `Daily Results`
* `Annual Summary`
* `Comparison`

### 14.2 PDF

PDF is built from a dedicated report model containing:

* report header
* formatted KPIs
* chart-ready data
* assumptions summary
* visible flags for literature-based assumptions
* summary text blocks

The first version should use a neutral visual style that is easy to brand later.

---

## 15. Testing Strategy

### 15.1 Calculation tests

* temporal CO₂ profile resolution
* temporal electricity price resolution
* daily harmonization logic
* CAPEX allocation logic
* stoichiometric hydrogen demand calculation
* stoichiometric methane production calculation
* electricity consumption calculation
* break-even price calculation
* target-profitability price calculation
* hydrogen-sales comparison path
* monthly and annual aggregation

### 15.2 Validation tests

* required fields
* range limits
* invalid source-mode combinations
* invalid temporal series lengths
* CAPEX completeness rules
* user-facing error messages

### 15.3 UI tests

* form behavior
* dynamic input sections by mode
* results rendering
* export action triggers
* literature-based assumption flags rendering

### 15.4 Golden scenario tests

Once final customer-confirmed business values are available, lock 2–5 reference scenarios to prevent regressions.

Before that, protect:

* harmonization behavior
* CAPEX behavior
* structural result integrity
* assumption flag propagation
* placeholder-safe and literature-safe outputs

---

## 16. Delivery order (historical reference)

The labels below describe the **original implementation sequence** for the MVP. **Current behaviour** is defined by the repository code and by **[`docs/repository-invariants.md`](repository-invariants.md)** (export boundary, regression checklist). Use **[`docs/index.md`](index.md)** to find all specs.

### WP1 — Solution refinement

* this solution specification
* input/output field lock
* process-model basis lock
* assumptions structure lock

### WP2 — Calculation implementation specification

* formulas
* units
* parameters
* assumptions versions
* reference tests

### WP3 — Domain foundation

* TypeScript types
* zod schemas
* formatters
* assumption metadata structures
* temporal input structures
* temporal resolution helpers

### WP4 — Calculation engine

* temporal series resolution
* methane path
* hydrogen-sales alternative
* optional CAPEX allocation
* aggregations

### WP5 — Input UI

* form view
* advanced assumptions
* temporal profile editor / input controls
* electricity price mode input
* validation

### WP6 — Results UI

* KPI cards
* charts
* comparisons
* tables
* assumption flags and warnings presentation

### WP7 — Exports

* Excel
* PDF

### WP8 — Polish + QA

* error states
* documentation
* final polish

### WP9 — Server-side export hardening

* `/api/export/excel` and `/api/export/pdf` validate `scenario`, run `calculateScenario`, return bytes
* structural guards; no client-sent authoritative results

### WP10 — Release readiness

* documentation alignment with accepted implementation
* handoff and explicit MVP limitations (no product expansion)

---

## 17. Automation and agent guidance

Historical note: the following **agent split** described an early parallel workflow. For current work, follow **[`AGENTS.md`](../AGENTS.md)** (repository root), **[`.cursor/rules.md`](../.cursor/rules.md)**, and optional legacy prompts under **`cursor_agents/`** (see **`cursor_agents/README.md`**).

### Agent 1 — Domain & schemas

Responsible for:

* types
* zod validation
* unit models
* temporal input structures
* assumption metadata structures

### Agent 2 — Calculation engine

Responsible for:

* pure calculation logic
* temporal series resolution and harmonization
* stoichiometric methane path
* hydrogen alternative comparison
* optional CAPEX allocation
* aggregation

### Agent 3 — Testing

Responsible for:

* unit tests
* harmonization tests
* golden scenario tests
* edge cases

### Agent 4 — Inputs UI

Responsible for:

* forms
* validation
* temporal profile input UI
* electricity price mode UI
* advanced assumptions UI
* UX

### Agent 5 — Results UI

Responsible for:

* KPI cards
* charts
* comparison layout
* tables
* responsive behavior
* warnings and flags display

### Agent 6 — Excel export

Responsible for:

* workbook structure
* sheets
* assumptions metadata visibility
* numeric formatting

### Agent 7 — PDF export

Responsible for:

* report template
* layout
* brand-ready styling
* visible assumption flags

---

## 18. Definition of Done for MVP

The MVP is done when:

* user can define all required scenario inputs
* mode-based CO₂ input works
* mode-based electricity input works
* daily-first calculation engine works
* methane path works using stoichiometric + literature-based defaults
* hydrogen alternative comparison works
* optional simple CAPEX works
* KPI summary renders correctly
* literature-based assumptions are explicitly flagged in UI and exports
* Excel export works
* PDF export works
* validation and shape tests pass

---

## 19. Assumptions Used in This Specification

* The tender requirement is the stronger source of truth versus older internal MVP assumptions.
* Daily internal resolution is sufficient for MVP if hourly input remains supported at the contract level.
* Literature-based defaults are acceptable for MVP when clearly marked and separated from customer-confirmed values.
* Profitability prices are interpreted as markup on cost in MVP.
* Methane is priced in `EUR/t_CH4` in MVP.
