# Cursor Agent Prompt — Agent 3: Testing Skeleton & Golden Scenario Harness

Your task is to implement the testing foundation for the Hiiliketju project on top of the existing domain, schema, profile, annualization, aggregation, and calculation skeleton layers.

## Goal

Build a clean, maintainable testing foundation that supports:
1. unit tests for the current calculation building blocks
2. validation tests for schema behavior
3. regression-safe golden scenario harness for later formula locking
4. explicit placeholder-aware testing rules while final customer formulas are still unavailable

This work must be **formula-ready**, not formula-complete.

You are not validating final customer business outputs yet. Your task is to create the test structure that makes later formula insertion safe, predictable, and easy to extend.

---

## Context

The project is a browser-based techno-economic calculator.

By the time you do this task, the codebase should already contain:
- domain types
- Zod input schemas
- monthly weighted daily profile generator
- CAPEX annualization module
- aggregation functions
- top-level scenario calculation skeleton
- placeholder-ready daily calculation pipeline

Final customer formulas and final parameter values are **still not available**.

The architecture direction is already decided:
- Next.js + TypeScript
- calculation logic separated from UI
- one canonical result structure later used by UI, Excel, and PDF
- testing should protect architecture and future formula work from regressions
- placeholder behavior must be tested honestly, not disguised as final business correctness

The implementation should be practical, lightweight, and maintainable.

---

## Locked assumptions for this task

Use these assumptions as fixed for your implementation:

- project working language: **English**
- MVP default language: **English**
- annual profile period is always **365 days**
- monthly profile input uses exactly 12 weights
- zero individual monthly weights are allowed
- all-zero monthly weights are invalid
- CAPEX annualization default strategy is **annuity**
- zero discount rate fallback is:
  - `capex / lifetimeYears`
- final methane / hydrogen / electricity / comparison formulas are not yet available
- current calculation pipeline may legitimately contain placeholder zero-values or explicit non-final KPI behavior
- tests must reflect current implementation truthfully
- no UI testing in this task unless there are already tiny existing non-UI helper tests tightly coupled to schema behavior
- no browser/E2E framework setup in this task
- no snapshot-heavy testing unless clearly justified

---

## Main implementation objective

Create a testing structure that protects the current architecture and makes later formula integration safer.

At this stage, the tests should confirm:
1. schemas reject/accept the correct structural inputs
2. profile generation works correctly
3. annualization works correctly
4. aggregation works correctly
5. scenario orchestration produces structurally valid outputs
6. placeholder behavior is explicit and stable
7. golden scenario infrastructure exists, even if current golden values are placeholder-stage and limited in scope

---

## Deliverables

Implement the following:

### 1. Test setup and organization

Create a clean test structure aligned with the existing codebase.

Use the project’s current test tooling if it already exists. If test tooling is not yet present, add a practical minimal setup using the project’s most appropriate TypeScript-friendly choice.

Preferred direction if not already decided:
- Vitest for unit/integration-style logic tests
- no unnecessary complexity
- no browser-driven testing setup

Organize tests clearly by concern, for example:
- schema tests
- profile tests
- annualization tests
- aggregation tests
- calculation orchestration tests
- golden scenario harness

### 2. Schema validation tests

Create tests for the main scenario input schema behavior.

Validation coverage must include at least:
- valid minimal scenario input passes
- missing required scenario name fails
- invalid annual CO₂ input fails where appropriate
- exactly 12 monthly weights required
- all-zero monthly weights fail
- zero individual monthly weights pass
- invalid negative values fail where appropriate
- percentage range rules behave correctly where implemented
- structurally valid discount rate and lifetime fields are accepted
- invalid lifetime structure fails where schema currently rejects it

Important:
- align tests with the real schema implementation, not imagined rules
- if a rule is intentionally not in the schema yet, do not fabricate a failing test for it
- prefer clear test names over excessive abstraction

### 3. Daily profile generator tests

Create focused tests for the monthly weighted profile generator.

Coverage must include at least:
- returns exactly 365 daily rows
- preserves annual total within the documented rounding strategy
- flat profile distributes annual CO₂ across the full year correctly
- strongly seasonal profile behaves as expected
- single active month scenario behaves as expected
- zero values inside weights are handled correctly
- all-zero weights fail
- date labeling / month indexing is internally consistent
- month day counts match a fixed non-leap year calendar

Do not overfit tests to fragile floating-point exactness if the implementation uses reconciliation logic. Use sensible tolerances where needed.

### 4. CAPEX annualization tests

Create focused tests for the annualization module.

Coverage must include at least:
- standard annuity case
- zero discount rate fallback case
- invalid lifetime case
- consistent handling of discount rate input
- deterministic output for the same input
- error throwing or failure handling matches actual implementation

If the implementation supports only the default strategy now, test that honestly. Do not invent unsupported strategy cases.

### 5. Aggregation tests

Create tests for:
- monthly aggregation
- annual aggregation

Coverage must include at least:
- monthly grouping works correctly
- month ordering is preserved
- annual totals sum correctly from daily results
- allocated CAPEX totals aggregate correctly
- placeholder numeric fields aggregate consistently
- structurally complete annual summary is returned
- KPI placeholder behavior is handled consistently with implementation

