# Calculation Implementation Specification v2
**Project:** Hiiliketju – techno-economic calculation engine  
**Version:** 2.0  
**Status:** implementation-ready baseline with flagged literature defaults

**Related:** [`docs/index.md`](index.md) · [`repository-invariants.md`](repository-invariants.md) (export + checklist) · [`AGENTS.md`](../AGENTS.md)

---

## 1. Purpose

This document defines the implementation-ready structure for the calculation engine, including:
- input registry
- output registry
- unit policy
- temporal harmonization
- formula library
- assumptions metadata
- validation rules
- test-readiness requirements

This document is the single source of truth for:
- calculation logic
- calculation-related units
- assumption flags
- result structure used by UI and exports

---

## 2. Assumption Flag Policy

Every assumption parameter must include at least:

- `assumptionSource`
- `assumptionStatus`
- `assumptionNote`

### Allowed values

#### assumptionSource
- `customer_provided`
- `product_locked`
- `literature_based`
- `placeholder`
- `derived`

#### assumptionStatus
- `confirmed`
- `estimated`
- `pending_customer_confirmation`
- `placeholder_only`

### Mandatory rule
All stoichiometric ratios, SEC defaults, and any literature-estimated process values must be marked as:

- `assumptionSource = "literature_based"`
- `assumptionStatus = "estimated"`  
  or `pending_customer_confirmation` if explicitly awaiting customer review

Example note:
`"Literature-based MVP default; replace with customer/project-specific value if available."`

---

## 3. Calculation Boundary

### Included
- temporal CO₂ resolution
- temporal electricity price resolution
- stoichiometric methane pathway
- hydrogen alternative revenue comparison
- optional plant capacity caps (`kg H₂/day`, `kg CH₄/day`) and CO₂ source split
- optional market CO₂ purchase cost
- optional simple CAPEX allocation
- annual KPI generation

### Excluded
- native hourly engine internals
- dispatch optimization
- storage logic
- NPV / IRR / payback
- process simulation beyond stoichiometric + modifier layer

---

## 4. System Constants

| Parameter | Value | Unit | Source | Status | Note |
|---|---:|---|---|---|---|
| internalCalculationResolution | daily | - | product_locked | confirmed | MVP engine |
| periodDays | 365 | day | product_locked | confirmed | non-leap-year MVP |
| hourlyToDailyCo2Aggregation | sum | - | product_locked | confirmed | mass flow aggregation |
| hourlyToDailyElectricityAggregation | arithmetic_mean | - | product_locked | confirmed | no dispatch model in MVP |
| capexAllocationMethod | simple_lifetime_allocation | - | product_locked | confirmed | MVP CAPEX |

---

## 5. Unit Policy

### User-facing default units
- CO₂: `kt/year`
- H₂: `kg`
- CH₄: `t/year`
- methane price: `EUR/t_CH4`
- electricity: `MWh`
- electricity price: `EUR/MWh`

### UI display vs canonical wire (scenario form)

- **Annual CO₂** is fixed to **`kt/year`** in the visible scenario form (no unit selector). Internal domain helpers for `kg/year` conversion remain in code but are not exposed in the UI. **Constant electricity purchase price** display units (`c/kWh` ↔ `EUR/MWh`) are user-selectable and converted in **`buildScenarioPayload`** so the validated **`ScenarioInput`** matches this spec. **Time-series** bulk entry does not add alternate display units in MVP.
- **Browser CSV import** for CO₂ and electricity time-series produces the same bulk **`seriesText`** (and downstream parsing) as manual paste; it does **not** introduce new `co2AvailabilityMode` / `electricityPriceMode` values or parallel ingest contracts.
- **Default electricity data unit pipeline (`historical_market_data_imported`):** raw source `sources/electricity_prices.csv` is in `snt/kWh` (Finnish euro-cents per kWh, VAT included). The deterministic transform script `scripts/generate-electricity-defaults-2025-fi.mjs` applies the conversion **`snt/kWh × 10 = EUR/MWh`** (exact: 1 snt/kWh = 0.01 EUR/kWh = 10 EUR/MWh) and writes the checked-in artifact `src/data/electricity-defaults-2025-fi.ts`. The app consumes the artifact directly — no runtime CSV parsing. Daily defaults are the **arithmetic mean of 24 hourly values** (or 23/25 on DST transition days).

### Internal canonical units
- CO₂ timestep value: `kg/day`
- H₂ timestep value: `kg/day`
- CH₄ timestep value: `kg/day`
- electricity timestep value: `MWh/day`
- money timestep value: `EUR/day`

