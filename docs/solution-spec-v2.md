# Solution Specification v2
**Project:** Hiiliketju – browser-based techno-economic calculation application  
**Implementation model:** Next.js + TypeScript + Cursor-agent guided implementation  
**Status:** Updated after revised tender requirements  
**Language of UI (current):** **Finnish** is the default first paint when no stored locale exists; **English** and **Swedish** are available through the in-app locale control. Copy lives in `src/i18n/messages/` (dot-path keys).
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
  - **`historical_market_data_imported` defaults:** pre-loaded with deterministic repository-local 2025 Finnish spot-market prices derived from `sources/electricity_prices.csv` (porssisahko.net, VAT included). Hourly defaults come from the delivered source data; daily defaults are derived from those hourly prices by arithmetic mean per calendar date (23, 24, or 25 hourly values on DST transition days). Both resolutions are available. Users may override by pasting or importing their own EUR/MWh series.
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
- persistent saved scenarios (browser state only; no server-side scenario store in MVP)
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
- **Current setup defaults for commercial assumptions:** methane assumed sales price initializes to **`1200 EUR/t_CH4`** and hydrogen assumed sales price initializes to **`4 EUR/kg_H2`**. These are editable scenario defaults, not product-locked calculation outputs.

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

### 6.4 Modifier policy (process parameters on the wire)
**Stoichiometric factors and SEC** are user-facing, **calculation-active** process parameters with full assumption metadata in Advanced and in exports.

**`plantAvailabilityPct` and `processEfficiencyPct`** remain on the canonical **`ScenarioInput`** with literature-style defaults for **future** engine use. They are **not** shown as active user inputs in the current product UI, **not** listed in “assumptions used” readouts, and **not** applied as multipliers in the shipped daily engine until explicitly wired in a future scoped change. The stoichiometric core stays separable from any future modifier layer.

---

## 7. Functional View Structure

### 7.1 Inputs view (Simple-first + Advanced)
**Basic (default) path:** annual **CO₂** (`kt/year`), **utilization rate**, and **electricity purchase price** (constant or imported market data). **Scenario name** is not required on the Simple surface; it remains in **Advanced**.

**Advanced** adds: scenario metadata, full **CO₂ availability** mode and profiles (default new scenario: **`seasonal_daily`** with winter-weighted monthly relative weights — see invariants for numeric defaults), **economics**, optional **CAPEX**, and **process** overrides. Optional browser **CSV import** fills the same bulk **`seriesText`** path as paste for supported time-series modes.

All of the following still exist on the wire where applicable: scenario name, annual CO₂, utilization, CO₂ mode and data, electricity mode and values, methane/hydrogen assumed sales prices, other OPEX, optional CAPEX, process assumption fields (see §7.2).

### 7.2 Advanced assumptions (user-facing, engine-active only)
The **visible** Advanced process block lists **only** parameters the **shipped engine** uses: **stoichiometric H₂ demand**, **stoichiometric CH₄ yield**, **electrolyzer SEC** (kWh/kg H₂), plus **derived SEC (MWh)** where shown. **`plantAvailabilityPct`** and **`processEfficiencyPct`** are **not** included in this user-facing list (retained internally on the wire for future work).

All non-customer-provided values among the **shown** fields must display their source flag. The setup UI shows active literature-based defaults immediately (value, unit, source/status, optional note) and allows explicit overrides.

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

#### Qualitative readouts (reporting interpretation, not new engine output)
- **Economic verdict:** a small, color-coded band (favourable / mixed / unfavourable / not computable) derived **only** from existing annual summary fields — **not** an investment recommendation.
- **Assumptions used in this calculation:** grouped summary (scenario, CO₂, electricity, economics, CAPEX, process) reflecting what was actually merged into the run, including Simple defaults. Excludes internal future-capability-only fields not surfaced in UI (e.g. plant availability / process efficiency as user-facing active assumptions).

#### Visualizations
At minimum:
- CO₂ availability over time
- electricity price over time
- methane production over time
- cost vs revenue
- methane path vs hydrogen sales comparison

**Presentation (current):** charts have **axis labels with units**, compact display units where helpful, and at most **two decimal places** in typical tick/tooltip/table display. The **lower caption** under each chart carries the date/unit context; the SVG no longer duplicates that string. **Cost vs. revenue** uses clearly distinct line colours.

