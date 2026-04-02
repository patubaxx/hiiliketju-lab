# .cursor/rules

## Purpose

These rules define how Cursor agents must behave inside this repository.

They complement `AGENTS.md` and are intended to keep implementation consistent, safe, and maintainable during iterative multi-agent work.

If a task-specific prompt conflicts with these rules, follow the more specific instruction **unless** it would break a core architectural invariant.

---

## Working language

Use **English** for:
- code
- comments
- identifiers
- filenames
- test names
- documentation inside the repository
- MVP default UI/content unless explicitly instructed otherwise

Do not mix Finnish and English in code or repository documentation.

---

## Architecture rules

### 1. Never put business logic in React components

Do not implement:
- techno-economic formulas
- CAPEX logic
- aggregation logic
- domain-specific unit conversion logic
- comparison-path logic

inside:
- React components
- page files
- UI hooks used only for presentation
- export templates

Business logic belongs in dedicated calculation/domain modules.

### 2. Keep calculation logic in dedicated modules

Calculation logic should live under structures such as:
- `src/core/domain`
- `src/core/calculation`
- adjacent pure helper modules

Do not scatter calculation logic across unrelated folders.

### 3. Preserve one canonical calculation result

UI, Excel, and PDF must consume the same canonical calculation result structure.

Do not create:
- export-only business result structures with separate formulas
- UI-only hidden calculation branches
- duplicated “almost the same” calculation pipelines

### 4. Keep orchestration thin

Top-level orchestration functions such as `calculateScenario()` should stay readable and thin.

Move detailed logic into dedicated functions/modules:
- profile generation
- annualization
- daily calculations
- aggregation
- comparison logic

---

## Placeholder rules

### 1. Never invent missing customer formulas

Do not fabricate:
- conversion coefficients
- methane formulas
- hydrogen formulas
- electricity formulas
- revenue formulas
- customer-specific economics defaults
- pseudo-scientific fallback assumptions

If the real logic is missing, keep it missing explicitly.

### 2. Use explicit placeholder markers

When logic is intentionally incomplete, mark it clearly using patterns such as:
- `TODO(formula)`
- `TODO(customer-data)`
- `TODO(unit-decision)`
- `TODO(assumption-lock)`

Do not hide missing logic behind vague comments like:
- “temporary”
- “approximate”
- “standard formula”  
unless the actual logic is shown clearly.

### 3. Placeholder outputs must be non-misleading

If a value is not yet truly known:
- use an explicit placeholder-safe representation
- do not pretend it is validated business truth
- do not silently return misleading values unless the task explicitly defines placeholder behavior

### 4. Keep placeholders centralized

Do not spread placeholder logic across many files.

Place unresolved logic in the modules that will later own the real implementation.

---

## Validation and error-handling rules

### 1. Validate at boundaries

User-facing or external input must be validated at schema boundaries.

### 2. Prefer explicit failure over silent guessing

If a rule is not known, do not guess silently.

Fail clearly or leave an explicit extension point.

### 3. Monthly profile validation rules

Treat these as locked:
- exactly 12 monthly weights are required
- zero individual monthly weights are allowed
- all-zero monthly weights are invalid
- the default profile calendar is a fixed non-leap year with 365 days

### 4. Annualization validation rules

Treat these as locked:
- annualization must fail clearly for `lifetimeYears <= 0`
- zero discount rate fallback is allowed and explicit
- do not bury invalid annualization inputs behind defaults

### 5. Error messages

Use clear developer-readable errors.

Do not overengineer a large error abstraction unless the task specifically requires it.

---

## Units rules

### 1. Keep units explicit

Do not rely only on field names to express unit meaning.

### 2. Keep the unit system lightweight

Do not introduce a heavy measurement framework unless explicitly needed.

### 3. Preserve future flexibility

Write code so future unit expansion is possible, especially for methane and other business-facing outputs.

### 4. Document temporary unit assumptions

If you assume a temporary unit in implementation, document it near the code.

---

## CAPEX rules

### 1. CAPEX annualization must be modular

Do not hardcode CAPEX logic inline inside broad orchestration code.

### 2. Default strategy

Use:
- `annuity`

as the default annualization strategy unless instructed otherwise.

### 3. Zero discount fallback