If the current implementation returns explicit non-final KPI representations such as `null` for unresolved ratios, test that behavior directly.

### 6. Scenario calculation orchestration tests

Create tests for the top-level calculation flow.

Coverage must include at least:
- valid scenario input produces a structurally valid `CalculationResult`
- daily results length is 365
- monthly summary length matches 12 months
- annual summary exists
- annualized CAPEX is reflected in output structure
- available CO₂ and usable CO₂ behave consistently with current agreed logic
- placeholder fields remain explicit and non-misleading
- calculation is deterministic for identical input

Do not assert fake final methane/hydrogen/electricity correctness if those formulas are still placeholders.

### 7. Golden scenario harness

Create the initial golden scenario test harness so later agents can lock real formulas against stable reference scenarios.

Important:
- this harness is required now even though final formulas are not yet available
- current golden scenarios may only validate the currently agreed and implemented parts of the system

Implement:
- a small fixture structure for named scenarios
- a way to store expected outputs or expected partial outputs
- a test helper that compares actual result vs expected result
- support for numeric tolerance where appropriate
- support for partial assertions so current placeholder-stage scenarios remain useful

Recommended direction:
- allow assertions on selected paths such as:
  - annual total preserved
  - annualized CAPEX expected value
  - 365 daily rows exist
  - 12 monthly summaries exist
  - usable CO₂ matches utilization logic
- avoid pretending unresolved placeholder fields are final business truths

### 8. Golden scenario fixtures

Create at least 2 initial golden scenarios that are useful already at this stage.

These should be placeholder-safe scenarios such as:
- a flat annual profile with simple utilization and zero-discount CAPEX
- a seasonal profile with non-zero discount CAPEX annualization

The goal is not to prove final business correctness, but to lock:
- profile behavior
- annualization behavior
- orchestration stability
- aggregation stability

Document clearly in fixture comments that these are **pre-formula golden scenarios** and will later be expanded or tightened when final customer formulas arrive.

### 9. File/module structure

Implement the test code in a clean structure aligned with this direction:

```txt
src/
  core/
    calculation/
      __tests__/
        annualize-capex.test.ts
        aggregate-results.test.ts
        calculate-scenario.test.ts
        build-daily-profile.test.ts
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
```

You may adjust the exact structure slightly if needed to match the existing project conventions, but keep it logically equivalent and clean.

---

## Functional requirements

### Test style

Use:
- clear test names
- focused test scopes
- low ceremony
- minimal mocking unless truly necessary

Prefer real function calls over artificial mocking for pure logic modules.

### Golden scenario comparison

Your golden scenario helper should support:
- exact structural assertions where safe
- tolerance-based numeric assertions where appropriate
- partial expected results
- readable failure output

Do not build an overcomplicated custom test framework. Keep it practical.

### Placeholder-aware testing policy

The tests must distinguish between:
- behavior that is already agreed and should be locked now
- behavior that is still placeholder-stage and should only be checked structurally or partially

Examples of behavior to lock now:
- 12 weights required
- all-zero weights rejected
- 365-day profile returned
- CAPEX annualization fallback for zero rate
- monthly and annual aggregation shape and stability

Examples of behavior not to fake-lock now:
- final methane production values
- final hydrogen demand values
- final electricity consumption values
- final comparison economics

---

## Non-functional requirements

### Code quality
- readable tests
- maintainable helper structure
- no duplicated large fixtures unless justified
- no brittle assertions tied to irrelevant implementation details

### Maintainability
- later formula agents should be able to add real expected outputs without rewriting the harness
- fixture structure should be easy to expand
- tests should help debugging rather than obscure failures

### Performance
- unit tests should remain fast
- no heavyweight setup
- no unnecessary integration complexity

---

## Important constraints

Do **not** do these:
- do not invent final customer formulas
- do not create misleading fake expected methane/hydrogen/electricity outputs
- do not add browser/E2E testing frameworks unless already present and clearly necessary
- do not add React component tests in this task
- do not rely heavily on snapshots
- do not hardcode customer-specific constants beyond neutral placeholder-safe fixtures
- do not make tests pass by weakening meaningful assertions excessively

---

## Expected implementation choices

Use sensible assumptions for unresolved details, but keep them explicit.

Recommended choices:
- Vitest if test tooling is not yet established
- small helper utilities for tolerance comparison
- partial golden assertions rather than full fake-output locking
- direct testing of current placeholder KPI behavior
- deterministic fixtures with readable numbers

---

## Output format

When you finish, provide:

1. a short summary of what you implemented
2. the created/modified file list
3. any assumptions you made
4. any open issues or recommendations for the next formula-oriented agent

---

## Definition of done

This task is done when:
- core schema tests exist
- profile generator tests exist
- CAPEX annualization tests exist
- aggregation tests exist
- scenario orchestration tests exist
- a reusable golden scenario harness exists
- at least 2 useful pre-formula golden scenarios exist
- tests reflect current placeholder-stage truth honestly
- the test structure is ready for later real-formula locking without major rewrites