### Conversions
- `1 kt = 1,000,000 kg`
- `1 t = 1,000 kg`
- `1 MWh = 1,000 kWh`
- `% -> decimal = x / 100`

---

## 6. Input Registry

### 6.1 Scenario-level inputs

| Parameter | Description | Unit | Required | Source |
|---|---|---|---|---|
| scenarioName | Scenario label | - | yes | user |
| annualCO2KtPerYear | Annual CO₂ amount | kt/year | yes | user |
| utilizationRatePct | CO₂ utilization rate | % | yes | user |
| methanePriceEurPerTch4 | Methane sales price | EUR/t_CH4 | yes | user/customer |
| hydrogenPriceEurPerKg | Hydrogen sales price | EUR/kg_H2 | yes | user/customer |
| otherOpexEurPerYear | Other annual OPEX | EUR/year | no | user |
| includeCapex | Whether CAPEX is included | boolean | yes | user |
| electrolyzerCapexEur | Electrolyzer CAPEX | EUR | conditional | user |
| methanationCapexEur | Methanation CAPEX | EUR | conditional | user |
| capexLifetimeYears | CAPEX lifetime | years | conditional | user/customer |
| plant.electrolyzerMaxH2KgPerDay | Electrolyzer daily H₂ capacity cap; `null` / missing = unbounded | kg_H2/day | no | user/customer |
| plant.methanationMaxCh4KgPerDay | Methanation daily CH₄ capacity cap; `null` / missing = unbounded | kg_CH4/day | no | user/customer |
| co2.marketPurchase.mode | Market CO₂ purchase mode | `disabled` / `enabled` | no | user/customer |
| co2.marketPurchase.purchasePriceEurPerTco2 | Market CO₂ purchase price; required when market purchase is enabled | EUR/t_CO2 | conditional | user/customer |

Parameters in this table describe the **validated wire** `ScenarioInput`. UI-only display alternatives for **annual CO₂** and **constant electricity purchase price** are normalized to these units before validation.

WP28 plant capacity values are daily throughput caps only. They do not introduce dispatch optimization, storage dynamics, equipment sizing economics, or CAPEX calculations. CAPEX remains the separate user-provided cost input above.

### 6.2 CO₂ temporal input contract

`co2AvailabilityMode` must be one of:
- `flat_annual`
- `seasonal_daily`
- `time_series_daily`
- `time_series_hourly`

### 6.3 Electricity temporal input contract

Timestep electricity prices are **purchase** prices in **EUR/MWh** after harmonization to daily engine resolution.

`electricityPriceMode` must be one of:
- `constant`
- `daily_series`
- `hourly_series`
- `historical_market_data_imported`

The visible scenario UI offers only `constant` and `historical_market_data_imported`. `daily_series` and `hourly_series` remain retained internal wire / schema / engine / export capabilities.

### 6.4 Calculation settings

| Parameter | Description | Allowed values |
|---|---|---|
| requestedTimeResolution | requested input-level resolution | `daily` or `hourly` |
| internalCalculationResolution | engine resolution | always `daily` in MVP |
| assumptionsVersion | assumptions metadata version | string |

---

## 7. Assumption Registry

### 7.1 Locked literature-based defaults

| Parameter | Value | Unit | assumptionSource | assumptionStatus | assumptionNote |
|---|---:|---|---|---|---|
| stoichiometricHydrogenDemandFactor | 0.1832 | kg_H2/kg_CO2 | literature_based | estimated | Stoichiometric methane pathway default for MVP |
| stoichiometricMethaneYieldFactor | 0.3645 | kg_CH4/kg_CO2 | literature_based | estimated | Stoichiometric methane pathway default for MVP |
| electrolyzerSpecificEnergyConsumption | 54 | kWh/kg_H2 | literature_based | estimated | Literature-based SEC default for MVP |
| electrolyzerSpecificEnergyConsumptionMWh | 0.054 | MWh/kg_H2 | derived | confirmed | Derived from 54 kWh/kg_H2 |
| plantAvailabilityPct | 100 | % | literature_based | estimated | Neutral MVP default until customer-specific value exists |
| processEfficiencyPct | 100 | % | literature_based | estimated | Neutral MVP default until customer-specific value exists |

In the **visible** Advanced process section, **stoichiometric factors and SEC** (and derived MWh where shown) appear as active, overridable values with metadata. **`plantAvailabilityPct`** and **`processEfficiencyPct`** remain in merge defaults and on the wire for **future** engine use but are **not** user-facing active inputs in the current product and are **not** listed in “assumptions used” readouts (WP23+). Payload mapping keeps untouched fields omitted so `mergeProcessAssumptionsInput` remains the canonical default source.

