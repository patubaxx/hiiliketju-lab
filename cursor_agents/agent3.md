# Cursor Agent Prompt — Agent 3: Testing Foundation, Formula Locking & Golden Scenario Harness

Your task is to implement the testing foundation for the Hiiliketju project on top of the existing domain, schema, harmonization, calculation, aggregation, and scenario orchestration layers.

## Goal

Build a clean, maintainable testing foundation that supports:
1. unit tests for the current calculation building blocks
2. validation tests for schema behavior
3. regression-safe tests for temporal harmonization
4. regression-safe tests for locked stoichiometric formulas
5. regression-safe tests for CAPEX allocation and aggregation
6. a reusable golden scenario harness for later formula tightening

This work must reflect the actual MVP calculation logic now locked in the project.

---

## Context

The project is a browser-based techno-economic calculator.

By the time you do this task, the codebase should already contain:
- domain types
- assumption metadata / flags
- zod input schemas
- CO₂ temporal input structures
- electricity temporal input structures
- temporal harmonization to canonical daily series
- simple CAPEX allocation logic
- daily result calculation
- aggregation functions
- top-level scenario calculation
- canonical result model

The architecture direction is already decided:
- Next.js + TypeScript
- calculation logic separated from UI
- one canonical result structure later used by UI, Excel, and PDF
- tests should protect both business logic and architectural invariants
- literature-based defaults and their propagation must be testable

The implementation should be practical, lightweight, and maintainable.

---

## Locked assumptions for this task

Use these assumptions as fixed.

### Calculation resolution
- internal engine = `daily`
- annual period = `365 days`
- hourly CO₂ -> daily aggregation = `sum`
- hourly electricity price -> daily aggregation = `arithmetic_mean`

### Supported CO₂ modes
- `flat_annual`
- `seasonal_daily`
- `time_series_daily`
- `time_series_hourly`

### Supported electricity modes
- `constant`
- `daily_series`
- `hourly_series`
- `historical_market_data_imported`

### CAPEX
- CAPEX is optional
- simple lifetime allocation formula:
  `annualCapexCost = (electrolyzerCapexEur + methanationCapexEur) / capexLifetimeYears`
- daily CAPEX allocation =
  `annualCapexCost / 365`

### Locked literature-based defaults
- `stoichiometricHydrogenDemandFactor = 0.1832 kg_H2/kg_CO2`
- `stoichiometricMethaneYieldFactor = 0.3645 kg_CH4/kg_CO2`
- `electrolyzerSpecificEnergyConsumption = 54 kWh/kg_H2`
- `electrolyzerSpecificEnergyConsumptionMWh = 0.054 MWh/kg_H2`
- `plantAvailabilityPct = 100`
- `processEfficiencyPct = 100`

### Locked KPI formulas
- `breakEvenMethanePrice = annualTotalCost / annualMethaneProduced`
- `priceAt10PctProfitability = annualTotalCost * 1.10 / annualMethaneProduced`
- `priceAt30PctProfitability = annualTotalCost * 1.30 / annualMethaneProduced`
- `hydrogenAlternativeRevenue = hydrogenNeeded * hydrogenPrice`

### Important test policy
- test what the implementation actually does
- do not invent unsupported behaviors
- use tolerances where floating-point distribution makes exact equality brittle
- verify literature-based metadata propagation explicitly

---

## Main implementation objective

Create a testing structure that protects:
1. schema correctness
2. temporal harmonization correctness
3. stoichiometric formula correctness
4. CAPEX allocation correctness
5. aggregation correctness
6. annual KPI correctness
7. result shape and metadata integrity
8. future regression safety through a reusable golden scenario harness

---

## Deliverables

Implement the following.

### 1. Test setup and organization

Use the project’s current test tooling if it already exists.
If not present, add a practical minimal TypeScript-friendly setup.

Preferred direction:
- **Vitest**
- fast unit/integration-style logic tests
- no browser-driven setup
- no unnecessary complexity

Organize tests clearly by concern, for example:
- schema tests
- harmonization tests
- formula tests
- CAPEX tests
- aggregation tests
- orchestration tests
- golden scenario harness

### 2. Schema validation tests

Create tests for the main scenario input schema behavior.

Coverage must include at least:
- valid minimal scenario input passes
- missing required scenario name fails
- invalid annual CO₂ input fails where appropriate
- invalid methane price fails where appropriate
- invalid hydrogen price fails where appropriate
- valid CO₂ mode structures pass
- invalid CO₂ mode structures fail
- valid electricity mode structures pass
- invalid electricity mode structures fail
- valid optional CAPEX structure passes
- invalid CAPEX lifetime structure fails when CAPEX included
- utilization rate boundaries behave correctly

Important:
- align with real schema implementation
- do not fabricate schema rules that do not exist

### 3. Temporal harmonization tests

Create focused tests for CO₂ and electricity harmonization.

#### CO₂ harmonization coverage
- flat annual -> 365 daily rows
- seasonal daily -> 365 daily rows
- daily series passes correctly
- hourly series aggregates to daily using **sum**
- annual CO₂ total is preserved within documented tolerance
- month indexing and date labeling are internally consistent

#### Electricity harmonization coverage
- constant price -> 365 daily rows
- daily series passes correctly
- hourly series aggregates to daily using **arithmetic mean**
- imported historical series is normalized correctly if supported by current implementation
- invalid hourly structure fails clearly

### 4. Stoichiometric formula tests

Create focused tests for the locked core formulas.

