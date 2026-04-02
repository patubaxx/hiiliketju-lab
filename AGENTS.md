# AGENTS.md

## Project

**Hiiliketju** is a browser-based techno-economic calculator for evaluating CO₂, hydrogen, and methane value chains under different scenarios.

The application is intended to support:
- research and expert analysis
- industrial stakeholder discussions
- decision support through transparent scenario-based calculations

The MVP is implemented in **Next.js + TypeScript** and follows a **layered architecture** where UI, calculation logic, assumptions, and reporting are clearly separated.

---

## Working language

Use **English** as:
- the repository working language
- the default code language
- the default documentation language inside the repository
- the MVP default UI/content language unless explicitly specified otherwise

Write:
- code in English
- comments in English
- filenames in English
- identifiers in English
- test names in English

---

## Core project goal

Build a **formula-ready**, maintainable calculator architecture first.

At this stage, the repository must support:
- stable domain models
- validated scenario input
- daily profile generation
- modular calculation orchestration
- CAPEX annualization
- aggregation
- test harnesses
- future insertion of final customer formulas without major refactoring

The current priority is **sound structure**, not fake completeness.

---

## MVP scope

The MVP includes:
- annual CO₂ amount input
- CO₂ utilization rate
- constant electricity price
- monthly weighted annual availability profile
- daily calculation across 365 days
- methane-path calculation structure
- hydrogen alternative comparison structure
- OPEX structure
- annuitized CAPEX
- unit-cost structure
- result visualization
- Excel export
- brandable PDF export

The MVP excludes:
- user accounts and login
- persistent scenario storage
- user-imported daily/hourly raw series
- CSV import
- multiple parallel process chains
- advanced investment metrics such as NPV / IRR / payback
- free-form process diagram editing
- brewery-specific path in current scope unless explicitly reintroduced

---

## Architecture invariants

These rules are non-negotiable.

### 1. No business logic in UI

React components must not contain:
- techno-economic formulas
- business calculation logic
- hidden unit conversions tied to business rules
- parallel aggregation logic

UI is responsible for:
- input collection
- validation display
- user interaction
- presentation of already-calculated results

### 2. Calculation logic stays in the calculation/domain layer

Business logic must live in dedicated modules under calculation/domain-oriented folders such as:
- `src/core/domain`
- `src/core/calculation`
- related pure helper modules

### 3. One canonical result structure

UI, Excel, and PDF must consume the same canonical calculation result shape.

Exports must not run their own parallel business logic.

### 4. Thin orchestration, modular calculation steps

Top-level scenario calculation should remain thin and readable.

Detailed logic must be pushed into dedicated pure modules such as:
- profile generation
- CAPEX annualization
- daily calculation steps
- aggregation
- comparison logic

### 5. Future formula insertion must be easy

When final customer formulas arrive, the codebase should allow replacing placeholder logic in dedicated modules without forcing broad refactors across:
- UI
- exports
- schemas
- orchestration
- test harnesses

---

## Placeholder policy

Final customer formulas and parameter values are not yet fully available.

Because of that, all agents must follow these rules:

### 1. Never invent customer-specific formulas

Do not fabricate:
- process formulas
- conversion factors
- economics constants
- hidden default business assumptions
- pseudo-scientific fallback values presented as real

### 2. Unknown logic must remain explicit

If logic is not known yet, represent it explicitly with:
- placeholder functions
- clearly named temporary return values
- TODO markers
- comments that identify the missing dependency

Recommended marker styles:
- `TODO(formula)`
- `TODO(customer-data)`
- `TODO(unit-decision)`
- `TODO(assumption-lock)`

### 3. Placeholder outputs must not look final

Do not present placeholder-stage outputs as validated business truth.

If a value is unresolved, use an explicit and non-misleading representation.

### 4. Placeholders must be easy to replace

Do not scatter placeholder logic across many unrelated files.

Keep placeholder behavior centralized in the modules that will later own the real logic.

---

## Input and validation rules

### 1. Validate at boundaries

External input must be validated at schema boundaries before or at calculation entry.

### 2. Prefer explicit failure over silent guessing

If a business rule is unknown, do not silently infer it.

Fail clearly or keep it as an explicit placeholder-stage concern.

### 3. Monthly profile rules

For monthly weighted profile logic:
- exactly 12 monthly weights are required
- individual zero weights are allowed
- all-zero monthly weights are a validation error
- the profile uses a fixed non-leap-year 365-day calendar in MVP

### 4. Numeric validity

Reject clearly invalid numeric inputs where appropriate, such as:
- negative values where not allowed
- invalid percentages
- invalid annualization lifetime values

### 5. Error handling

Do not hide important domain errors behind vague defaults.

Use clear, developer-readable failure behavior.

---

## Units policy

Unit handling must remain explicit but lightweight.

### 1. Do not rely only on field names for units

Unit meaning must not be encoded only in names like `fooKg` forever if the architecture is meant to support multiple unit variants later.

### 2. Keep the unit model lightweight

Do not introduce a heavy measurement framework unless clearly necessary.

### 3. Support future expansion

The architecture should allow future support for multiple business-readable units, especially for methane and possibly other result values.

