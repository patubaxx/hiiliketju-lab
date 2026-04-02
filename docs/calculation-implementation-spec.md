# Calculation Implementation Spec
**Project:** Hiiliketju – browser-based techno-economic calculator  
**Version:** 0.1-template  
**Status:** Draft / to be completed with customer formulas  
**Related docs:** `docs/solution-spec-v1.md`

---

## 1. Purpose

This document translates the customer-provided formulas, assumptions, and process parameters into an implementation-ready specification.

It serves as:
- the source of truth for the calculation engine
- the reference for testing
- the source of truth for parameters and units
- the basis for UI, Excel, and PDF output logic

Rules:
- no implicit assumptions
- unknown values must be marked explicitly as `TODO`
- placeholder values must be distinguishable from real values
- all units must be explicit

---

## 2. Model status

### 2.1 Maturity
- [ ] Draft
- [ ] Partially filled
- [ ] Ready for implementation
- [ ] Validated with customer
- [ ] Production use

### 2.2 Scope of this version
- [ ] Methane path
- [ ] Hydrogen sales alternative
- [ ] Daily calculation over 365 days
- [ ] Annuitized CAPEX
- [ ] Unit cost

---

## 3. Calculation overview

### 3.1 Goal
Describe what the model calculates.

**Template**  
This model calculates daily and annual estimates for methane production, hydrogen demand, electricity consumption, operating costs, annualized CAPEX, unit cost, and comparison against selling hydrogen as-is.

### 3.2 Main paths
- Path A: CO₂ + H₂ → methane
- Path B: hydrogen sold as-is

### 3.3 Primary KPIs
- Unit cost
- Annual methane production
- Annual hydrogen demand
- Annual electricity consumption
- Annual OPEX
- Annualized CAPEX
- Delta vs hydrogen sales alternative

---

## 4. Input registry

### 4.1 User inputs

| Key | Label | Description | Unit | Type | Required | Default | Status | Source | Notes |
|---|---|---|---|---|---|---|---|---|---|
| scenarioName | Scenario name | Name of the scenario | - | string | yes | - | locked | product | |
| annualCO2 | Annual CO₂ amount | Annual available CO₂ | t/year | number | yes | - | locked | user | |
| utilizationRatePct | Utilization rate | Share of CO₂ utilized | % | number | yes | - | locked | user | 0–100 |
| electricityPriceEurPerMWh | Electricity price | Constant electricity price in MVP | €/MWh | number | yes | - | locked | user | |
| methanePrice | Methane price/value | Methane price input | TODO | number | TODO | TODO | customer-provided | formula package | |
| hydrogenPriceEurPerKg | Hydrogen price/value | Hydrogen sales value | €/kg | number | yes | TODO | customer-provided | formula package | |
| otherOpexEurPerYear | Other annual OPEX | Non-electricity annual operating cost | €/year | number | no | 0 | locked | product | |
| capexEur | CAPEX | Investment amount | € | number | yes | - | locked | user | |
| capexLifetimeYears | CAPEX lifetime | Lifetime used in annualization | years | number | yes | TODO | locked/customer-provided | product/formula | |
| discountRatePct | Discount rate | Discount rate for annuity | % | number | yes | TODO | locked/customer-provided | formula package | |
| monthlyWeights | Monthly weights | 12-month availability profile weights | relative | number[12] | yes | [1,1,1,1,1,1,1,1,1,1,1,1] | locked | product | normalized |

### 4.2 Process assumptions

| Key | Label | Description | Unit | Value | Status | Source | Notes |
|---|---|---|---|---|---|---|---|
| methaneYieldFactor | Methane yield factor | Methane output factor | TODO | TODO | customer-provided | formula package | |
| hydrogenDemandFactor | Hydrogen demand factor | H₂ demand factor | TODO | TODO | customer-provided | formula package | |
| electricityConsumptionFactor | Electricity consumption factor | Electricity demand factor | TODO | TODO | customer-provided | formula package | |
| plantAvailabilityPct | Plant availability | Technical availability | % | TODO | customer-provided | formula package | |
| processEfficiencyPct | Process efficiency | Process efficiency | % | TODO | customer-provided | formula package | |

### 4.3 System constants

| Key | Value | Unit | Status | Rationale |
|---|---|---|---|---|
| periodDays | 365 | days | locked | MVP decision |
| capexAnnualizationMethod | annuity | - | locked | MVP decision |
| profileMode | monthly_weighted | - | locked | MVP decision |

---

## 5. Output registry

### 5.1 Daily outputs

| Key | Description | Unit | Derived | Notes |
|---|---|---|---|---|
| dayIndex | Day index | - | yes | 0..364 |
| dateLabel | Calendar label | YYYY-MM-DD | yes | fixed non-leap year |
| availableCO2 | Available CO₂ for day | TODO | yes | |
| usableCO2 | Utilized CO₂ for day | TODO | yes | |
| hydrogenNeeded | H₂ needed for day | TODO | yes | |
| methaneProduced | Methane produced for day | TODO | yes | |
| electricityConsumed | Electricity consumed for day | TODO | yes | |
| variableCost | Variable cost for day | € | yes | |
| allocatedCapexCost | Allocated CAPEX cost for day | € | yes | annualized CAPEX / 365 |
| totalCost | Total cost for day | € | yes | |
| methaneRevenue | Methane revenue for day | € | yes | |
| hydrogenAlternativeRevenue | Hydrogen sales alternative revenue for day | € | yes | |