Use:
- `annualizedCapex = capex / lifetimeYears`

when discount rate is zero.

### 4. Keep strategy extensible

Write annualization code so alternative strategies can be added later without rewriting orchestration.

---

## Change rules

### 1. Prefer minimal diffs

Make the smallest coherent change that solves the task.

### 2. Do not refactor unrelated code

Avoid opportunistic refactors outside the task scope unless necessary for correctness.

### 3. Do not casually rename shared contracts

Be careful with:
- `ScenarioInput`
- `DailyResult`
- `MonthlySummary`
- `ScenarioSummary`
- `CalculationResult`

Only change shared contracts when necessary, and update all dependents in the same change.

### 4. Preserve file structure when possible

Do not reorganize folders or move files around without a clear reason.

### 5. Finish dependent updates together

If you change a shared type or core function, also update:
- tests
- imports
- dependent helpers
- directly impacted modules

in the same task.

---

## Testing rules

### 1. Calculation changes require tests

If you change calculation/domain behavior, add or update tests unless the task explicitly says otherwise.

### 2. Test placeholder behavior honestly

Do not write tests that lock fake business correctness before real formulas exist.

### 3. Golden scenario discipline

Golden scenarios may initially assert:
- profile behavior
- annualization behavior
- aggregation behavior
- structural result integrity
- other agreed placeholder-safe behavior

When final formulas arrive:
- extend the golden scenarios
- do not replace the whole harness unless truly necessary

### 4. Prefer focused tests

Prefer direct, readable tests over:
- excessive snapshots
- overly abstract helpers
- broad fragile integration tests

---

## UI rules

### 1. UI consumes already-calculated data

UI should display validated input state and calculation results, not derive business results on its own.

### 2. No parallel math in UI

Do not repeat domain calculations in:
- cards
- chart adapters
- table renderers
- export buttons
- client-side formatting helpers

Minor presentation formatting is fine. Business logic is not.

### 3. Keep UI simple during placeholder stage

If calculation branches are unresolved, do not simulate fake polished business outputs in the UI layer.

---

## Export rules

### 1. Exports must use canonical results

Excel and PDF code must consume canonical calculation output.

### 2. No duplicated export math

Do not calculate business results separately inside export builders.

### 3. Formatting only in reporting/export layers

Reporting layers may format values and structure sections, but must not own core business formulas.

---

## Code quality rules

### 1. Prefer pure functions in core calculation

Use pure functions whenever practical.

### 2. Keep functions small and readable

Avoid large multipurpose functions when a few small focused functions would be clearer.

### 3. Avoid premature abstraction

Do not create elaborate frameworks or meta-systems for simple current needs.

### 4. Keep comments useful

Write comments only when they add real clarity:
- assumption notes
- placeholder explanation
- non-obvious rounding strategy
- extension point rationale

Do not comment obvious code excessively.

---

## Documentation rules

### 1. Keep implementation aligned with specs

Follow current project documentation and prompt instructions.

### 2. Make divergence explicit

If implementation intentionally differs from current documentation, say so clearly in:
- code comments
- task summary
- follow-up notes

### 3. Do not hide uncertainty

If something is unresolved, mark it explicitly.

---

## Expected repository direction

Default structure direction:

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

This structure may evolve, but the layered intent must remain intact.

---

## Agent behavior when information is missing

If the task depends on missing business information:
1. do not invent the missing logic
2. implement the safe structural portion
3. create an explicit extension point
4. document the gap clearly
5. keep future insertion of the missing logic easy

---

## Current project assumptions

Assume the following unless explicitly updated:
- working language is English
- MVP default language is English
- the annual period is fixed at 365 days
- monthly weighted profile is the default availability model
- methane default business unit is currently assumed to be kg, but architecture must remain unit-extensible
- hydrogen alternative logic will later depend on a separate hydrogen availability assumption
- CAPEX uses annuity as default strategy
- zero discount rate uses straight-line fallback
- final customer formulas are still pending
- placeholder-ready architecture is preferred over fake completeness

---

## Final operating rule

When multiple implementation options are possible, prefer the one that:
- preserves layered architecture
- keeps uncertainty explicit
- avoids invented business logic
- minimizes future refactoring
- protects the canonical calculation result
- keeps the codebase easier for the next agent to extend