### 4. Temporary unit assumptions must be documented

If a module temporarily assumes a unit, document it close to the code.

---

## CAPEX and annualization policy

### 1. CAPEX annualization must be modular

Do not hardcode annualization logic inline in broad orchestration code.

### 2. Default method

The default annualization method for MVP is:
- `annuity`

### 3. Zero discount fallback

If discount rate is zero, use:
- `annualizedCapex = capex / lifetimeYears`

### 4. Invalid lifetime handling

If lifetime is zero or negative, fail clearly.

### 5. Keep annualization extensible

Implement CAPEX annualization in a way that later allows alternative methods without rewriting orchestration.

---

## Calculation design rules

### 1. Deterministic calculation

The calculation engine must be deterministic:
- same input => same output

### 2. Pure functions preferred

Calculation modules should be implemented as pure functions whenever practical.

### 3. No hidden data fetching

Calculation logic must not fetch external data during execution.

### 4. Stable contracts

Protect stable calculation contracts:
- `ScenarioInput`
- `DailyResult`
- `MonthlySummary`
- `ScenarioSummary`
- `CalculationResult`

Do not change these casually.

### 5. Explicit aggregation

Daily → monthly → annual aggregation must be implemented explicitly and readably.

Do not bury important aggregation behavior inside UI or formatter layers.

---

## Export rules

### 1. Exports consume calculated results

Excel and PDF layers must consume canonical calculated output.

### 2. No export-specific business calculation branches

Do not duplicate business formulas inside export modules.

### 3. Formatting stays separate from calculation

Formatting, labels, and presentation belong to reporting/export layers, not core calculation modules.

---

## Testing expectations

### 1. Calculation changes require tests

Changes to the calculation/domain layer should add or update tests.

### 2. Placeholder behavior must be tested honestly

Do not encode fake business truth into tests before formulas are known.

### 3. Golden scenarios should evolve

Golden scenario infrastructure should exist early, but pre-formula scenarios may assert only:
- agreed structural behavior
- profile behavior
- annualization behavior
- aggregation behavior
- placeholder-safe outputs

When final formulas arrive, extend the golden scenarios rather than replacing the whole test structure.

### 4. Prefer focused tests

Use clear, maintainable tests over overly broad or snapshot-heavy tests.

---

## Change safety rules

### 1. Prefer minimal diffs

Make the smallest coherent change that solves the task.

### 2. Avoid unrelated refactors

Do not refactor unrelated modules while implementing an assigned task unless necessary for correctness.

### 3. Preserve file structure unless needed

Do not reorganize the repository casually.

### 4. Protect public/domain contracts

Do not rename or reshape important domain contracts without a strong architectural reason.

### 5. Update dependents together

If a shared type or result shape must change, update:
- dependent types
- tests
- orchestrators
- directly affected consumers

in the same change.

---

## Documentation discipline

### 1. Keep implementation aligned with specs

The repository should remain aligned with the current project specs.

If implementation intentionally diverges from current documentation:
- make that divergence explicit
- explain it briefly in code comments or task output

### 2. Document new assumptions

If you introduce a new assumption, document it near the relevant code.

### 3. Do not hide uncertainty

If something is unresolved, say so explicitly in code comments, task summaries, or TODO markers.

---

## Recommended repository structure direction

Use this as the default architectural direction unless there is a strong reason to deviate:

```txt
src/
  app/
  core/
    domain/
    calculation/
    reporting/
  features/
    scenario/
      components/
      forms/
      hooks/
      schemas/
  components/
  lib/
test/
```

This is a direction, not a rigid law, but changes should preserve the same layered intent.

---

## Definition of good agent work

A change is considered good when it:
- respects layered architecture
- keeps business logic out of UI
- keeps placeholders explicit
- does not invent missing formulas
- maintains or improves testability
- preserves canonical result contracts
- uses English consistently
- makes future formula insertion easier, not harder

A change is **not** considered good if it:
- hides assumptions
- spreads placeholder logic randomly
- duplicates business logic across layers
- introduces broad unnecessary refactors
- makes export or UI layers smarter than the calculation layer
- makes unresolved logic look finalized

---

## Agent behavior when information is missing

If required formula or business information is missing:
1. do not invent the missing logic
2. implement only the safe structural part
3. leave an explicit extension point
4. document the assumption or gap clearly
5. keep the architecture ready for the missing piece to be added later

---

## Current project-specific assumptions

At the current stage of the project, assume the following unless updated elsewhere:

- working language is English
- MVP default language is English
- annual calculation period is fixed at 365 days
- monthly weighted profile is the default availability model
- methane default business unit is currently assumed to be kg, but architecture must remain unit-extensible
- hydrogen alternative logic will later depend on a separate hydrogen availability assumption
- CAPEX is annualized with annuity as default strategy
- zero discount rate uses straight-line fallback
- final customer formulas are still pending
- placeholder-ready architecture is preferred over fake completeness

---

## Final instruction

When in doubt, choose the option that:
- keeps the architecture cleaner
- keeps uncertainty explicit
- avoids invented business logic
- reduces future refactoring
- preserves the separation between UI, calculation, and reporting