### 5.2 Annual outputs

| Key | Description | Unit |
|---|---|---|
| annualMethaneProduced | Annual methane production | TODO |
| annualHydrogenNeeded | Annual hydrogen demand | TODO |
| annualElectricityConsumed | Annual electricity consumption | MWh |
| annualVariableCost | Annual variable cost | € |
| annualCapexCost | Annualized CAPEX | € |
| annualTotalCost | Annual total cost | € |
| methaneRevenue | Annual methane revenue | € |
| hydrogenSalesAlternativeRevenue | Annual hydrogen sales revenue | € |
| unitCostMethane | Unit cost of methane path | TODO |
| deltaVsHydrogenSale | Delta vs hydrogen sales | € |

---

## 6. Units and conversions

| From | To | Conversion | Notes |
|---|---|---|---|
| t | kg | 1 t = 1000 kg | |
| MWh | kWh | 1 MWh = 1000 kWh | |
| % | decimal | x / 100 | |

### 6.1 Internal calculation unit principles
- internal calculation should use consistent units
- UI may show more user-friendly units
- exports should match UI units unless analysis needs otherwise

### 6.2 Internal calculation units
Fill and lock these before final implementation.

**Suggested internal units**
- CO₂: kg/day
- H₂: kg/day
- methane: kg/day or MWh/day
- electricity: MWh/day
- cost: €/day

---

## 7. Availability profile specification

### 7.1 Goal
Convert annual CO₂ amount into a daily time series using monthly weighted profile logic.

### 7.2 Inputs
- annual CO₂ amount
- 12 monthly weights

### 7.3 Steps
1. Read 12 monthly weights.
2. Validate values.
3. Sum weights.
4. Normalize weights.
5. Distribute annual CO₂ to months using normalized weights.
6. Distribute monthly CO₂ to days by calendar day count.
7. Return 365 daily values.

### 7.4 Open decisions
- Are all-zero weights allowed --> validation error
- Are negative weights allowed? --> validation error
- How are rounding differences handled?
- Is a fixed non-leap year assumed?

### 7.5 Pseudocode

    weights = normalize(monthlyWeights)
    monthlyCO2 = distributeAnnualCO2(annualCO2, weights)
    dailyCO2 = distributeMonthlyCO2ToDays(monthlyCO2, calendar365)
    return dailyCO2

### 7.6 Tests
- flat profile
- seasonal profile
- single active month
- rounding preservation of annual total

---

## 8. CAPEX annualization

### 8.1 Goal
Convert CAPEX into annualized cost using annuity logic.

### 8.2 Inputs
- capex
- lifetime
- discount rate

### 8.3 Formula

    annualizedCapex = TODO

### 8.4 Edge cases
- discountRate = 0
- lifetime <= 0
- rounding policy

### 8.5 Tests
- normal annuity case
- zero-interest case
- invalid input case

---

## 9. Step-by-step calculation flow

### 9.1 Step 1 — validate input
- required fields
- numeric ranges
- percentage ranges
- profile weights

### 9.2 Step 2 — build daily profile
- annual → monthly → daily

### 9.3 Step 3 — calculate daily process flows

    usableCO2_day = availableCO2_day * utilizationRate
    hydrogenNeeded_day = TODO
    methaneProduced_day = TODO
    electricityConsumed_day = TODO

### 9.4 Step 4 — calculate daily costs

    electricityCost_day = electricityConsumed_day * electricityPrice
    variableCost_day = electricityCost_day + otherVariableCosts_day + TODO
    allocatedCapexCost_day = annualizedCapex / 365
    totalCost_day = variableCost_day + allocatedCapexCost_day

### 9.5 Step 5 — calculate revenues

    methaneRevenue_day = methaneProduced_day * methanePrice
    hydrogenAlternativeRevenue_day = hydrogenNeeded_day * hydrogenPrice

### 9.6 Step 6 — aggregate
- monthly aggregates
- annual aggregates

### 9.7 Step 7 — calculate KPIs

    unitCostMethane = annualTotalCost / annualMethaneProduced
    deltaVsHydrogenSale = methaneRevenue - hydrogenSalesAlternativeRevenue

---

## 10. Formula library