Coverage must include at least:
- usable CO₂ from utilization rate
- hydrogen demand from stoichiometric factor
- methane production from stoichiometric factor
- electricity consumption from SEC
- electricity cost from daily electricity price
- methane revenue from methane produced and price
- hydrogen alternative revenue from hydrogen needed and hydrogen price

Use readable deterministic fixture values.

### 5. CAPEX allocation tests

Create focused tests for the CAPEX allocation module.

Coverage must include at least:
- includeCapex = false -> annual CAPEX = 0
- includeCapex = true -> correct annual CAPEX allocation
- correct daily CAPEX allocation over 365 days
- invalid lifetime case fails clearly
- deterministic output for identical input

### 6. Aggregation tests

Create tests for:
- monthly aggregation
- annual aggregation

Coverage must include at least:
- monthly grouping works correctly
- month ordering is preserved
- annual totals sum correctly from daily results
- electricity cost totals aggregate correctly
- CAPEX totals aggregate correctly
- methane revenue totals aggregate correctly
- hydrogen alternative revenue totals aggregate correctly
- annual summary includes all locked KPI fields
- zero-methane denominator handling is explicit and consistent

If the current implementation uses `null` for not-computable KPI values, test that directly.

### 7. Scenario orchestration tests

Create tests for the top-level calculation flow.

Coverage must include at least:
- valid scenario input produces a structurally valid `CalculationResult`
- daily results length is 365
- monthly summary length is 12
- annual summary exists
- annualized CAPEX is reflected when CAPEX is included
- annualized CAPEX is zero when CAPEX is excluded
- annual CO₂ available and utilized behave consistently
- profitability KPIs compute correctly when methane production > 0
- result is deterministic for identical input

### 8. Assumption metadata propagation tests

Create tests that verify:
- literature-based defaults are represented with correct metadata
- assumptions metadata is not lost in scenario calculation results
- source/status/note fields remain available for later UI/export use
- customer-confirmation-pending values can remain distinguishable if the implementation supports it

This is an important part of the updated spec. Test it explicitly.

### 9. Golden scenario harness

Create the initial golden scenario harness so later agents can lock future formula changes against stable reference scenarios.

Implement:
- a small fixture structure for named scenarios
- a way to store expected outputs or partial expected outputs
- a helper that compares actual result vs expected result
- support for numeric tolerance
- support for partial assertions
- readable failure output

Do not overengineer a mini test framework.

### 10. Golden scenario fixtures

Create at least 2 useful golden scenarios.

Recommended:
1. **Flat annual scenario**
   - flat CO₂
   - constant electricity price
   - CAPEX off
   - easy-to-read prices and utilization
2. **Seasonal + CAPEX scenario**
   - seasonal daily CO₂
   - daily or hourly electricity data
   - CAPEX on
   - enough variation to test harmonization + aggregation + KPIs

These scenarios should lock:
- harmonization behavior
- formula behavior
- CAPEX behavior
- aggregation behavior
- orchestration stability

---

## Functional requirements

### Test style
Use:
- clear test names
- focused scopes
- low ceremony
- minimal mocking
- real function calls for pure logic modules

### Golden scenario comparison
Your golden scenario helper should support:
- exact structural assertions where safe
- tolerance-based numeric assertions where appropriate
- partial expected results
- readable failure output

### What should be locked now
The tests should lock:
- supported mode behavior
- daily-first harmonization behavior
- stoichiometric formula behavior
- simple CAPEX allocation behavior
- annual KPI formula behavior
- assumptions metadata presence

### What should not be overfit
Do not make brittle tests around:
- irrelevant internal helper implementation details
- floating-point micro-differences beyond meaningful tolerance
- hypothetical future fields that do not exist yet

---

## Non-functional requirements

### Code quality
- readable tests
- maintainable helper structure
- no duplicated large fixtures unless justified
- no snapshot-heavy approach

### Maintainability
- later agents should be able to tighten golden scenarios without rewriting the harness
- fixture structure should be easy to expand
- tests should help debugging

### Performance
- tests should remain fast
- no heavyweight setup
- no browser/E2E framework in this task

---

## Important constraints

Do **not** do these:
- do not invent unsupported formulas
- do not create browser/E2E test infrastructure
- do not add React component tests in this task
- do not rely heavily on snapshots
- do not weaken assertions so much that regressions slip through
- do not ignore literature-based metadata propagation

---

## Recommended file/module structure

```txt
src/
  core/
    calculation/
      __tests__/
        resolve-co2-series.test.ts
        resolve-electricity-price-series.test.ts
        allocate-capex.test.ts
        aggregate-results.test.ts
        calculate-scenario.test.ts
        core-formulas.test.ts
  features/
    scenario/
      schemas/
        __tests__/
          scenario-schema.test.ts
  test/
    fixtures/
      golden-scenarios.ts
    helpers/
      assert-golden-scenario.ts
````

You may adjust the exact structure slightly if needed to match the existing project conventions, but keep it logically equivalent and clean.

---

## Output format

When you finish, provide:

1. a short summary of what you implemented
2. the created/modified file list
3. any assumptions you made
4. any open issues or recommendations for the next agent

---

## Definition of done

This task is done when:

* core schema tests exist
* temporal harmonization tests exist
* stoichiometric formula tests exist
* CAPEX allocation tests exist
* aggregation tests exist
* scenario orchestration tests exist
* assumption metadata propagation tests exist
* a reusable golden scenario harness exists
* at least 2 useful golden scenarios exist
* tests reflect the updated MVP logic honestly and help prevent regression

```