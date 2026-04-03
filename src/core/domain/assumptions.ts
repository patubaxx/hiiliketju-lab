/**
 * Assumption transparency (AGENTS.md, .cursor/rules.md).
 * Reusable for process inputs, economics flags, exports, and UI.
 */

export type AssumptionSource =
  | "customer_provided"
  | "product_locked"
  | "literature_based"
  | "placeholder"
  | "derived";

export type AssumptionStatus =
  | "confirmed"
  | "estimated"
  | "pending_customer_confirmation"
  | "placeholder_only";

export type AssumptionMeta = {
  readonly assumptionSource: AssumptionSource;
  readonly assumptionStatus: AssumptionStatus;
  readonly assumptionNote?: string;
};

/** Numeric (or other) domain value with explicit assumption metadata. */
export type AssumptionValue<T = number> = {
  readonly value: T;
  readonly assumptionMeta: AssumptionMeta;
};

export const INTERNAL_CALCULATION_RESOLUTION = "daily" as const;
export const HOURLY_TO_DAILY_CO2_AGGREGATION = "sum" as const;
export const HOURLY_TO_DAILY_ELECTRICITY_PRICE_AGGREGATION = "arithmetic_mean" as const;
export const MVP_CAPEX_ALLOCATION_METHOD = "simple_lifetime_allocation" as const;

export const META_PRODUCT_LOCKED_DAILY_ENGINE: AssumptionMeta = {
  assumptionSource: "product_locked",
  assumptionStatus: "confirmed",
  assumptionNote: "MVP internal engine operates on daily timesteps.",
};

export const META_PRODUCT_LOCKED_PERIOD: AssumptionMeta = {
  assumptionSource: "product_locked",
  assumptionStatus: "confirmed",
  assumptionNote: "MVP analysis period is a fixed 365-day non-leap year.",
};

export const META_LITERATURE_STOICHIOMETRIC_H2: AssumptionMeta = {
  assumptionSource: "literature_based",
  assumptionStatus: "estimated",
  assumptionNote:
    "Stoichiometric methane-path default for MVP (kg_H2 per kg_CO2 reacted). Replace with project-specific data when available.",
};

export const META_LITERATURE_STOICHIOMETRIC_CH4: AssumptionMeta = {
  assumptionSource: "literature_based",
  assumptionStatus: "estimated",
  assumptionNote:
    "Stoichiometric methane-path default for MVP (kg_CH4 per kg_CO2 reacted). Replace with project-specific data when available.",
};

export const META_LITERATURE_ELECTROLYZER_SEC_KWH: AssumptionMeta = {
  assumptionSource: "literature_based",
  assumptionStatus: "estimated",
  assumptionNote: "Literature-based electrolyzer SEC default for MVP (kWh per kg_H2).",
};

export const META_DERIVED_SEC_MWH: AssumptionMeta = {
  assumptionSource: "derived",
  assumptionStatus: "confirmed",
  assumptionNote: "Derived from electrolyzer SEC in kWh/kg_H2 using 1 MWh = 1000 kWh.",
};

export const META_LITERATURE_PLANT_AVAILABILITY: AssumptionMeta = {
  assumptionSource: "literature_based",
  assumptionStatus: "estimated",
  assumptionNote: "Neutral MVP default until customer-specific plant availability is provided.",
};

export const META_LITERATURE_PROCESS_EFFICIENCY: AssumptionMeta = {
  assumptionSource: "literature_based",
  assumptionStatus: "estimated",
  assumptionNote: "Neutral MVP default until customer-specific process efficiency is provided.",
};

/** Locked MVP default: kg_H2 / kg_CO2 (literature-based). */
export const DEFAULT_STOICHIOMETRIC_HYDROGEN_DEMAND_FACTOR: AssumptionValue<number> = {
  value: 0.1832,
  assumptionMeta: META_LITERATURE_STOICHIOMETRIC_H2,
};

/** Locked MVP default: kg_CH4 / kg_CO2 (literature-based). */
export const DEFAULT_STOICHIOMETRIC_METHANE_YIELD_FACTOR: AssumptionValue<number> = {
  value: 0.3645,
  assumptionMeta: META_LITERATURE_STOICHIOMETRIC_CH4,
};

/** Locked MVP default: kWh / kg_H2 (literature-based). */
export const DEFAULT_ELECTROLYZER_SPECIFIC_ENERGY_CONSUMPTION_KWH_PER_KG_H2: AssumptionValue<number> = {
  value: 54,
  assumptionMeta: META_LITERATURE_ELECTROLYZER_SEC_KWH,
};

/** Locked MVP default: MWh / kg_H2 (derived from kWh). */
export const DEFAULT_ELECTROLYZER_SPECIFIC_ENERGY_CONSUMPTION_MWH_PER_KG_H2: AssumptionValue<number> = {
  value: 0.054,
  assumptionMeta: META_DERIVED_SEC_MWH,
};

export const DEFAULT_PLANT_AVAILABILITY_PCT: AssumptionValue<number> = {
  value: 100,
  assumptionMeta: META_LITERATURE_PLANT_AVAILABILITY,
};

export const DEFAULT_PROCESS_EFFICIENCY_PCT: AssumptionValue<number> = {
  value: 100,
  assumptionMeta: META_LITERATURE_PROCESS_EFFICIENCY,
};

export type ProcessAssumptionsInput = {
  readonly stoichiometricHydrogenDemandFactorKgH2PerKgCo2: AssumptionValue<number>;
  readonly stoichiometricMethaneYieldFactorKgCh4PerKgCo2: AssumptionValue<number>;
  readonly electrolyzerSpecificEnergyConsumptionKwhPerKgH2: AssumptionValue<number>;
  readonly electrolyzerSpecificEnergyConsumptionMwhPerKgH2: AssumptionValue<number>;
  readonly plantAvailabilityPct: AssumptionValue<number>;
  readonly processEfficiencyPct: AssumptionValue<number>;
};

export function defaultProcessAssumptionsInput(): ProcessAssumptionsInput {
  return {
    stoichiometricHydrogenDemandFactorKgH2PerKgCo2: DEFAULT_STOICHIOMETRIC_HYDROGEN_DEMAND_FACTOR,
    stoichiometricMethaneYieldFactorKgCh4PerKgCo2: DEFAULT_STOICHIOMETRIC_METHANE_YIELD_FACTOR,
    electrolyzerSpecificEnergyConsumptionKwhPerKgH2:
      DEFAULT_ELECTROLYZER_SPECIFIC_ENERGY_CONSUMPTION_KWH_PER_KG_H2,
    electrolyzerSpecificEnergyConsumptionMwhPerKgH2:
      DEFAULT_ELECTROLYZER_SPECIFIC_ENERGY_CONSUMPTION_MWH_PER_KG_H2,
    plantAvailabilityPct: DEFAULT_PLANT_AVAILABILITY_PCT,
    processEfficiencyPct: DEFAULT_PROCESS_EFFICIENCY_PCT,
  };
}