| ID | Name | Description | Formula | Units | Status | Source |
|---|---|---|---|---|---|---|
| F-001 | usable CO₂ | Daily utilized CO₂ | `usableCO2 = availableCO2 * utilizationRate` | TODO | locked | product |
| F-002 | hydrogen needed | Daily H₂ demand | `TODO` | TODO | customer-provided | formula package |
| F-003 | methane produced | Daily methane production | `TODO` | TODO | customer-provided | formula package |
| F-004 | electricity consumed | Daily electricity use | `TODO` | TODO | customer-provided | formula package |
| F-005 | annualized CAPEX | Annual CAPEX cost | `TODO` | € | locked/customer-provided | formula package |
| F-006 | unit cost | Unit cost | `annualTotalCost / annualMethaneProduced` | TODO | locked | product |
| F-007 | hydrogen alternative revenue | H₂ sales alternative revenue | `TODO` | € | customer-provided | formula package |

### 10.1 Dependency notes
- F-002 depends on F-001
- F-003 depends on F-001 and F-002
- F-004 depends on F-003
- F-006 depends on annual aggregation

---

## 11. Parameter registry

| Key | Label | Description | Unit | Value | Status | Source | Version | Owner |
|---|---|---|---|---|---|---|---|---|
| process.methaneYieldFactor | Methane yield factor | TODO | TODO | TODO | customer-provided | formula package | v1 | customer |
| process.hydrogenDemandFactor | Hydrogen demand factor | TODO | TODO | TODO | customer-provided | formula package | v1 | customer |
| process.electricityConsumptionFactor | Electricity factor | TODO | TODO | TODO | customer-provided | formula package | v1 | customer |
| economics.discountRatePct | Discount rate | TODO | % | TODO | customer-provided | formula package | v1 | customer |
| economics.capexLifetimeYears | CAPEX lifetime | TODO | years | TODO | customer-provided | formula package | v1 | customer |

---

## 12. Versioning

### 12.1 Assumptions version format
Example:  
`HIILIKETJU_ASSUMPTIONS_v1_2026-04`

### 12.2 Change log

| Version | Date | Change | Author | Approved by |
|---|---|---|---|---|
| v0.1 | TODO | template created | TODO | - |
| v1.0 | TODO | initial formulas loaded | TODO | TODO |

---

## 13. Edge cases and validation rules

| Case | Expected handling |
|---|---|
| annualCO2 = 0 | allow or block? |
| utilizationRate = 0 | output zero production |
| annualMethaneProduced = 0 | prevent invalid unit-cost division |
| negative input | validation error |
| all monthly weights = 0 | validation error or fallback |
| capexLifetimeYears <= 0 | validation error |
| discountRate < 0 | validation error |

---

## 14. Golden scenario template

**Case ID:** GS-001  
**Name:** TODO  
**Description:** TODO

### Inputs
- annualCO2:
- utilizationRatePct:
- electricityPriceEurPerMWh:
- hydrogenPriceEurPerKg:
- methanePrice:
- capexEur:
- capexLifetimeYears:
- discountRatePct:
- monthlyWeights:

### Assumptions
- methaneYieldFactor:
- hydrogenDemandFactor:
- electricityConsumptionFactor:
- other assumptions:

### Expected outputs
- annualMethaneProduced:
- annualHydrogenNeeded:
- annualElectricityConsumed:
- annualCapexCost:
- annualTotalCost:
- unitCostMethane:
- hydrogenSalesAlternativeRevenue:
- deltaVsHydrogenSale:

### Tolerance
- e.g. ±0.1%
- or absolute tolerance per metric

---

## 15. Mock data rules

### Allowed use
- UI development
- export structure development
- technical demo
- development tests

### Forbidden use
- customer-facing real analysis
- golden reference tests
- final reporting

### Mock parameter set

| Key | Value | Status | Notes |
|---|---|---|---|
| methaneYieldFactor | TODO | placeholder | development only |
| hydrogenDemandFactor | TODO | placeholder | development only |
| electricityConsumptionFactor | TODO | placeholder | development only |

---

## 16. Mapping to implementation

| Spec concept | TypeScript structure |
|---|---|
| user inputs | `ScenarioInput` |
| daily outputs | `DailyResult` |
| annual outputs | `ScenarioSummary` |
| full result | `CalculationResult` |
| parameter registry | `assumptions.ts` or JSON config |

### 16.1 Code module mapping
- profile model → `build-daily-profile.ts`
- CAPEX annualization → `annualize-capex.ts`
- main orchestrator → `calculate-scenario.ts`
- aggregation → `aggregate-results.ts`

---

## 17. Readiness checklist

### 17.1 Minimum for calculation engine work
- [ ] all user inputs named
- [ ] all units decided
- [ ] profile logic locked
- [ ] annuitized CAPEX formula locked
- [ ] methane formula filled
- [ ] hydrogen formula filled
- [ ] electricity formula filled
- [ ] hydrogen alternative formula filled
- [ ] 1–2 golden scenarios defined

### 17.2 Minimum for UI work
- [ ] input registry ready
- [ ] output registry ready
- [ ] placeholder/mock set ready

### 17.3 Minimum for export work
- [ ] annual outputs named
- [ ] daily outputs named
- [ ] report section structure decided

---

## 18. Recommended fill order

1. input registry  
2. output registry  
3. units  
4. profile model  
5. CAPEX formula  
6. daily process formulas  
7. alternative-path formulas  
8. parameter registry  
9. edge cases  
10. golden scenarios