#### Tables
At minimum:
- annual summary
- monthly or aggregated summary
- optional daily preview

### 7.4 Export functions

#### Excel
Must include:
- inputs
- assumptions (with flags for literature-based values where applicable)
- **economic verdict** and **used assumptions** material consistent with the results readout layer
- time series results
- annual summary
- comparison summary

**Data sheets** keep **numeric** cells; number formats apply display rounding where used — raw engine values are not replaced by pre-rounded strings for analysis columns.

#### PDF
Must include:
- scenario overview
- key assumptions
- **economic verdict** and **used assumptions** summary aligned with the UI readout layer
- visible literature-based flags for estimated values
- KPI summary
- charts (with improved margins/typography vs. early MVP — see invariants)
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

#### C. Process assumptions (conceptual groups)
- **Engine-active (user-facing in Advanced):** stoichiometric factors, SEC (and derived MWh presentation where used)
- **Retained on wire for future engine work:** plant availability, process efficiency (not user-facing active assumptions in the current product)

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
- CO₂: `kt/year` in the visible form; retained internal conversion helpers for `kg/year` do not change the current product UI
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
- **exports and the canonical wire `ScenarioInput` use canonical business units** (`kt/year`, `EUR/MWh`, etc.); annual CO₂ remains visibly `kt/year`, while the constant-electricity form may use `c/kWh` before conversion. Retained internal annual-CO₂ conversion helpers do not change export column semantics
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

(Internal wire fields such as plant availability / process efficiency may still carry neutral defaults on the merged input; they are **not** promoted to user-facing “active assumption” warnings while those parameters are not engine-applied or user-edited in the visible Advanced list.)

### 11.4 Error handling principle
The UI must show user-friendly errors, not technical exceptions.

---

## 12. Non-Functional Requirements

### 12.1 Usability
- clear and expert-oriented
- no heavy multi-step navigation
- quick to use with defaults — **Simple-first** main path; **Advanced** for full control
- default **Finnish** copy when no locale is stored; **locale** control for EN/SV
- advanced engine-active assumptions are available without overwhelming the main workflow; guidance callouts explain major sections
- primary chrome is a **sticky top bar**: run, reset, language, jump to outcome, and Excel/PDF export (exports disabled until a successful run exists); a successful run **scrolls** to the outcome section (`#scenario-outcome`); this is layout/UX only and does not change calculation or export contracts
- **Home hero (WP27):** optional static partner marks (**Business Finland**, **LAB**) from **`/business-finland-logo.svg`** and **`/lab-logo.svg`** (place files in **`public/`**); i18n **alt** text; no visible “Partners” label; not inside a separate card

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

### Customer-delivery tranche (WP22–WP27, historical reference)

**Note:** the labels below are a **later** implementation sequence (customer feedback), **not** the same as WP1–WP10. **Current behaviour** = repository code + **[`docs/repository-invariants.md`](repository-invariants.md)**.

- **WP22** — Default **Finnish** + **Simple-first** setup (Basic inputs only on the main path; full scenario name and details in Advanced); hydration-safe locale; no separate `SimpleScenarioInput` type.
- **WP22** — hotfix: locale hydration consistency.
- **WP23** — **Active assumptions policy:** only engine-used process parameters in user-facing Advanced and in “assumptions used” / export surfaces; `plantAvailabilityPct` / `processEfficiencyPct` retained on wire, not user-facing active.
- **WP24** — Default **seasonal** CO₂ mode with **winter-weighted** monthly relative weights; **localized** month names; visible **guidance** callouts.
- **WP25** — **Economic verdict** + **assumptions used in this calculation** in UI, Excel, and PDF (interpretive; no new KPI math).
- **WP26** — **Chart / table / PDF** presentation: axis labels, compact units, two-decimal display, PDF robustness; **follow-up:** single X-axis caption per chart; clearer **cost vs. revenue** colours.
- **WP27** — **Hero** partner marks (**Business Finland**, **LAB**) via static `public/` SVG URLs; **follow-up:** larger logos, no card wrapper, no visible “Partners” line.

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
