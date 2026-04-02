# Cursor Agent Prompt — Agent 1: Domain & Schemas

Your task is to build the domain foundation for the Hiiliketju project as the first technical implementation layer.

## Goal

Create a strong, extensible, formula-ready domain layer for the calculator without hardcoding final customer formulas yet.

Your focus areas are:
1. TypeScript domain types
2. Zod validation schemas
3. a minimal but extensible unit-model foundation
4. availability profile input structure
5. monthly weighted profile generator
6. clean module boundaries that support later formula implementation

Do **not** implement the actual methane, hydrogen, electricity, revenue, or comparison formulas yet beyond clearly marked placeholders and extension points.

---

## Context

This is a browser-based techno-economic calculator where:
- the user enters an annual CO₂ amount
- the user defines 12 monthly weights
- the system generates a 365-day daily availability profile
- later agents will implement CAPEX annualization, aggregation, full calculation logic, tests, UI, and exports

The architecture direction is already decided:
- Next.js + TypeScript
- calculation logic must be separated from UI
- one canonical calculation result structure must later serve UI, Excel, and PDF
- final customer formulas and parameter values are **not yet available**
- placeholders must be easy to replace later without refactoring core architecture

The implementation should be production-oriented, minimal, and maintainable. Avoid overengineering, but design for extension.

---

## Locked assumptions for this task

Use these assumptions as fixed for your implementation:

- project working language: **English**
- MVP default language: **English**
- the solution must be **formula-ready**, not formula-complete
- methane default business unit is currently assumed to be **kg**, but the architecture must support other units later
- hydrogen alternative path will later use a **separate hydrogen availability assumption**, so do not bind hydrogen-alternative logic to methane-path hydrogen demand
- monthly weights may contain zeros
- all-zero monthly weights must be treated as a validation error
- the annual profile period is always **365 days**
- no persistence or database logic
- no UI business logic
- no export logic in this task

---

## Deliverables

Implement the following:

### 1. Domain types

Create clean TypeScript types for at least:

- `AvailabilityProfileInput`
- `ScenarioInput`
- `DailyProfilePoint`
- `DailyResult`
- `ScenarioSummary`
- `CalculationResult`
- minimal unit-related types that make future unit expansion possible

Design principle:
- units should not be hidden only in field names
- use a lightweight model that allows later extension
- do not build a huge unit system

Suggested direction:
- use explicit unit enums or string literal unions where useful
- keep types readable and practical

### 2. Validation schemas

Create Zod schemas for the main input structures.

Validation must cover at least:
- required fields
- numeric type checks
- non-negative values where appropriate
- percentage range validation where appropriate
- exactly 12 monthly weights
- all-zero monthly weights rejected
- scenario name required
- annual CO₂ amount must be valid
- electricity price must be valid
- CAPEX fields must be valid
- discount rate and lifetime fields must be structurally valid even though formulas are not yet implemented

Important:
- validation messages should be developer-friendly and reasonably clear
- do not overcomplicate error abstraction at this stage

### 3. Monthly weighted profile generator

Implement a pure function that converts:
- annual CO₂ amount
- 12 monthly weights

into:
- a 365-row daily profile

The logic must:
1. validate input assumptions
2. normalize the 12 weights
3. allocate annual CO₂ across months using normalized weights
4. allocate each month’s CO₂ across the days in that month
5. return a daily series for a fixed non-leap year calendar
6. preserve the annual total within a clearly documented rounding strategy

Requirements:
- pure deterministic function
- no UI concerns
- no side effects
- clearly documented handling of rounding
- code must be easy to test

You may choose whether internal precision handling is done via:
- full floating-point distribution with final sum reconciliation, or
- another clean approach

But document the choice in comments.

### 4. Placeholder-ready calculation model scaffolding

Create minimal structures that make later work easy:
- a placeholder shape for process assumptions
- a placeholder shape for economics assumptions
- result types that later agents can extend without breaking existing contracts

Do **not** fake real formulas.
Do **not** invent customer-specific constants unless needed as neutral placeholders.
If a value is unknown, represent it clearly as a future input/parameter concern.

### 5. File/module structure

Implement the code in a clean structure aligned with this direction:

```txt
src/
  core/
    domain/
      scenario.ts
      result.ts
      units.ts
      profile.ts
    calculation/
      build-daily-profile.ts
  features/
    scenario/
      schemas/
        scenario-schema.ts
```

You may adjust filenames slightly if needed, but keep the structure logically equivalent and clean.

---

## Functional requirements

### Availability profile

Implement support for:

```ts
type AvailabilityProfileInput = {
  mode: "monthly_weighted"
  monthlyWeights: [
    number, number, number, number, number, number,
    number, number, number, number, number, number
  ]
}
```

Use a fixed non-leap-year month/day distribution.

### Scenario input

The scenario input should support at least these logical groups:

- scenario metadata
- CO₂ input
- energy input
- economics input
- process placeholder parameters
- assumptions metadata

Keep the types clean and future-proof, but do not add speculative complexity.

### Daily profile output

At minimum, each daily profile point should include:
- `dayIndex`
- `dateLabel`
- `monthIndex`
- `dayOfMonth`
- `availableCO2`
- explicit or inferable unit metadata where appropriate

---

## Non-functional requirements

### Code quality
- strict TypeScript style
- readable naming
- small pure functions where useful
- no duplicated logic
- avoid premature abstraction

### Architecture
- no calculation logic inside schemas
- no UI dependencies in core calculation logic
- domain types should remain reusable across UI, tests, and exports

### Maintainability
- leave clear extension points for later formula implementation
- avoid tight coupling between profile logic and future process logic

---

## Important constraints

Do **not** do these:
- do not implement methane production formulas
- do not implement hydrogen demand formulas
- do not implement electricity consumption formulas
- do not implement comparison formulas
- do not implement CAPEX annualization yet
- do not create React components
- do not add charts
- do not add Excel/PDF code
- do not add database or API logic

---

## Expected implementation choices

Use sensible assumptions for unresolved details, but keep them lightweight and explicit.

Recommended choices:
- fixed calendar for a non-leap year
- all-zero monthly weights => validation error
- zero values inside the 12 monthly weights => allowed
- daily allocation should preserve annual total as closely as possible
- internal profile values can remain numeric without introducing a heavy quantity class

---

## Output format

When you finish, provide:

1. a short summary of what you implemented
2. the created/modified file list
3. any assumptions you made
4. any open issues or recommendations for Agent 2

---

## Definition of done

This task is done when:
- domain types exist and are coherent
- zod schemas validate the scenario input structure
- the monthly weighted profile generator works for a 365-day year
- all-zero weights are rejected
- zero individual monthly weights are accepted
- the annual total is preserved with a documented strategy
- the structure clearly supports later calculation-engine work without refactoring