**UI default for new scenarios (not a formula change):** **`co2AvailabilityMode`** initializes to **`seasonal_daily`** with a **winter-weighted** default monthly relative profile (implementation: `DEFAULT_SEASONAL_CO2_RELATIVE_WEIGHTS`); the engine’s seasonal path normalizes weights to the annual mass.

### 7.2 Inputs that remain customer/business inputs

| Parameter | Unit | assumptionSource | assumptionStatus |
|---|---|---|---|
| methanePriceEurPerTch4 | EUR/t_CH4 | customer_provided | confirmed or pending_customer_confirmation |
| hydrogenPriceEurPerKg | EUR/kg_H2 | customer_provided | confirmed or pending_customer_confirmation |
| otherOpexEurPerYear | EUR/year | customer_provided | confirmed or pending_customer_confirmation |
| electrolyzerCapexEur | EUR | customer_provided | confirmed or pending_customer_confirmation |
| methanationCapexEur | EUR | customer_provided | confirmed or pending_customer_confirmation |
| capexLifetimeYears | year | customer_provided | confirmed or pending_customer_confirmation |

Current setup UI defaults for these editable commercial inputs are `1200 EUR/t_CH4` for methane and `4 EUR/kg_H2` for hydrogen. They are scenario defaults, not product-locked calculation assumptions.

---

## 8. Output Registry

### 8.1 Daily outputs

| Parameter | Unit | Description |
|---|---|---|
| dateLabel | ISO date string | Daily label |
| availableCO2Kg | kg/day | CO₂ available for that day |
| usableCO2Kg | kg/day | Total process CO₂ feed (`freeCo2UsedKg + purchasedCo2Kg`) |
| freeCo2UsedKg | kg/day | Side-stream / free CO₂ used in the process |
| purchasedCo2Kg | kg/day | Market CO₂ purchased to fill finite plant capacity |
| co2PurchaseCostEur | EUR/day | Purchased CO₂ cost |
| h2CapacityBinding | boolean | Operating point is at the finite electrolyzer-derived cap (within tolerance) |
| ch4CapacityBinding | boolean | Operating point is at the finite methanation-derived cap (within tolerance) |
| hydrogenNeededKg | kg/day | H₂ required for methane path |
| methaneProducedKg | kg/day | CH₄ produced |
| electricityConsumedMWh | MWh/day | Electricity consumed |
| electricityCostEur | EUR/day | Electricity cost |
| variableCostEur | EUR/day | Total variable cost |
| allocatedCapexCostEur | EUR/day | Daily CAPEX allocation |
| totalCostEur | EUR/day | Total daily cost |
| methaneRevenueEur | EUR/day | Methane sales revenue |
| hydrogenAlternativeRevenueEur | EUR/day | Alternative hydrogen sales revenue |

### 8.2 Annual outputs

| Parameter | Unit | Description |
|---|---|---|
| annualCO2AvailableKg | kg/year | Annual CO₂ available |
| annualCO2UtilizedKg | kg/year | Annual total process CO₂ feed; may exceed available side-stream CO₂ when market CO₂ is purchased |
| annualFreeCo2UsedKg | kg/year | Annual side-stream / free CO₂ used |
| annualPurchasedCo2Kg | kg/year | Annual purchased CO₂ |
| annualCo2PurchaseCostEur | EUR/year | Annual purchased CO₂ cost |
| co2RecyclingRatePct | % | Side-stream recycling rate (`annualFreeCo2UsedKg / annualCO2AvailableKg * 100`); purchased CO₂ excluded |
| annualMethaneProducedTons | t/year | Annual methane output |
| annualHydrogenNeededKg | kg/year | Annual hydrogen demand |
| annualElectricityConsumedMWh | MWh/year | Annual electricity use |
| annualVariableCostEur | EUR/year | Annual OPEX |
| annualCapexCostEur | EUR/year | Annual CAPEX allocation |
| annualTotalCostEur | EUR/year | Annual total cost |
| annualMethaneRevenueEur | EUR/year | Annual methane revenue |
| hydrogenSalesAlternativeRevenueEur | EUR/year | Alternative annual hydrogen sales revenue |
| breakEvenMethanePriceEurPerTon | EUR/t_CH4 | Break-even methane price |
| methanePriceAt10PctProfitabilityEurPerTon | EUR/t_CH4 | Price at 10% markup on cost |
| methanePriceAt30PctProfitabilityEurPerTon | EUR/t_CH4 | Price at 30% markup on cost |
| deltaVsHydrogenSaleEur | EUR/year | Difference vs hydrogen alternative |
| h2CapacityBindingDays | days/year | Days at the finite electrolyzer-derived cap |
| ch4CapacityBindingDays | days/year | Days at the finite methanation-derived cap |

