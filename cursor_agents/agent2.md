# Cursor Agent Prompt — Agent 2: CAPEX Annualization & Aggregation Skeleton

Your task is to implement the next layer of the Hiiliketju project after the domain/types/profile foundation is in place.

## Goal

Build the calculation-engine skeleton for:
1. CAPEX annualization
2. daily-to-monthly aggregation
3. daily-to-annual aggregation
4. placeholder-ready scenario calculation orchestration

This work must remain **formula-ready**, not formula-complete.

You are not implementing final customer process formulas yet. Your task is to create the reusable calculation structure into which the real methane, hydrogen, electricity, and comparison formulas can later be inserted with minimal refactoring.

---

## Context

The project is a browser-based techno-economic calculator.

Agent 1 has already implemented:
- TypeScript domain types
- Zod schemas
- scenario input structure
- unit-model foundation
- monthly weighted daily profile generator

Your work now is to build the next calculation layer on top of that foundation.

The architecture direction is already decided:
- Next.js + TypeScript
- calculation logic must stay outside UI
- one canonical calculation result structure must later support UI, Excel, and PDF
- final customer formulas and parameter values are **still not available**
- code must be easy to extend later without rewriting the architecture

This implementation must be practical, minimal, deterministic, and maintainable.

---

## Locked assumptions for this task

Use these assumptions as fixed for your implementation:

- project working language: **English**
- MVP default language: **English**
- annual profile period is always **365 days**
- CAPEX annualization is implemented as a **strategy/configurable calculation method**
- default annualization strategy is **annuity**
- fallback behavior for zero discount rate is:
  - `annualizedCapex = capex / lifetimeYears`
- lifetime years must be greater than zero for valid annualization
- no final methane / hydrogen / electricity / revenue formulas yet
- hydrogen alternative path will later rely on a **separate hydrogen availability assumption**
- aggregation must work even while process formulas are still placeholders
- no UI logic
- no export logic
- no database or persistence logic

---

## Main implementation objective

Create a calculation-engine skeleton that supports this future flow:

1. validate scenario input
2. build daily availability profile
3. run placeholder-ready daily calculation pipeline
4. allocate annualized CAPEX into daily values
5. aggregate daily values into monthly summary
6. aggregate daily values into annual summary
7. return one canonical `CalculationResult`

At this stage, the daily calculation pipeline may use placeholders for unresolved formula outputs, but the orchestration and aggregation structure must be real and production-usable.

---

## Deliverables

Implement the following:

### 1. CAPEX annualization module

Create a pure annualization module that supports at least:

- `annuity` strategy
- strategy-style extension point for future methods

Implement:
- annualization input type
- annualization strategy type
- default annuity calculation
- zero-discount fallback
- validation handling for invalid lifetime
- small, readable, testable functions

Use the standard annuity formula for the default method.

Expected behavior:
- if `discountRate > 0`, use annuity formula
- if `discountRate === 0`, use straight-line annualization:
  - `capex / lifetimeYears`
- if `lifetimeYears <= 0`, fail clearly
- if invalid numeric values are encountered, fail clearly

Do not hardcode annualization logic inside the main scenario calculation function. Keep it modular.

### 2. Aggregation model and functions

Implement reusable pure functions for:

- monthly aggregation
- annual aggregation

These functions should operate on `DailyResult[]` and/or clearly related intermediate structures.

Monthly aggregation must:
- group by month
- preserve month ordering
- compute meaningful rollups for all available numeric fields
- be easy to extend later if new result fields are added

Annual aggregation must:
- sum annual totals for relevant numeric fields
- produce the `ScenarioSummary` structure
- handle placeholder fields in a consistent way
- avoid embedding final customer formula assumptions

### 3. Monthly summary structure

Create a clean `MonthlySummary` type or equivalent if it does not yet exist.

At minimum, monthly summary should be able to represent:
- month index or month label
- aggregated available CO₂
- aggregated usable CO₂
- aggregated hydrogen needed
- aggregated methane produced
- aggregated electricity consumed
- aggregated variable cost
- aggregated allocated CAPEX
- aggregated total cost
- aggregated methane revenue
- aggregated hydrogen alternative revenue

If some of these fields are currently placeholder-driven, still keep the structure in place.

### 4. Placeholder-ready daily calculation step

Create a minimal daily calculation layer that can consume:
- the daily profile from Agent 1
- scenario input
- annualized CAPEX result

and produce `DailyResult[]`.

Important:
- do **not** invent real customer formulas
- do **not** hardcode fake scientific constants
- do **not** pretend placeholder outputs are validated business outputs

Instead:
- build a clearly marked placeholder calculation pipeline
- use neutral placeholder handling where unresolved fields can safely remain zero-based or explicitly TODO-driven
- ensure the result shape is stable and ready for future formula insertion