---

## 9. Temporal Harmonization

### 9.1 CO₂ availability harmonization
- `flat_annual` -> converted to daily flat series
- `seasonal_daily` -> generated as daily series from seasonal parameters
- `time_series_daily` -> validated as daily series
- `time_series_hourly` -> aggregated into daily series using `sum`

### 9.2 Electricity price harmonization
- `constant` -> converted to flat daily price series
- `daily_series` -> validated as daily price series
- `hourly_series` -> aggregated into daily price series using arithmetic mean
- `historical_market_data_imported` -> normalized into validated daily or hourly series, then harmonized

### 9.3 Canonical engine inputs
Before calculation begins, the engine must operate on:
- `resolvedDailyCo2SeriesKg`
- `resolvedDailyElectricityPriceSeriesEurPerMWh`

---

## 10. Formula Library

### F-001 Annual CO₂ conversion
`annualCO2Kg = annualCO2KtPerYear * 1000000`

### F-002 Side-stream CO₂ demand per day
`freeCo2DemandKg_day = availableCO2Kg_day * (utilizationRatePct / 100)`

### F-002A Capacity-derived CO₂ throughput caps (WP28)

If the corresponding capacity is `null` or missing, ignore that cap.

`h2DerivedCo2CapKg_day = electrolyzerMaxH2KgPerDay / stoichiometricHydrogenDemandFactor`

`ch4DerivedCo2CapKg_day = methanationMaxCh4KgPerDay / stoichiometricMethaneYieldFactor`

`effectiveCo2CapKg_day = min(defined finite caps)`

If no finite cap exists, `effectiveCo2CapKg_day = Infinity`.

### F-002B Side-stream CO₂ used (WP28)

`freeCo2UsedKg_day = min(freeCo2DemandKg_day, effectiveCo2CapKg_day)`

### F-002C Purchased CO₂ (WP28)

If market purchase is enabled **and** a finite capacity exists:

`purchasedCo2Kg_day = max(0, effectiveCo2CapKg_day - freeCo2UsedKg_day)`

Otherwise:

`purchasedCo2Kg_day = 0`

### F-002D Total process CO₂ feed (WP28)

`usableCO2Kg_day = freeCo2UsedKg_day + purchasedCo2Kg_day`

Legacy scenarios without finite capacity or market purchase collapse to pre-WP28 behaviour: `usableCO2Kg_day = availableCO2Kg_day * utilizationRatePct / 100`.

### F-003 Stoichiometric hydrogen demand
`hydrogenNeededKg_day = usableCO2Kg_day * stoichiometricHydrogenDemandFactor`

### F-004 Stoichiometric methane production
`methaneProducedKg_day = usableCO2Kg_day * stoichiometricMethaneYieldFactor`

### F-005 Electricity consumption
`electricityConsumedMWh_day = hydrogenNeededKg_day * electrolyzerSpecificEnergyConsumptionMWh`

### F-006 Electricity cost
`electricityCostEur_day = electricityConsumedMWh_day * electricityPriceEurPerMWh_day`

### F-007 Variable cost
`variableCostEur_day = electricityCostEur_day + otherOpexAllocatedEur_day + co2PurchaseCostEur_day`

Where:
`otherOpexAllocatedEur_day = otherOpexEurPerYear / 365`

and:
`co2PurchaseCostEur_day = (purchasedCo2Kg_day / 1000) * purchasePriceEurPerTco2`

### F-008 Optional annual CAPEX allocation
If `includeCapex = true`:
`annualCapexCostEur = (electrolyzerCapexEur + methanationCapexEur) / capexLifetimeYears`

Else:
`annualCapexCostEur = 0`

### F-009 Daily CAPEX allocation
`allocatedCapexCostEur_day = annualCapexCostEur / 365`

### F-010 Daily total cost
`totalCostEur_day = variableCostEur_day + allocatedCapexCostEur_day`

### F-011 Methane revenue
`methaneRevenueEur_day = (methaneProducedKg_day / 1000) * methanePriceEurPerTch4`

### F-012 Hydrogen alternative revenue
`hydrogenAlternativeRevenueEur_day = hydrogenNeededKg_day * hydrogenPriceEurPerKg`

Current WP28 semantics: `hydrogenNeededKg_day` is based on **total process CO₂ feed**, including purchased-CO₂ throughput when present.

### F-013 Annual methane output in tons
`annualMethaneProducedTons = sum(methaneProducedKg_day) / 1000`

### F-014 Side-stream CO₂ recycling rate
`co2RecyclingRatePct = annualFreeCo2UsedKg / annualCO2AvailableKg * 100`