Recommended direction:
- available CO₂ comes from daily profile
- usable CO₂ can be calculated from utilization rate, since that logic is already agreed
- unresolved fields such as hydrogen, methane, electricity, and revenues may use explicit placeholder functions returning zero or clearly labeled future values
- daily allocated CAPEX should be `annualizedCapex / 365`
- total cost should be structurally correct even if some variable-cost components are still placeholders

### 5. Scenario calculation orchestrator skeleton

Implement a top-level pure function such as:

```ts
calculateScenario(input: ScenarioInput): CalculationResult
```

This function should:
1. assume validated input or perform defensive validation depending on the existing architecture
2. build the daily profile
3. compute annualized CAPEX through the annualization module
4. generate daily results through the placeholder-ready daily calculation pipeline
5. aggregate monthly summary
6. aggregate annual summary
7. return the canonical result object

The orchestration must be easy to read and easy for later agents to extend.

### 6. File/module structure

Implement the code in a clean structure aligned with this direction:

```txt
src/
  core/
    calculation/
      annualize-capex.ts
      aggregate-results.ts
      calculate-scenario.ts
      calculate-daily-results.ts
    domain/
      result.ts
```

If Agent 1 already created some files that need extending, update them cleanly instead of duplicating concepts.

You may adjust filenames slightly if needed, but keep the structure logically equivalent and clean.

---

## Functional requirements

### CAPEX annualization

Implement support for a structure conceptually equivalent to:

```ts
type CapexAnnualizationMethod = "annuity"

type CapexAnnualizationInput = {
  capexEur: number
  lifetimeYears: number
  discountRatePct: number
  method: CapexAnnualizationMethod
}
```

You may extend this slightly if needed, but do not overengineer.

### Daily allocated CAPEX

Daily allocated CAPEX should be derived from annualized CAPEX using:

```ts
allocatedCapexCost_day = annualizedCapex / 365
```

### Monthly aggregation

Monthly aggregation should be based on the fixed 365-day calendar profile and should produce stable, ordered summaries.

### Annual aggregation

Annual aggregation should produce a structurally complete summary even when some calculation branches are still placeholders.

At minimum, the annual summary should include:
- annual methane produced
- annual hydrogen needed
- annual electricity consumed
- annual variable cost
- annual CAPEX cost
- annual total cost
- methane revenue
- hydrogen sales alternative revenue
- unit cost methane
- delta vs hydrogen sale

For fields that cannot yet be fully resolved because final formulas are missing:
- keep them structurally present
- use clearly documented placeholder behavior
- avoid misleading fake business logic

### Placeholder KPI handling

Because final formulas are not available, implement safe placeholder behavior for:
- `unitCostMethane`
- `deltaVsHydrogenSale`

Suggested approach:
- if denominator is zero, return `null`, `undefined`, or another explicit non-misleading representation already compatible with the project style
- do not silently invent ratios
- document your chosen approach in comments

Pick one consistent approach and use it throughout.

---

## Non-functional requirements

### Code quality
- strict TypeScript style
- small pure functions where useful
- no duplicated aggregation logic
- readable naming
- avoid unnecessary abstraction layers

### Architecture
- annualization logic must be independent from aggregation logic
- aggregation logic must be independent from UI/export formatting
- scenario orchestration must remain thin and readable
- future formula insertion should require changing dedicated calculation functions, not the full orchestration

### Maintainability
- keep extension points obvious
- avoid coupling placeholder logic to permanent architecture decisions
- write comments only where they add real clarity

---

## Important constraints

Do **not** do these:
- do not implement final methane production formulas
- do not implement final hydrogen demand formulas
- do not implement final electricity consumption formulas
- do not implement final comparison formulas
- do not create React components
- do not add charts
- do not add Excel/PDF code
- do not add database, API, or persistence logic
- do not hardcode customer-specific constants
- do not bury placeholder assumptions in unrelated modules

---

## Expected implementation choices

Use sensible assumptions for unresolved details, but keep them lightweight and explicit.

Recommended choices:
- annuity formula is the default annualization strategy
- zero discount rate uses straight-line fallback
- invalid lifetime clearly fails
- daily CAPEX allocation is evenly spread across 365 days in MVP
- aggregation functions should sum numeric result fields explicitly or through a well-structured helper
- unresolved KPI values should use a non-misleading explicit representation rather than a fake numeric value

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
- CAPEX annualization exists as a modular pure calculation utility
- annuity strategy is implemented
- zero-discount fallback is implemented
- invalid lifetime handling is clear
- daily CAPEX allocation is included in the daily result pipeline
- monthly aggregation works
- annual aggregation works
- the top-level scenario calculation skeleton returns a canonical calculation result
- placeholder behavior is explicit and non-misleading
- the structure is ready for later formula-agent work without refactoring