Purchased CO₂ does **not** count as recycled side-stream CO₂. If `annualCO2AvailableKg = 0`, the result is `null`.

### F-014A Bottleneck days (WP28)

For each daily row, the H₂ / CH₄ binding flags indicate operation at the corresponding finite cap within calculation tolerance. Annual and monthly bottleneck day counts are sums of those booleans.

### F-015 Break-even methane price
`breakEvenMethanePriceEurPerTon = annualTotalCostEur / annualMethaneProducedTons`

### F-016 Methane price at 10% profitability
`methanePriceAt10PctProfitabilityEurPerTon = (annualTotalCostEur * 1.10) / annualMethaneProducedTons`

### F-017 Methane price at 30% profitability
`methanePriceAt30PctProfitabilityEurPerTon = (annualTotalCostEur * 1.30) / annualMethaneProducedTons`

### F-018 Delta vs hydrogen sale
`deltaVsHydrogenSaleEur = annualMethaneRevenueEur - hydrogenSalesAlternativeRevenueEur`

---

## 11. Validation Rules

### Hard validation
- annual CO₂ must be >= 0
- utilization rate must be 0–100
- methane price must be >= 0
- hydrogen price must be >= 0
- CAPEX values must be >= 0
- CAPEX lifetime must be > 0 if CAPEX included
- plant capacity caps, when provided, must be > 0; `null` / missing means unbounded
- enabled market CO₂ purchase requires a finite, non-negative `purchasePriceEurPerTco2`
- no negative timestep values in temporal series
- hourly series must align to full days when hourly harmonization is used

### Soft warnings
- literature-based defaults in use
- imported historical data contains gaps that required filling
- customer confirmation still pending for business-critical values

(Neutral defaults on **internal** wire fields that are not engine-applied or user-edited in the visible Advanced list — e.g. plant availability / process efficiency while those parameters are not active multipliers — should not be described as user-visible “inactive assumption” problems; see product invariants.)

---

## 12. Error / Edge Cases

| Case | Handling |
|---|---|
| annualCO2 = 0 | calculation allowed, outputs zeroed |
| utilizationRatePct = 0 | no methane production |
| annualMethaneProducedTons = 0 | profitability price KPIs must return null or explicit not-computable state |
| includeCapex = true and lifetime missing | validation error |
| no plant capacity caps | plant throughput is unbounded; market CO₂ purchase, if enabled, has no finite fill target and remains zero |
| plant capacity cap is null/missing | that cap is ignored |
| market purchase disabled/missing | purchased CO₂ and CO₂ purchase cost are zero |
| purchased CO₂ used | total process CO₂ feed may exceed annual available side-stream CO₂; side-stream recycling rate still excludes purchased CO₂ |
| all seasonal weights zero | validation error |
| hourly series not divisible into days | validation error |
| missing electricity price timestep after harmonization | validation error or controlled fill strategy with warning |

---

## 13. Result Contract Direction

The result model must contain:
- raw input snapshot
- resolved daily time series
- assumptions metadata including source flags
- annual summary
- warnings array
- export-ready formatted sections

**Reporting readouts (UI/Excel/PDF):** an **economic verdict** and **assumptions-used** summary may be **derived in the reporting layer** from the existing **`ScenarioSummary` / input** — qualitative interpretation only; **not** additional calculated business columns in `CalculationResult`.

HTTP Excel/PDF export in the shipped app builds file bytes only after server-side validation of `scenario` and a fresh `calculateScenario` run; reporting code maps that result and must not substitute a client-posted result snapshot for engine output.

---

## 14. Testing Readiness

### Shape tests
- validated input shape
- resolved series shape
- result shape
- assumptions metadata shape

### Domain tests
- flat annual CO₂ to daily distribution
- seasonal daily generation
- hourly CO₂ aggregation by sum
- hourly electricity aggregation by arithmetic mean
- CAPEX inclusion and exclusion
- break-even and profitability price formulas
- capacity-derived CO₂ caps
- free vs purchased CO₂ split
- CO₂ purchase cost inclusion in variable and total cost
- side-stream-only recycling rate
- bottleneck day counts
- explicit literature flag presence on locked defaults

### Golden scenarios
Golden scenarios may be added after customer-specific values are confirmed.

---

## 15. Assumptions Used in This Spec

- Daily-first engine is accepted for MVP.
- Arithmetic mean is acceptable for hourly electricity price aggregation in MVP because no dispatch/load model exists yet.
- Stoichiometric methane path is the base model.
- Literature-based defaults are allowed when visibly flagged.
- Profitability prices use markup-on-cost interpretation.